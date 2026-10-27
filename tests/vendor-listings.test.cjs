const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');

// Compile the project's ESM helpers with its installed compiler; no network writes.
const root = path.resolve(__dirname, '..');
const calls = [];
let responseQueue = [];
const api = Object.fromEntries(['get', 'post', 'patch', 'delete'].map((method) => [method, async (...args) => {
    calls.push({ method, args });
    return responseQueue.shift() || { data: { success: true, data: { id: 'saved-id' } } };
}]));
const cache = new Map();
function load(relative) {
    let filename = path.resolve(root, relative);
    if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map(ext => filename + ext).find(file => fs.existsSync(file)) || filename + '.js';
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = new Module(filename);
    cache.set(filename, module);
    module.filename = filename;
    module.paths = Module._nodeModulePaths(path.dirname(filename));
    const original = module.require.bind(module);
    module.require = (id) => {
        if (id === '@/util/MainApi') return { __esModule: true, default: api };
        if (id === 'next/server') return { NextResponse: { next: () => ({ next: true }), redirect: (url) => ({ redirect: String(url) }) } };
        if (id.startsWith('@/')) return load(path.join(root, 'src', id.slice(2)));
        if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
        return original(id);
    };
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    module._compile(code, filename);
    return module.exports;
}
const prefix = 'src/components/vendor/listings/';
const { metadataSchemas } = load(prefix + 'metadata/index.js');
const { getMetadataFields, serializeMetadata } = load(prefix + 'metadata/fields.js');
const { buildListingPayload, emptyListing, listingToForm, enrichListingLookups } = load(prefix + 'listingModel.js');
const listingApi = load(prefix + 'listingApi.js');
const propertyApi = load('src/components/vendor/properties/propertyApi.js');
const propertyModel = load('src/components/vendor/properties/propertyModel.js');

function validPropertyForm() {
    return { ...propertyModel.emptyProperty(), title: 'Royal Palace Banquet and Lawn', description: 'A banquet hall and landscaped wedding lawn.', startingPrice: '250000', cityId: 'city-1',
        address: { street: '12 Palace Road', locality: 'Civil Lines', state: 'Delhi', pincode: '110054', country: 'India' },
        capacityMin: '100', capacityMax: '1200', rooms: '18', parkingCapacity: '200',
        amenities: ['Parking', 'Bridal room', 'In-house catering'], venueTypes: [{ id: 'banquet', name: 'Banquet' }, { id: 'lawn', name: 'Lawn' }],
        media: [{ url: 'https://images.example.com/venue.jpg', publicId: 'venue-media-secret', mediaType: 'IMAGE' }],
    };
}

test('property payload matches the supplied contract and preserves false, zero, types and images on edit', () => {
    const form = validPropertyForm();
    const draft = propertyModel.buildPropertyPayload(form, false);
    const review = propertyModel.buildPropertyPayload(form, true);
    assert.deepEqual(Object.keys(draft).sort(), ['title','description','startingPrice','priceType','cityId','address','capacityMin','capacityMax','rooms','parkingCapacity','amenities','metadata','venueTypes','media','submitForReview'].sort());
    assert.equal(draft.startingPrice,250000); assert.equal(draft.capacityMax,1200);
    assert.equal(draft.rooms,18); assert.equal(draft.parkingCapacity,200);
    assert.deepEqual(draft.metadata,{alcoholAllowed:false,outsideCateringAllowed:false});
    assert.deepEqual(draft.venueTypes,['banquet','lawn']);
    assert.equal(draft.submitForReview,false); assert.equal(review.submitForReview,true);
    assert.deepEqual(propertyModel.buildPropertyPayload(propertyModel.propertyToForm(draft),false),draft);
    const zero=propertyModel.buildPropertyPayload({...form,startingPrice:'0',rooms:'0',parkingCapacity:'0',metadata:{...form.metadata,customNote:'Preserve'}},false);
    assert.equal(zero.startingPrice,0); assert.equal(zero.rooms,0); assert.equal(zero.parkingCapacity,0); assert.equal(zero.metadata.customNote,'Preserve');
    assert.throws(()=>propertyModel.buildPropertyPayload({...form,capacityMax:'50'},false),/Maximum capacity/);
    assert.throws(()=>propertyModel.buildPropertyPayload({...form,rooms:'-1'},false),/Rooms/);
    assert.throws(()=>propertyModel.buildPropertyPayload({...form,venueTypes:[]},false),/venue type/);
    assert.throws(()=>propertyModel.buildPropertyPayload({...form,media:[{url:'javascript:alert(1)'}]},false),/HTTP/);
});

