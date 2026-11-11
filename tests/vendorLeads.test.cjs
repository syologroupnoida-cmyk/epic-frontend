const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
if (process.env.VENDOR_LEADS_SIMULATION_URL) process.env.NEXT_PUBLIC_API_BASE_URL = process.env.VENDOR_LEADS_SIMULATION_URL;
const cache = new Map();
function load(relative) {
  let filename = path.resolve(root, relative);
  if (filename.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
  if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map((ext) => filename + ext).find(fs.existsSync);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = new Module(filename); cache.set(filename, module);
  module.filename = filename; module.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = module.require.bind(module);
  module.require = (id) => {
    if (id === 'next/server') return { NextResponse: { next: () => ({ next: true }), redirect: (url) => ({ redirect: String(url) }) } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
    return original(id);
  };
  let source = fs.readFileSync(filename, 'utf8');
  // Match the production React Compiler path so optimized event handlers are covered.
  if (filename.endsWith('LeadList.jsx')) source = require('@babel/core').transformSync(source, { filename, configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] }, plugins: ['babel-plugin-react-compiler'] }).code;
  module._compile(swc.transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
  return module.exports;
}
const model = load('src/util/vendorLeads.mjs');

test('lead navigation resolves its dedicated route and existing vendor protection applies', () => {
  const routes = load('src/util/agentDashboardRoutes.mjs');
  assert.equal(routes.agentPanelPath('Lead List'), '/partner/lead-list');
  assert.equal(routes.agentPanelFromSlug('lead-list'), 'Lead List');
  assert.equal(routes.agentPanelPath('Shared Lead List'), '/partner/shared-lead-list');
  assert.equal(routes.agentPanelPath('Purchased Leads'), '/partner/purchased-leads');
  assert.equal(routes.agentPanelFromSlug('shop-management'), null);
  assert.equal(routes.agentPanelFromSlug('purchased-leads'), 'Purchased Leads');
  const { proxy } = load('src/proxy.js');
  const request = (role) => ({ url: 'http://localhost/partner/lead-list', nextUrl: { pathname: '/partner/lead-list', search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
  assert.equal(proxy(request('VENDOR')).next, true);
  assert.ok(proxy(request('CLIENT')).redirect.includes('/partner/login'));
  const shopRequest = (role) => ({ ...request(role), url: 'http://localhost/dashboard/shop', nextUrl: { pathname: '/dashboard/shop', search: '' } });
  assert.equal(proxy(shopRequest('SUPER_ADMIN')).next, true);
  assert.equal(proxy(shopRequest('ADMIN')).next, true);
  assert.ok(proxy(shopRequest('VENDOR')).redirect.includes('/superadmin/login'));
  assert.ok(proxy(shopRequest('CLIENT')).redirect.includes('/superadmin/login'));
});

test('lead summary resolves nested records and details preserve extra fields, false values and zero counts', () => {
  assert.equal(model.leadSummary({ leadId: 'lead-one', lead: { customerName: 'Test Customer', venueProperty: { title: 'Test Venue' }, guestCount: 0 } }).subject, 'Test Venue');
  assert.equal(model.leadId({ leadId: 'lead-one', id: 'assignment-one' }), 'lead-one');
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { LeadDetailFields } = load('src/components/vendor/LeadDetails.jsx');
  const html = renderToStaticMarkup(React.createElement(LeadDetailFields, { lead: { customerName: 'Test Customer', message: '<script>example</script>', guestCount: 0, metadata: { contacted: false, followUpCount: 0 }, services: ['Photography'] } }));
  for (const text of ['Test Customer', '&lt;script&gt;', 'Guest Count', 'Contacted', 'No', 'Follow Up Count', 'Photography', '>0<']) assert.ok(html.includes(text), text);
});

test('React-compiled lead list safely renders with a closed null menu', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const LeadList = load('src/components/vendor/LeadList.jsx').default;
  const html = renderToStaticMarkup(React.createElement(LeadList));
  assert.ok(html.includes('Lead List')); assert.ok(html.includes('Loading leads')); assert.ok(html.includes('Event date'));
  assert.ok(!html.includes('Customer 1'));
  assert.ok(html.includes('aria-label="Search leads"'));
  const shared = renderToStaticMarkup(React.createElement(LeadList, { shared: true }));
  assert.ok(shared.includes('Shared Lead List'));
  assert.ok(shared.includes('aria-label="Search shared leads"'));
  assert.ok(!shared.includes('>Refresh<'));
  const PurchasedLeadList = load('src/components/vendor/PurchasedLeadList.jsx').default;
  const purchased = renderToStaticMarkup(React.createElement(PurchasedLeadList));
  assert.ok(purchased.includes('Purchased Leads'));
  assert.ok(purchased.includes('aria-label="Search purchased leads"'));
  assert.ok(purchased.includes('aria-label="Purchased vendor leads"'));
  assert.ok(purchased.includes('aria-label="Purchased lead type"'));
  assert.ok(purchased.includes('Direct Lead'));
  assert.ok(purchased.includes('Shared Lead'));
  assert.ok(!html.includes('aria-label="Purchased lead type"'));
  assert.ok(!shared.includes('aria-label="Purchased lead type"'));
});

test('detail fields hide identifiers and slugs throughout nested objects and arrays', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { LeadDetailFields } = load('src/components/vendor/LeadDetails.jsx');
  const html = renderToStaticMarkup(React.createElement(LeadDetailFields, { lead: {
    id: 'hidden-root', leadId: 'hidden-lead', slug: 'hidden-slug', customerName: 'Visible customer',
    listing: { _id: 'hidden-listing', venueSlug: 'hidden-venue-slug', title: 'Visible venue' },
    services: [{ service_id: 'hidden-service', slug: 'hidden-service-slug', name: 'Visible service' }],
    guestCount: 0, metadata: { contacted: false, followUpCount: 0 },
  } }));
  assert.ok(!html.includes('hidden-'));
  for (const value of ['Visible customer', 'Visible venue', 'Visible service', '>0<', '>No<']) assert.ok(html.includes(value), value);
  assert.ok(!html.includes('rounded-xl'));
});

const originalWindow = global.window;
const originalDocument = global.document;
after(() => { if (originalWindow === undefined) delete global.window; else global.window = originalWindow; if (originalDocument === undefined) delete global.document; else global.document = originalDocument; });

test('vendor lead client paginates and reads full details over authenticated HTTP', { skip: !process.env.VENDOR_LEADS_SIMULATION_URL }, async () => {
  const storage = new Map([['epic_access_token', 'lead-vendor-token']]);
  global.window = { localStorage: { getItem: (key) => storage.get(key) || null }, location: { href: 'http://localhost/partner/lead-list' } };
  global.document = { cookie: '' };
  const api = load('src/util/MainApi.js').default;
  const first = await model.fetchVendorLeads(api);
  assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  const second = await model.fetchVendorLeads(api, { page: 2, limit: 20 });
  assert.equal(second.items.length, 5); assert.equal(second.hasNext, false);
  assert.equal(new Set([...first.items, ...second.items].map(model.leadId)).size, 25);
  const searched = await model.fetchVendorLeads(api, { search: '  Customer 25  ' });
  assert.equal(searched.total, 1); assert.equal(searched.hasNext, false);
  assert.equal(searched.items[0].customerName, 'Customer 25');
  assert.equal((await model.fetchVendorLeads(api, { search: 'no-matching-lead' })).total, 0);
  assert.equal((await model.fetchVendorLeads(api, { search: '   ' })).total, 25);
  const sharedSearch = await model.fetchVendorLeads(api, { shared: true, search: ' Shared customer 25 ' });
  assert.equal(sharedSearch.total, 1); assert.equal(sharedSearch.items[0].lead.customerName, 'Shared customer 25');
  const detail = await model.fetchVendorLead(api, model.leadId(first.items[0]));
  assert.equal(detail.customerName, 'Customer 1'); assert.equal(detail.metadata.contacted, false); assert.equal(detail.metadata.followUpCount, 0);
  await assert.rejects(model.fetchVendorLead(api, ''), /lead ID/);
  await assert.rejects(model.fetchVendorLead(api, 'missing'), (error) => error.response.status === 404);
  await assert.rejects(model.fetchVendorLead(api, 'unavailable'), (error) => error.response.status === 503);
  await assert.rejects(model.fetchVendorLead(api, 'invalid'), /unavailable/);
  await assert.rejects(model.fetchVendorLead(api, 'rejected'), /access denied/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(model.fetchVendorLeads(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  storage.clear();
  await assert.rejects(model.fetchVendorLeads(api), (error) => error.response.status === 401);
});

test('shared purchases use the shared ID, preserve error responses and unlock details only after success', { skip: !process.env.VENDOR_LEADS_SIMULATION_URL }, async () => {
  global.window = { localStorage: { getItem: (key) => key === 'epic_access_token' ? 'lead-vendor-token' : null }, location: { href: 'http://localhost/partner/shared-lead-list' } };
  global.document = { cookie: '' };
  const api = load('src/util/MainApi.js').default;
  const first = await model.fetchVendorLeads(api, { shared: true });
  const second = await model.fetchVendorLeads(api, { shared: true, page: 2 });
  assert.equal(first.items.length, 20); assert.equal(second.items.length, 5); assert.equal(second.hasNext, false);
  const row = first.items[0];
  assert.equal(model.sharedLeadId(row), 'shared & one');
  assert.equal(model.leadId(row), 'shared-origin-1');
  assert.equal(model.isLeadPurchased(row), false);
  assert.ok(model.sharedLeadPrice(row).includes('199'));
  await assert.rejects(model.fetchVendorLead(api, model.leadId(row)), (error) => error.response.status === 403);
  const result = await model.purchaseSharedLead(api, model.sharedLeadId(row));
  assert.equal(result.message, 'Lead purchased successfully.');
  assert.equal((await model.fetchVendorLead(api, model.leadId(row))).customerEmail, 'shared@example.com');
  assert.equal(model.isLeadPurchased((await model.fetchVendorLeads(api, { shared: true })).items[0]), true);
  await assert.rejects(model.purchaseSharedLead(api, model.sharedLeadId(row)), (error) => error.response.status === 409);
  await assert.rejects(model.purchaseSharedLead(api, 'unavailable'), (error) => error.response.status === 503);
  await assert.rejects(model.purchaseSharedLead(api, ''), /shared lead ID/);
});

test('direct purchases use the lead ID and refresh purchased status in list and detail reads', { skip: !process.env.VENDOR_LEADS_SIMULATION_URL }, async () => {
  global.window = { localStorage: { getItem: () => 'lead-vendor-token' }, location: { href: 'http://localhost/partner/lead-list' } };
  global.document = { cookie: '' };
  const api = load('src/util/MainApi.js').default;
  const row = (await model.fetchVendorLeads(api)).items[0];
  const id = model.leadId(row);
  assert.equal(model.isLeadPurchased(row), false);
  assert.equal((await model.purchaseVendorLead(api, id)).data.leadId, id);
  assert.equal(model.isLeadPurchased((await model.fetchVendorLeads(api)).items[0]), true);
  assert.equal(model.isLeadPurchased(await model.fetchVendorLead(api, id)), true);
  await assert.rejects(model.purchaseVendorLead(api, id), (error) => error.response.status === 409);
  await assert.rejects(model.purchaseVendorLead(api, 'unavailable'), (error) => error.response.status === 503);
  await assert.rejects(model.purchaseVendorLead(api, ''), /lead ID/);
});


test('purchased list uses authenticated HTTP with pagination, search and cancellation', { skip: !process.env.VENDOR_LEADS_SIMULATION_URL }, async () => {
  global.window = { localStorage: { getItem: () => 'lead-vendor-token' }, location: { href: 'http://localhost/partner/purchased-leads' } };
  global.document = { cookie: '' };
  const api = load('src/util/MainApi.js').default;
  const all = await model.fetchVendorLeads(api, { purchased: true });
  assert.equal(all.items.length, 2);
  assert.equal(all.total, 2);
  assert.ok(all.items.every(model.isLeadPurchased));
  const first = await model.fetchVendorLeads(api, { purchased: true, limit: 1 });
  const second = await model.fetchVendorLeads(api, { purchased: true, limit: 1, page: 2 });
  assert.equal(first.items.length, 1); assert.equal(first.hasNext, true);
  assert.equal(second.items.length, 1); assert.equal(second.hasNext, false);
  assert.notEqual(model.leadId(first.items[0]), model.leadId(second.items[0]));
  const searched = await model.fetchVendorLeads(api, { purchased: true, search: ' Shared customer 1 ' });
  assert.equal(searched.total, 1);
  assert.equal(model.leadSummary(searched.items[0]).customerName, 'Shared customer 1');
  const empty = await model.fetchVendorLeads(api, { purchased: true, search: 'no-matching-lead' });
  assert.equal(empty.total, 0); assert.deepEqual(empty.items, []); assert.equal(empty.hasNext, false);
  const direct = await model.fetchVendorLeads(api, { purchased: true, leadType: 'DIRECT' });
  assert.equal(direct.total, 1);
  assert.equal(model.leadSummary(direct.items[0]).customerName, 'Customer 1');
  const shared = await model.fetchVendorLeads(api, { purchased: true, leadType: 'SHARED' });
  assert.equal(shared.total, 1);
  assert.equal(model.leadSummary(shared.items[0]).customerName, 'Shared customer 1');
  assert.equal((await model.fetchVendorLeads(api, { purchased: true, leadType: 'DIRECT', search: 'Shared customer' })).total, 0);
  assert.equal((await model.fetchVendorLeads(api, { purchased: true, leadType: 'SHARED', search: ' Shared customer 1 ' })).total, 1);
  await model.purchaseSharedLead(api, 'shared-2');
  const sharedPage = await model.fetchVendorLeads(api, { purchased: true, leadType: 'SHARED', page: 2, limit: 1 });
  assert.equal(sharedPage.total, 2); assert.equal(sharedPage.hasNext, false);
  assert.equal(model.leadSummary(sharedPage.items[0]).customerName, 'Shared customer 2');
  const controller = new AbortController(); controller.abort();
  await assert.rejects(model.fetchVendorLeads(api, { purchased: true, signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  global.window.localStorage.getItem = () => null;
  await assert.rejects(model.fetchVendorLeads(api, { purchased: true }), (error) => error.response.status === 401);
});


test('shop management overview renders the sample catalog and dedicated navigation', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Management = load('src/modules/ecommerce/management/ShopManagementDashboard.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Management));
  for (const text of ['Shop Overview', 'Sample catalog preview', 'Catalog Preview']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('href="/shop"'));
  assert.equal((html.match(/<article/g) || []).length, 4);
  for (const activePanel of ['Products', 'Categories', 'Orders']) {
    const panel = renderToStaticMarkup(React.createElement(Management, { activePanel }));
    assert.ok(panel.includes(activePanel));
    if (activePanel === 'Products') assert.ok(panel.includes('Search shop products'));
    if (activePanel === 'Orders') assert.ok(panel.includes('Live orders are not connected yet.'));
  }
});
