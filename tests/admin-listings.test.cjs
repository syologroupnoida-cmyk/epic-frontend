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
    if (filename.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (/\.(png|jpe?g|webp|svg)$/.test(filename)) return { __esModule: true, default: { src: `/images/${path.basename(filename)}`, width: 100, height: 100 } };
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
const admin = load('src/util/adminListings.mjs');
const adminProperties = load('src/util/adminProperties.mjs');

test('marketplace selection combines checkbox matches, deduplicates, loads further pages, and preserves failures', {skip: !process.env.MARKETPLACE_APP_URL}, async () => {
 const original=global.fetch;
 global.fetch=(url, options)=>original(new URL(url,process.env.MARKETPLACE_APP_URL),options);
 try {
  const {loadMarketplaceSelection}=load('src/util/marketplaceSelection.mjs');
  const combined=await loadMarketplaceSelection({venue:true,subcategoryIds:['banquet-demo','garden-demo','banquet-demo']});
  assert.equal(combined.total,2); assert.equal(combined.combined,true);
  assert.equal(new Set(combined.items.map(item=>item.id)).size,2);
  const paged=await loadMarketplaceSelection({venue:true,subcategoryIds:['banquet-demo','paged-demo']});
  assert.equal(paged.total,22); assert(paged.items.some(item=>item.id==='paged-20'));
  const city=await loadMarketplaceSelection({venue:true,subcategoryIds:['banquet-demo','garden-demo'],cityId:'another-city'});
  assert.equal(city.total,0);
  const search=await loadMarketplaceSelection({venue:true,subcategoryIds:['banquet-demo','garden-demo'],search:'Garden'});
  assert.deepEqual(search.items.map(item=>item.title),['Garden venue']);
  await assert.rejects(loadMarketplaceSelection({venue:true,subcategoryIds:['banquet-demo','error-demo']}),/unavailable/);
  const controller=new AbortController(); controller.abort();
  await assert.rejects(loadMarketplaceSelection({venue:true,subcategoryIds:['banquet-demo','garden-demo']},controller.signal),{name:'AbortError'});
 } finally { global.fetch=original; }
});

test('venue cards link by slug and venue details render public fields without internal status', () => {
 const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
 const collection=JSON.parse(fs.readFileSync(path.join(root,'postman/collections/marketplace-venues.postman_collection.json'),'utf8'));
 const property=JSON.parse(collection.item[1].response[0].body).data;
 const {VenueCard}=load('src/components/common/MarketplaceVenues.jsx');
 const Detail=load('src/components/common/VenueListingDetail.jsx').default;
 const card=renderToStaticMarkup(React.createElement(VenueCard,{property}));
 for(const text of ['/venues/palace-venue','Palace venue','Banquet','500']) assert(card.includes(text),text);
 const details=renderToStaticMarkup(React.createElement(Detail,{property}));
 for(const text of ['Palace venue','Palace Events','Banquet','Minimum capacity','Maximum capacity','Rooms','Parking capacity','Bridal room','Alcohol Allowed','No','Outside Catering Allowed','Yes','12 Palace Road','160001','View on map']) assert(details.includes(text),text);
 assert(!details.includes('[object Object]')); assert(!details.includes('DRAFT'));
});

test('venue API route forwards filters and loads slug details over real HTTP', {skip: !process.env.VENUE_SIMULATION_URL}, async () => {
 const previous=process.env.MARKETPLACE_VENUES_API_URL;
 process.env.MARKETPLACE_VENUES_API_URL=process.env.VENUE_SIMULATION_URL;
 try {
  const handler=load('src/pages/api/marketplace/venue-properties/[[...slug]].js').default;
  const {requestVenues}=load('src/util/marketplaceVenues.mjs');
  const res={setHeader(){},status(value){this.statusCode=value;return this;},json(value){this.body=value;return this;}};
  await handler({method:'GET',query:{page:'1',limit:'20',search:'Palace',cityId:'city-demo',serviceSubcategoryId:'banquet-demo',ignored:'no'}},res);
  assert.equal(res.statusCode,200); assert.equal(res.body.data.venueProperties[0].slug,'palace-venue');
  await handler({method:'GET',query:{slug:['palace-venue']}},res);
  assert.equal(res.statusCode,200); assert.equal(res.body.data.title,'Palace venue');
  await handler({method:'GET',query:{slug:['missing-venue']}},res);
  assert.equal(res.statusCode,404);
  await assert.rejects(requestVenues(`${process.env.VENUE_SIMULATION_URL}/missing-venue`),/Venue not found/);
  for(const query of [{page:'0'},{limit:'101'},{slug:['one','two']}]) {
   await handler({method:'GET',query},res); assert.equal(res.statusCode,400);
  }
  await handler({method:'POST',query:{}},res); assert.equal(res.statusCode,405);
 } finally {
  if(previous === undefined) delete process.env.MARKETPLACE_VENUES_API_URL;
  else process.env.MARKETPLACE_VENUES_API_URL=previous;
 }
});

test('admin properties default to all statuses and filter only when a status is selected', async () => {
 calls.length=0;
 responseQueue=[{data:{data:{venueProperties:[{id:'property-1',status:'PENDING_REVIEW'}],pagination:{total:1}}}}];
 const result=await adminProperties.fetchAdminProperties();
 assert.equal(calls[0].args[0],'/admin/venue-properties');
 assert.deepEqual(calls[0].args[1].params,{page:1,limit:20});
 assert.equal(result.items[0].id,'property-1'); assert.equal(result.total,1); assert.equal(result.hasNextPage,false);
 const signal=new AbortController().signal;
 await adminProperties.fetchAdminProperties({page:2,limit:50,status:'PENDING_REVIEW'},signal);
 assert.deepEqual(calls[1].args[1],{params:{page:2,limit:50,status:'PENDING_REVIEW'},signal});
 await adminProperties.fetchAdminProperties({page:1,limit:20,status:'ACTIVE',search:'  Royal Palace  '},signal);
 assert.deepEqual(calls[2].args[1],{params:{page:1,limit:20,status:'ACTIVE',search:'Royal Palace'},signal});
});

test('admin property details and moderation use only the supplied admin endpoints', async () => {
 calls.length=0;
 responseQueue=[{data:{data:{venueProperty:{venuePropertyId:'venue/1',title:'Royal Palace'}}}}];
 const property=await adminProperties.fetchAdminProperty('venue/1');
 assert.equal(property.title,'Royal Palace'); assert.equal(adminProperties.adminPropertyId(property),'venue/1');
 assert.equal(calls[0].method,'get'); assert.equal(calls[0].args[0],'/admin/venue-properties/venue%2F1');
 await adminProperties.moderateAdminProperty('venue/1','approve');
 await adminProperties.moderateAdminProperty('venue/1','reject','  Update the property images  ');
 assert.deepEqual(calls[1],{method:'post',args:['/admin/venue-properties/venue%2F1/approve',{}]});
 assert.deepEqual(calls[2],{method:'post',args:['/admin/venue-properties/venue%2F1/reject',{reason:'Update the property images'}]});
});

test('property review blocks invalid requests and exposes real API errors', async () => {
 calls.length=0;
 await assert.rejects(adminProperties.moderateAdminProperty('venue-1','reject',' '),/reason is required/);
 await assert.rejects(adminProperties.moderateAdminProperty('','approve'),/ID is missing/);
 await assert.rejects(adminProperties.moderateAdminProperty('venue-1','delete'),/Unsupported/);
 assert.equal(calls.length,0);
 responseQueue=[{data:{success:false,message:'Property cannot be approved'}}];
 await assert.rejects(adminProperties.moderateAdminProperty('venue-1','approve'),/Property cannot be approved/);
 responseQueue=[{data:{success:false,message:'Property not found'}}];
 await assert.rejects(adminProperties.fetchAdminProperty('venue-1'),/Property not found/);
 assert.deepEqual(adminProperties.propertyReviewActions({status:'PENDING_REVIEW'}),['approve','reject']);
 for(const status of ['ACTIVE','REJECTED','DRAFT','ARCHIVED']) assert.deepEqual(adminProperties.propertyReviewActions({status}),[]);
});

test('admin property pagination disables Next without evidence of further data', async () => {
 for(const [length,pagination,expected] of [[19,{total:100},false],[20,{total:20},false],[20,{total:21},true],[20,{hasNextPage:true},true],[20,{},false]]) {
  responseQueue=[{data:{data:{properties:Array.from({length},(_,id)=>({id})),pagination}}}];
  assert.equal((await adminProperties.fetchAdminProperties()).hasNextPage,expected);
 }
});

test('admin property list and shared details render full property data and all-status filter', () => {
 const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
 const List=load('src/components/superadmin/PropertyListingList.jsx').default;
 const {PropertyDetailContent}=load('src/components/common/PropertyDetailContent.jsx');
 const warnings=[]; const original=console.error; console.error=(...args)=>warnings.push(args.join(' '));
 try {
  const table=renderToStaticMarkup(React.createElement(List));
  for(const text of ['Property List','Admin property listings','All statuses','Search properties','Vendor','Status','Starting price']) assert(table.includes(text),text);
  const details=renderToStaticMarkup(React.createElement(PropertyDetailContent,{property:{
   status:'PENDING_REVIEW',startingPrice:0,city:{name:'Delhi'},capacityMin:100,capacityMax:1200,rooms:0,parkingCapacity:200,
   description:'Banquet hall and landscaped lawn',address:{street:'12 Palace Road',locality:'Civil Lines',state:'Delhi',pincode:'110054',country:'India'},
   venueTypes:[{serviceSubcategory:{id:'banquet',name:'Banquet'}},{service:{id:'lawn',name:'Lawn'}}],amenities:['Parking','Bridal room'],
   metadata:{alcoholAllowed:false,outsideCateringAllowed:false},media:[{url:'https://images.example.com/property.jpg',publicId:'secret-media-id',mediaType:'IMAGE'}],
  }}));
  for(const text of ['Banquet','Lawn','12 Palace Road','Civil Lines','110054','Minimum capacity','Maximum capacity','Alcohol Allowed','No','Parking','Property image 1']) assert(details.includes(text),text);
  assert(!details.includes('secret-media-id')); assert(!details.includes('[object Object]'));
 } finally {console.error=original;}
 assert.deepEqual(warnings,[]);
});

test('superadmin property navigation uses its own property review page and admin protection', () => {
 const source=fs.readFileSync(path.join(root,'src/components/dashboard/SuperAdminDashboard.jsx'),'utf8');
 assert(source.includes('"Property List": PropertyListingList')); assert(source.includes('"Property List": "property-listings"'));
 const {proxy}=load('src/proxy.js');
 for(const role of ['VENDOR','CLIENT','ADMIN','SUPER_ADMIN']) {
  const request={nextUrl:{pathname:'/superadmin/property-listings',search:''},url:'http://localhost/superadmin/property-listings',cookies:{get:key=>({value:key==='epic_auth_role'?role:'token'})}};
  assert.equal(Boolean(proxy(request).next),['ADMIN','SUPER_ADMIN'].includes(role));
 }
});

test('admin list defaults to all SERVICE statuses and keeps search, pagination and cancellation', async () => {
 calls.length = 0;
 responseQueue = [{data:{success:true,data:{listings:[{id:'listing-1',status:'PENDING_REVIEW'}],pagination:{total:45}}}}];
 const result = await admin.fetchAdminListings();
 assert.equal(calls[0].args[0], '/admin/listings');
 assert.deepEqual(calls[0].args[1].params, {page:1,limit:20,listingType:'SERVICE'});
 assert.equal(result.total,45); assert.equal(result.items[0].id,'listing-1');
 const controller = new AbortController();
 await admin.fetchAdminListings({page:2,limit:50,status:'PAUSED',search:'  wedding  '},controller.signal);
 assert.deepEqual(calls[1].args[1].params,{page:2,limit:50,status:'PAUSED',search:'wedding',listingType:'SERVICE'});
 assert.equal(calls[1].args[1].signal,controller.signal);
 await admin.fetchAdminListings({status:''});
 assert(!Object.hasOwn(calls[2].args[1].params,'status'));
});

test('admin next-page availability requires enough rows and evidence of another page', async () => {
 for (const [length, pagination, page, expected] of [
  [19,{total:100},1,false], [20,{total:20},1,false], [20,{total:21},1,true],
  [20,{total:40},2,false], [20,{},1,false], [20,{hasNextPage:true},1,true],
  [20,{hasNextPage:false},1,false], [0,{total:0},1,false],
 ]) {
  responseQueue = [{data:{data:{items:Array.from({length},(_,id)=>({id})),pagination}}}];
  assert.equal((await admin.fetchAdminListings({page,limit:20})).hasNextPage,expected);
 }
});

test('marketplace proxy forwards only supported list filters and fetches details by slug', async (t) => {
 const handler=load('src/pages/api/marketplace/listings/[[...slug]].js').default;
 const originalFetch=global.fetch; t.after(()=>{global.fetch=originalFetch;});
 const requests=[];
 global.fetch=async (url)=>{requests.push(String(url));return {status:200,json:async()=>({success:true,data:{listings:[]}})};};
 const res={setHeader(){},status(value){this.statusCode=value;return this;},json(value){this.body=value;return this;}};
 await handler({method:'GET',query:{page:'1',limit:'20',search:'Wedding',cityId:'city-1',serviceSubcategoryId:'sub-1',unexpected:'ignored'}},res);
 const url=new URL(requests[0]);
 assert.equal(url.pathname,'/api/v1/marketplace/listings');
 assert.deepEqual(Object.fromEntries(url.searchParams),{page:'1',limit:'20',search:'Wedding',cityId:'city-1',serviceSubcategoryId:'sub-1'});
 await handler({method:'GET',query:{slug:['wedding/package']}},res);
 assert.equal(new URL(requests[1]).pathname,'/api/v1/marketplace/listings/wedding%2Fpackage');
 await handler({method:'GET',query:{page:'0'}},res);
 assert.equal(res.statusCode,400); assert.equal(requests.length,2);
 await handler({method:'POST',query:{}},res); assert.equal(res.statusCode,405);
});

test('public service cards link by slug and details show all returned services and metadata', () => {
 const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
 const {ServiceListingCard}=load('src/components/common/MarketplaceServices.jsx');
 const {ServiceDetailContent}=load('src/components/templates/ServiceDetailPage.jsx');
 const listing={id:'1',slug:'wedding-photography',title:'Wedding photography package',startingPrice:15000,description:'A full day of photography.',
  city:{name:'Delhi'},serviceAreaCities:[{city:{name:'Mumbai'}}],vendor:{businessName:'Studio One'},
  metadata:{teamSize:0,droneIncluded:false},services:[
   {service:{name:'Candid photography',category:{name:'Photography'}},price:0,metadata:{durationDays:2}},
   {serviceSubcategory:{name:'Wedding film',serviceCategory:{name:'Videography'}},price:5000},
  ]};
 const card=renderToStaticMarkup(React.createElement(ServiceListingCard,{listing}));
 assert(card.includes('/services/wedding-photography')); assert(card.includes('Wedding photography package'));
 const detail=renderToStaticMarkup(React.createElement(ServiceDetailContent,{listing}));
 for(const text of ['Candid photography','Photography','Wedding film','Videography','Studio One','Delhi','Mumbai','Drone Included','No','Duration Days']) assert(detail.includes(text),text);
 assert(!detail.includes('[object Object]'));
});

test('details and all four moderation endpoints use the supplied ID and payload', async () => {
 calls.length = 0;
 responseQueue = [{data:{success:true,data:{listing:{id:'listing/1',title:'Photography'}}}}];
 const detail = await admin.fetchAdminListing('listing/1');
 assert.equal(detail.title,'Photography');
 assert.equal(calls[0].method,'get');
 assert.equal(calls[0].args[0],'/admin/listings/listing%2F1');
 for (const action of ['approve','reject','pause','resume']) await admin.moderateServiceListing('listing/1',action,'  Update portfolio  ');
 for (const [index,action] of ['approve','reject','pause','resume'].entries()) {
  assert.equal(calls[index+1].method,'post');
  assert.equal(calls[index+1].args[0],`/admin/listings/listing%2F1/${action}`);
  assert.deepEqual(calls[index+1].args[1],['reject','pause'].includes(action)?{reason:'Update portfolio'}:{});
 }
});

test('invalid moderation requests never reach the API and backend errors remain failures', async () => {
 calls.length=0;
 await assert.rejects(admin.moderateServiceListing('id','reject',' '),/reason is required/);
 await assert.rejects(admin.moderateServiceListing('id','pause',''),/reason is required/);
 await assert.rejects(admin.moderateServiceListing('','approve'),/ID is missing/);
 await assert.rejects(admin.moderateServiceListing('id','delete'),/Unsupported/);
 assert.equal(calls.length,0);
 responseQueue=[{data:{success:false,message:'Listing cannot be approved'}}];
 await assert.rejects(admin.moderateServiceListing('id','approve'),/cannot be approved/);
 responseQueue=[{data:{success:false,message:'Access denied'}}];
 await assert.rejects(admin.fetchAdminListing('id'),/Access denied/);
});

test('row and detail moderation actions follow the service status', () => {
 assert.deepEqual(admin.serviceListingActions({status:'PENDING_REVIEW'}),['approve','reject']);
 for(const status of ['APPROVED','ACTIVE','PUBLISHED']) assert.deepEqual(admin.serviceListingActions({status}),['pause']);
 assert.deepEqual(admin.serviceListingActions({status:'PAUSED'}),['resume']);
 for(const status of ['DRAFT','REJECTED','ARCHIVED','unexpected']) assert.deepEqual(admin.serviceListingActions({status}),[]);
});

test('superadmin navigation exposes the service queue without replacing category management', () => {
 const source=fs.readFileSync(path.join(root,'src/components/dashboard/SuperAdminDashboard.jsx'),'utf8');
 assert(source.includes('"Service List": ServiceListingList'));
 assert(source.includes('"Service List": "service-listings"'));
 assert(source.includes('"Services List": ServiceCategoryList'));
 const {proxy}=load('src/proxy.js');
 for(const role of ['', 'VENDOR','CLIENT','ADMIN','SUPER_ADMIN']) {
  const request={nextUrl:{pathname:'/superadmin/service-listings',search:''},url:'http://localhost/superadmin/service-listings',cookies:{get:key=>({value:key==='epic_auth_role'?role:'token'})}};
  const result=proxy(request);
  assert.equal(Boolean(result.next),['ADMIN','SUPER_ADMIN'].includes(role));
 }
});

test('admin table and complete service details render with the installed MUI version', () => {
 const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
 const List=load('src/components/superadmin/ServiceListingList.jsx').default;
 const {ServiceListingDetailContent}=load('src/components/superadmin/ServiceListingDetails.jsx');
 const warnings=[]; const original=console.error; console.error=(...args)=>warnings.push(args.join(' '));
 try {
  const table=renderToStaticMarkup(React.createElement(List));
  for(const text of ['Service Listings','Search service listings','Starting price','Actions','All statuses']) assert(table.includes(text),text);
  const details=renderToStaticMarkup(React.createElement(ServiceListingDetailContent,{listing:{
   title:'Photography',status:'PENDING_REVIEW',startingPrice:20000,priceType:'STARTING_FROM',description:'Wedding photography',
   vendor:{companyName:'Studio One',email:'studio@example.com'},city:{name:'Delhi'},serviceAreaCities:[{city:{name:'Mumbai'}}],
   metadata:{teamSize:0,droneIncluded:false},services:[
    {serviceSubcategory:{name:'Wedding Photography',category:{name:'Photography Category'}},price:0,metadata:{durationDays:2}},
    {service:{name:'Bridal Makeup',category:{name:'Makeup Category'}},price:1000},
    {subcategory:{name:'Flower Decor',serviceCategory:{name:'Decoration Category'}},price:2000},
   ],
   media:[{url:'https://images.example.com/one.jpg',publicId:'private-id',mediaType:'IMAGE'}],
  }}));
  for(const text of ['Wedding photography','Studio One','studio@example.com','Delhi','Mumbai','Drone Included','No','Wedding Photography','Duration Days','Service image 1','Photography Category','Bridal Makeup','Makeup Category','Flower Decor','Decoration Category']) assert(details.includes(text),text);
  assert(!details.includes('private-id')); assert(!details.includes('[object Object]'));
 } finally { console.error=original; }
 assert.deepEqual(warnings,[]);
});