test('property CRUD uses supplied endpoints and PATCH never sends submitForReview', async () => {
    calls.length=0;
    const draft=propertyModel.buildPropertyPayload(validPropertyForm(),false);
    await propertyApi.saveProperty('',draft);
    await propertyApi.saveProperty('',{...draft,submitForReview:true});
    await propertyApi.fetchProperty('property/1');
    await propertyApi.saveProperty('property/1',draft);
    await propertyApi.submitProperty('property/1');
    await propertyApi.deleteProperty('property/1');
    await propertyApi.restoreProperty('property/1');
    assert.deepEqual(calls.map(call=>call.method),['post','post','get','patch','post','delete','post']);
    assert.equal(calls[0].args[0],'/vendor/venue-properties');
    assert.equal(calls[0].args[1].submitForReview,false); assert.equal(calls[1].args[1].submitForReview,true);
    assert.equal(calls[2].args[0],'/vendor/venue-properties/property%2F1');
    assert(!Object.hasOwn(calls[3].args[1],'submitForReview'));
    assert.deepEqual(calls[4].args,['/vendor/venue-properties/property%2F1/submit']);
    assert.equal(calls[5].args[0],'/vendor/venue-properties/property%2F1');
    assert.deepEqual(calls[6].args,['/vendor/venue-properties/property%2F1/unarchive',{}]);
    assert.equal(draft.submitForReview,false);
    responseQueue=[{data:{success:false,message:'Property is not ready for review'}}];
    await assert.rejects(propertyApi.submitProperty('property/1'),/not ready for review/);
});

test('property list starts at page one and disables Next at full and short final pages', async () => {
    calls.length=0;
    const signal=new AbortController().signal;
    responseQueue=[{data:{data:{venueProperties:[{id:'property-1'}],pagination:{total:1}}}}];
    assert.deepEqual(await propertyApi.fetchProperties(1,20,signal),{items:[{id:'property-1'}],total:1,hasNextPage:false});
    assert.deepEqual(calls[0].args[1],{params:{page:1,limit:20},signal});
    for(const [length,total,expected] of [[20,20,false],[20,21,true],[2,100,false]]) {
        responseQueue=[{data:{data:{properties:Array.from({length},(_,id)=>({id})),total}}}];
        assert.equal((await propertyApi.fetchProperties()).hasNextPage,expected);
    }
});

test('property venue types use approved VENUE_PROPERTY capabilities without pagination', async () => {
    calls.length=0;
    responseQueue=[{data:{data:{capabilities:[{service:{id:'banquet',name:'Banquet',category:{id:'venues',name:'Wedding venues',offeringKind:'VENUE_PROPERTY'}}}]}}}];
    assert.deepEqual(await propertyApi.fetchPropertyVenueTypes(),[{id:'banquet',name:'Banquet',categoryName:'Wedding venues'}]);
    assert.equal(calls[0].args[0],'/vendor/capabilities');
    assert.deepEqual(calls[0].args[1].params,{offeringKind:'VENUE_PROPERTY'});
});

test('property filters preserve pagination and cancellation and omit empty query values', async () => {
    calls.length = 0;
    const signal = new AbortController().signal;
    await propertyApi.fetchProperties(2, 50, signal, { status: 'DRAFT', search: '  palace  ' });
    assert.equal(calls[0].args[0], '/vendor/venue-properties');
    assert.deepEqual(calls[0].args[1], { params: { page: 2, limit: 50, status: 'DRAFT', search: 'palace' }, signal });
    await propertyApi.fetchProperties(1, 20, signal, { status: '', search: '   ' });
    assert.deepEqual(calls[1].args[1], { params: { page: 1, limit: 20 }, signal });
});

test('property edit hydration preserves nested venue types and all editable values', () => {
    const form=propertyModel.propertyToForm({...propertyModel.buildPropertyPayload(validPropertyForm(),false),venueTypes:[{serviceSubcategory:{id:'banquet',name:'Banquet',category:{name:'Wedding venues'}}}],city:{id:'city-1',name:'Delhi'}});
    assert.deepEqual(form.venueTypes,[{id:'banquet',name:'Banquet',categoryName:'Wedding venues'}]);
    assert.equal(form.city.name,'Delhi'); assert.equal(form.address.pincode,'110054'); assert.equal(form.metadata.alcoholAllowed,false);
});

test('property form, list and details render all supplied fields with the installed MUI version', () => {
    const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
    const {RouterContext}=require('next/dist/shared/lib/router-context.shared-runtime');
    const AddProperty=load('src/components/vendor/AddProperty.jsx').default;
    const PropertyList=load('src/components/vendor/PropertyList.jsx').default;
    const {PropertyDetailContent}=load('src/components/vendor/properties/PropertyDetails.jsx');
    const router={query:{},pathname:'/agent/add-property',isReady:true,push(){},replace(){},prefetch:async()=>{}};
    const warnings=[]; const original=console.error; console.error=(...args)=>warnings.push(args.join(' '));
    try {
        const form=renderToStaticMarkup(React.createElement(RouterContext.Provider,{value:router},React.createElement(AddProperty)));
        for(const text of ['Add Property','Property title','Minimum capacity','Maximum capacity','Outside catering allowed','Alcohol allowed','Venue types','Draft Property','Submit Property','Upload images']) assert(form.includes(text),text);
        const table=renderToStaticMarkup(React.createElement(PropertyList));
        for(const text of ['Property List','Vendor property listings','Starting price','Capacity','Actions','Status','All statuses','aria-label="Search properties"','type="search"']) assert(table.includes(text),text);
        const property=propertyModel.buildPropertyPayload(validPropertyForm(),false);
        const details=renderToStaticMarkup(React.createElement(PropertyDetailContent,{property,venueTypes:[{id:'banquet',name:'Banquet'},{id:'lawn',name:'Lawn'}]}));
        for(const text of ['12 Palace Road','Civil Lines','110054','Banquet','Lawn','Parking','Outside Catering Allowed','No','Property image 1']) assert(details.includes(text),text);
        assert(!details.includes('venue-media-secret')); assert(!details.includes('[object Object]'));
    } finally { console.error=original; }
    assert.deepEqual(warnings,[]);
});

test('property routes stay in the vendor dashboard and are vendor protected', () => {
    const {agentPanelPath}=load('src/util/agentDashboardRoutes.mjs');
    assert.equal(agentPanelPath('Add Property'),'/agent/add-property');
    assert.equal(agentPanelPath('Property List'),'/agent/property-list');
    assert.equal(propertyModel.PROPERTY_ROUTES.edit('property/1'),'/agent/edit-property/property%2F1');
    const {proxy}=load('src/proxy.js');
    for(const pathname of ['/agent/add-property','/agent/property-list','/agent/edit-property/property-1']) {
        const request=(role)=>({nextUrl:{pathname,search:''},url:'http://localhost'+pathname,cookies:{get:key=>({value:key==='epic_auth_role'?role:'token'})}});
        assert(proxy(request('VENDOR')).next);
        assert(proxy(request('CLIENT')).redirect.includes('/agent/login'));
    }
});

test('all 20 service families expose correctly typed base fields and subcategory extras', () => {
    assert.equal(metadataSchemas.length, 20);
    for (const schema of metadataSchemas) {
        const fields = getMetadataFields(schema.name, schema.aliases[0]);
        for (const key of Object.keys(schema.fields)) assert(fields.some((field) => field.key === key), `${schema.name}: ${key}`);
        for (const [subcategory, extra] of Object.entries(schema.extraFields)) {
            const names = getMetadataFields(schema.name, subcategory).map((field) => field.key);
            for (const key of Object.keys(extra)) assert(names.includes(key), `${subcategory}: ${key}`);
        }
    }
    const groom = getMetadataFields('Groom Wear', 'Indo Western').map((field) => field.key);
    assert(groom.includes('accessoriesIncluded'));
    assert(!groom.includes('workType'));
    const guest = getMetadataFields('Wedding Planning Services', 'RSVP Management').map((field) => field.key);
    assert(guest.includes('rsvpMode'));
    assert(!guest.includes('coordinatorCount'));
});

test('metadata keeps false, zero, arrays and unknown edit fields without sample defaults', () => {
    const fields = getMetadataFields('Photography Services', 'Live Streaming', { customNote: 'Keep me' });
    const metadata = serializeMetadata({ droneIncluded: false, reelsIncluded: '0', streamingPlatform: ['YouTube', 'Zoom'], customNote: 'Keep me' }, fields);
    assert.deepEqual(metadata, { droneIncluded: false, reelsIncluded: 0, streamingPlatform: ['YouTube', 'Zoom'], customNote: 'Keep me' });
    assert.deepEqual(serializeMetadata({}, fields), {});
    assert.throws(() => serializeMetadata({ cameraCount: '-2' }, fields), /non-negative/);
});

function validForm() {
    return { ...emptyListing(), title: 'Full Wedding Planning Package', description: 'End-to-end wedding planning.', startingPrice: '150000', cityId: 'city-1', serviceAreaCities: [{ id: 'city-1' }, { id: 'city-2' }, { id: 'city-1' }], metadata: { teamSize: '5', guestCapacity: '500' }, services: [{ categoryId: 'cat-1', categoryName: 'Wedding Planning Services', subcategoryName: 'Wedding Planning', serviceSubcategoryId: 'sub-1', price: '150000', metadata: { durationDays: 2 } }], media: [{ url: 'https://images.example.com/wedding.jpg', publicId: 'listing/image', mediaType: 'IMAGE' }] };
}

test('draft and submit preserve the supplied API shape with real numeric values', () => {
    const form = validForm();
    const draft = buildListingPayload(form, false);
    const submitted = buildListingPayload(form, true);
    assert.equal(draft.submitForReview, false);
    assert.equal(submitted.submitForReview, true);
    assert.equal(draft.startingPrice, 150000);
    assert.deepEqual(draft.metadata, { teamSize: 5, guestCapacity: 500 });
    assert.deepEqual(draft.serviceAreaCityIds, ['city-1', 'city-2']);
    assert.deepEqual(draft.services, [{ serviceSubcategoryId: 'sub-1', price: 150000, metadata: { durationDays: 2 } }]);
    assert(!('categoryId' in draft.services[0]));
    assert.deepEqual(Object.keys(draft).sort(), ['title', 'description', 'startingPrice', 'priceType', 'cityId', 'serviceAreaCityIds', 'metadata', 'services', 'media', 'submitForReview'].sort());
    assert.throws(() => buildListingPayload({ ...form, startingPrice: '' }, false), /Starting price/);
    assert.throws(() => buildListingPayload({ ...form, services: [form.services[0], form.services[0]] }, true), /only be added once/);
    assert.throws(() => buildListingPayload({ ...form, media: [{ url: 'javascript:alert(1)' }] }, true), /HTTP or HTTPS/);
});

test('editing restores IDs, category labels, city selection, media and metadata', () => {
    const original = buildListingPayload(validForm(), false);
    const hydrated = enrichListingLookups(listingToForm(original), [{ id: 'cat-1', name: 'Wedding Planning Services', subcategories: [{ id: 'sub-1', name: 'Wedding Planning' }] }], [{ id: 'city-1', name: 'Delhi' }, { id: 'city-2', name: 'Mumbai' }]);
    assert.equal(hydrated.services[0].categoryId, 'cat-1');
    assert.equal(hydrated.services[0].subcategoryName, 'Wedding Planning');
    assert.equal(hydrated.city.name, 'Delhi');
    assert.equal(hydrated.serviceAreaCities[1].name, 'Mumbai');
    assert.deepEqual(buildListingPayload(hydrated, false), original);
});

test('editing resolves nested service IDs and category/subcategory labels from approved capabilities', () => {
    const categories = [{ id: 'cat-1', name: 'Photography', subcategories: [{ id: 'sub-1', name: 'Candid' }] }];
    for (const service of [
        { service: { id: 'sub-1', name: 'Candid', category: { id: 'cat-1', name: 'Photography' } }, price: 500 },
        { serviceId: 'sub-1', price: 500 },
        { serviceSubcategoryId: 'sub-1', serviceCategoryId: 'outdated-category', price: 500 },
        { serviceSubcategory: { id: 'sub-1' }, serviceCategory: { id: 'cat-1', name: 'Photography' }, price: 500 },
    ]) {
        const form = enrichListingLookups(listingToForm({ services: [service] }), categories, []);
        assert.equal(form.services[0].categoryId, 'cat-1');
        assert.equal(form.services[0].categoryName, 'Photography');
        assert.equal(form.services[0].serviceSubcategoryId, 'sub-1');
        assert.equal(form.services[0].subcategoryName, 'Candid');
    }
});

test('review submission uses only POST listing submit, with no update payload', async () => {
    calls.length = 0;
    responseQueue = [{ data: { success: true, data: { id: 'listing/1', status: 'PENDING_REVIEW' } } }];
    const result = await listingApi.submitListing('listing/1');
    assert.equal(result.status, 'PENDING_REVIEW');
    assert.deepEqual(calls, [{ method: 'post', args: ['/vendor/listings/listing%2F1/submit'] }]);
    responseQueue = [{ data: { success: false, message: 'Cannot submit this listing' } }];
    await assert.rejects(listingApi.submitListing('listing/1'), /Cannot submit/);
});

test('listing transport uses POST create, GET detail, PATCH update, DELETE and POST unarchive', async () => {
    calls.length = 0;
    const payload = buildListingPayload(validForm(), false);
    await listingApi.saveListing('', payload);
    await listingApi.fetchListing('listing/1');
    await listingApi.saveListing('listing/1', { ...payload, submitForReview: true });
    await listingApi.deleteListing('listing/1');
    await listingApi.restoreListing('listing/1');
    assert.deepEqual(calls.map(({ method }) => method), ['post', 'get', 'patch', 'delete', 'post']);
    assert.equal(calls[0].args[0], '/vendor/listings');
    assert.equal(calls[1].args[0], '/vendor/listings/listing%2F1');
    assert.equal(calls[0].args[1].submitForReview, false);
    assert.equal(Object.hasOwn(calls[2].args[1], 'submitForReview'), false);
    const expectedUpdate = { ...payload };
    delete expectedUpdate.submitForReview;
    assert.deepEqual(calls[2].args[1], expectedUpdate);
    assert.equal(payload.submitForReview, false);
    assert.equal(calls[4].args[0], '/vendor/listings/listing%2F1/unarchive');
});

test('listing pagination starts at API page 1 with limit 20 and reads server totals', async () => {
    calls.length = 0;
    responseQueue = [{ data: { success: true, data: { listings: [{ id: 'a' }], pagination: { total: 42 } } } }];
    assert.deepEqual(await listingApi.fetchListings(), { items: [{ id: 'a' }], total: 42 });
    assert.deepEqual(calls[0].args[1].params, { page: 1, limit: 20 });
});

test('lookup pagination loads every city and category using public requests', async () => {
    calls.length = 0;
    responseQueue = [
        { data: { success: true, data: { cities: [{ id: 'city-1', name: 'Delhi' }], pagination: { hasNextPage: true, totalPages: 2 } } } },
        { data: { success: true, data: { cities: [{ id: 'city-2', name: 'Mumbai' }], pagination: { hasNextPage: false, totalPages: 2 } } } },
    ];
    const cities = await listingApi.fetchLookup('/cities');
    assert.equal(cities.length, 2);
    assert.equal(calls[1].args[1].params.page, 2);
    assert.equal(calls[0].args[1].skipAuth, true);
    responseQueue = [{ data: { success: true, data: { id: 'cat-1', subcategories: [{ id: 'sub-1' }] } } }];
    assert.deepEqual(await listingApi.fetchLookup('/service-categories/cat-1'), [{ id: 'sub-1' }]);
});

test('backend failures are exposed and do not become success states', async () => {
    responseQueue = [{ data: { success: false, message: 'Listing could not be saved' } }];
    await assert.rejects(listingApi.saveListing('', {}), /could not be saved/);
});

test('service dropdowns request only offeringKind without unsupported pagination and exclude catalog siblings', async () => {
    calls.length = 0;
    const category = { id: 'cat-1', name: 'Photography', subcategories: [{ id: 'unapproved', name: 'Not approved' }] };
    const capability = (id) => ({ id: `capability-${id}`, service: { id, name: `Service ${id}`, category } });
    responseQueue = [
        { data: { data: { capabilities: [capability('sub-1'), capability('sub-1'), capability('sub-2')] } } },
    ];
    const signal = new AbortController().signal;
    const categories = await listingApi.fetchServiceCapabilities(signal);
    assert.equal(categories.length, 1);
    assert.equal(categories[0].id, 'cat-1');
    assert.deepEqual(categories[0].subcategories.map(item => item.id), ['sub-1', 'sub-2']);
    assert.equal(calls.length, 1);
    calls.forEach((call) => {
        assert.equal(call.args[0], '/vendor/capabilities');
        assert.deepEqual(call.args[1].params, { offeringKind: 'SERVICE' });
        assert.equal(call.args[1].signal, signal);
        assert.notEqual(call.args[1].skipAuth, true);
    });
});

test('empty or failed capabilities never fall back to public categories', async () => {
    calls.length = 0;
    responseQueue = [{ data: { data: { capabilities: [] } } }];
    assert.deepEqual(await listingApi.fetchServiceCapabilities(), []);
    assert.equal(calls.length, 1);
    responseQueue = [{ data: { success: false, message: 'Capabilities unavailable' } }];
    await assert.rejects(listingApi.fetchServiceCapabilities(), /Capabilities unavailable/);
    assert.equal(calls.length, 2);
});


test('service routes stay in the existing Partner dashboard', () => {
 const {VENDOR_SERVICE_ROUTES: routes}=load('src/util/serviceRoutes.js');
 assert.equal(routes.create,'/agent/add-service'); assert.equal(routes.list,'/agent/service-list');
 assert.equal(routes.edit('id/1'),'/agent/edit-service/id%2F1');
 const {agentPanelPath}=load('src/util/agentDashboardRoutes.mjs');
 assert.equal(agentPanelPath('Add Service'),routes.create); assert.equal(agentPanelPath('Service List'),routes.list);
});
test('vendor-only protection covers every service page', () => {
 const {proxy}=load('src/proxy.js');
 for(const pathname of ['/agent/add-service','/agent/service-list','/agent/edit-service/listing-1']) {
  const make=(role,token)=>({nextUrl:{pathname,search:''},url:'http://localhost'+pathname,cookies:{get:key=>({value:({epic_access_token:token,epic_refresh_token:token,epic_auth_role:role})[key]})}});
  assert(proxy(make('', '')).redirect.includes('/agent/login'));
  assert(proxy(make('CLIENT','x')).redirect.includes('/agent/login'));
  assert(proxy(make('VENDOR','x')).next);
 }
});
test('MUI v9 renders the actual form and table with Epic routes', () => {
 const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
 const {RouterContext}=require('next/dist/shared/lib/router-context.shared-runtime');
 const router={query:{},pathname:'/agent/add-service',asPath:'/agent/add-service',isReady:true,push(){},replace(){},prefetch:async()=>{}};
 const AddService=load('src/components/vendor/AddService.jsx').default;
 const ServiceList=load('src/components/vendor/ServiceList.jsx').default;
 const render=Component=>renderToStaticMarkup(React.createElement(RouterContext.Provider,{value:router},React.createElement(Component)));
 const warnings=[]; const originalError=console.error; console.error=(...args)=>warnings.push(args.join(' '));
 try {
 const form=render(AddService); for(const text of ['Draft Listing','Submit Listing','Primary city','Subcategory']) assert(form.includes(text),text);
 assert.equal((form.match(/data-service-form-card/g)||[]).length,1);
 assert(!form.includes('>Service list</'));
 assert(!form.includes('Add media URL'));
 assert(!form.includes('Media URL')); assert(!form.includes('Public ID'));
 assert(/<input\b(?=[^>]*type="file")(?=[^>]*multiple)[^>]*>/.test(form));
 const table=render(ServiceList); for(const text of ['Services List','Search services','Starting price','Actions','table-fixed','divide-slate-200']) assert(table.includes(text),text);
 assert(!table.includes('>Refresh</')); assert(!table.includes('>Add service</'));
 } finally { console.error=originalError; }
 assert.deepEqual(warnings, [], 'The installed MUI version must render without invalid DOM props');
});


test('multiple property image uploads use venue-property-media and retain each image in the payload', async () => {
 calls.length=0;
 responseQueue=[
  {data:{data:{url:'https://images.example.com/venue-one.jpg',publicId:'venue-one'}}},
  {data:{data:{url:'https://images.example.com/venue-two.jpg',publicId:'venue-two'}}},
 ];
 const files=[new File(['one'],'venue-one.jpg',{type:'image/jpeg'}),new File(['two'],'venue-two.jpg',{type:'image/jpeg'})];
 const media=[];
 for(const file of files) media.push(await listingApi.uploadListingImage(file,'venue-property-media'));
 calls.forEach((call,index)=>{
  assert.equal(call.args[0],'/uploads/image');
  assert.equal(call.args[1].get('purpose'),'venue-property-media');
  assert.equal(call.args[1].get('file').name,files[index].name);
 });
 assert.equal(calls.length,2);
 const payload=propertyModel.buildPropertyPayload({...validPropertyForm(),media},false);
 assert.deepEqual(payload.media.map(item=>item.publicId),['venue-one','venue-two']);
});

test('multiple image uploads use listing-media and retain every uploaded image in the payload', async () => {
 calls.length = 0;
 responseQueue = [
  {data:{success:true,data:{url:'https://images.example.com/one.jpg',publicId:'image-one'}}},
  {data:{success:true,data:{url:'https://images.example.com/two.jpg',publicId:'image-two'}}},
 ];
 const files = [new File(['one'], 'one.jpg', {type:'image/jpeg'}), new File(['two'], 'two.jpg', {type:'image/jpeg'})];
 const media=[];
 for (const file of files) media.push(await listingApi.uploadListingImage(file));
 assert.equal(calls.length, 2);
 calls.forEach((call,index) => {
  assert.equal(call.method,'post'); assert.equal(call.args[0],'/uploads/image');
  assert.equal(call.args[1].get('purpose'),'listing-media');
  assert.equal(call.args[1].get('file').name,files[index].name);
 });
 const payload=buildListingPayload({...validForm(),media},false);
 assert.equal(payload.media.length,2);
 assert.deepEqual(payload.media.map(image=>image.publicId),['image-one','image-two']);
 assert(payload.media.every(image=>image.mediaType==='IMAGE'));
});


test('portfolio previews hide upload identifiers and remove only the selected media from the payload', () => {
 const React = require('react');
 const {renderToStaticMarkup} = require('react-dom/server');
 const Gallery = load('src/components/vendor/listings/ListingMediaGallery.jsx').default;
 const media = [
  {url:'https://images.example.com/one.jpg', publicId:'private-image-one', mediaType:'IMAGE'},
  {url:'https://images.example.com/two.jpg', publicId:'private-image-two', mediaType:'IMAGE'},
 ];
 let remaining = media;
 const props = {media, onRemove:index => { remaining = remaining.filter((_, i) => i !== index); }};
 const markup = renderToStaticMarkup(React.createElement(Gallery, props));
 assert(markup.includes('alt="Portfolio image 1"'));
 assert(markup.includes('alt="Portfolio image 2"'));
 assert(markup.includes('aria-label="Remove portfolio image 1"'));
 assert(!markup.includes('private-image-one')); assert(!markup.includes('private-image-two'));
 assert(!markup.includes('<input')); assert(!markup.includes('Public ID')); assert(!markup.includes('Media URL'));
 const cards = Gallery(props).props.children;
 cards[0].props.children[1].props.onClick();
 const payload = buildListingPayload({...validForm(), media:remaining}, false);
 assert.deepEqual(payload.media, [media[1]]);
 assert.equal(Gallery({...props, disabled:true}).props.children[0].props.children[1].props.disabled, true);
});


test('listing searches use the API search parameter with pagination, status and cancellation', async () => {
 calls.length = 0;
 const controller = new AbortController();
 await listingApi.fetchListings(1, 20, 'DRAFT', controller.signal, '  photographer  ');
 assert.deepEqual(calls[0].args[1].params, {page:1, limit:20, status:'DRAFT', search:'photographer'});
 assert.equal(calls[0].args[1].signal, controller.signal);
 await listingApi.fetchListings(1, 20, '', controller.signal, '   ');
 assert.deepEqual(calls[1].args[1].params, {page:1, limit:20});
});
