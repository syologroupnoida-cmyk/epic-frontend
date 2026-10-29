const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
if (process.env.ADMIN_LEADS_SIMULATION_URL) process.env.NEXT_PUBLIC_API_BASE_URL = process.env.ADMIN_LEADS_SIMULATION_URL;
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
const model = load('src/util/adminLeads.mjs');
const nestedLead = {
  id: 'nested-lead-test', leadType: 'DIRECT', sourceType: 'SERVICE_LISTING', status: 'ACTIVE',
  customer: { name: 'Test Customer', phone: '9876543210', email: null },
  requirement: {
    city: { id: 'city-agra', name: 'Agra', slug: 'agra-uttar-pradesh-in', stateName: 'Uttar Pradesh', countryCode: 'IN' },
    category: null, subcategory: null, eventDate: '2026-10-30T00:00:00.000Z', guestCount: 200,
    budgetMin: null, budgetMax: null, message: 'Venue and vendor booking: wedding plan',
  },
  source: { type: 'SERVICE_LISTING', id: 'listing-test', title: 'Professional Dance Group for Weddings & Events', slug: 'dance-group-test' },
  targetVendor: { userId: 'vendor-test', businessName: 'Wedding Source', slug: 'wedding-source-test', logoUrl: 'https://images.example.test/vendor-logo.png' },
  pricing: { basePrice: null, maxBuyerCount: 1, soldCount: 0 },
  review: { reviewedAt: null, reviewedByAdminId: null, rejectionReason: null },
  closure: { closedAt: null, closedByAdminId: null, reason: null },
  expiresAt: null, createdAt: '2026-10-28T11:58:09.579Z', updatedAt: '2026-10-28T11:58:09.579Z',
};

test('admin lead table resolves the supplied nested response and leaves missing values empty', () => {
  const summary = model.adminLeadSummary(nestedLead);
  assert.equal(summary.customerName, 'Test Customer'); assert.equal(summary.customerPhone, '9876543210');
  assert.equal(summary.customerEmail, ''); assert.equal(summary.subject, nestedLead.source.title);
  assert.equal(summary.city, 'Agra, Uttar Pradesh'); assert.equal(summary.guestCount, 200);
  assert.equal(summary.eventDate, '2026-10-30T00:00:00.000Z');
  assert.equal(model.adminLeadSummary({ requirement: { guestCount: 0 } }).guestCount, 0);
  for (const value of Object.values(model.adminLeadSummary({}))) assert.equal(value, '');
});

test('lead details use property-style sections and preserve nested source, customer, pricing and lifecycle data', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Content = load('src/components/superadmin/LeadDetailContent.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Content, { lead: { ...nestedLead, extra: { verified: false } } }));
  for (const text of ['Test Customer', '9876543210', 'Agra', 'Uttar Pradesh', '30 Oct 2026', '200', 'Professional Dance Group', 'Wedding Source', 'Pricing', 'Review', 'Closure', 'Not provided', '>0<', 'No']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('[object Object]'));
  assert.ok(!html.includes('rounded-xl'));
  assert.match(html, /<img[^>]+src="https:\/\/images\.example\.test\/vendor-logo\.png"/);
  const visibleText = html.replace(/<[^>]*>/g, ' ');
  for (const hidden of ['vendor-test', 'wedding-source-test', 'dance-group-test', 'agra-uttar-pradesh-in', 'User Id', 'Slug', 'https://images.example.test/vendor-logo.png']) assert.ok(!visibleText.includes(hidden), hidden);
});

test('activation requires a valid price and positive integer buyer count; rejection and closure need reasons', () => {
  assert.deepEqual(model.validateLeadAction('activate', { basePrice: 100, maxBuyerCount: 5 }), {});
  assert.deepEqual(model.validateLeadAction('activate', { basePrice: 0, maxBuyerCount: 1 }), {});
  for (const basePrice of ['', ' ', -1, 'invalid', Infinity]) assert.ok(model.validateLeadAction('activate', { basePrice, maxBuyerCount: 5 }).basePrice);
  for (const maxBuyerCount of ['', 0, -1, 1.5, Infinity]) assert.ok(model.validateLeadAction('activate', { basePrice: 100, maxBuyerCount }).maxBuyerCount);
  for (const action of ['reject', 'close']) {
    assert.ok(model.validateLeadAction(action, { reason: ' ' }).reason);
    assert.deepEqual(model.validateLeadAction(action, { reason: 'Valid reason' }), {});
  }
  assert.throws(() => model.validateLeadAction('delete'), /Unsupported/);
});

test('lead action dropdown includes icons and opens only actions allowed by the lead status', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { LeadMenuItems } = load('src/components/superadmin/LeadList.jsx');
  const MenuList = require('@mui/material/MenuList').default;
  const render = (lead) => renderToStaticMarkup(React.createElement(MenuList, null, React.createElement(LeadMenuItems, { lead, onSelect() {} })));
  const pending = render({ status: 'PENDING_REVIEW' });
  for (const text of ['View detail', 'Activate', 'Reject', 'Close']) assert.ok(pending.includes(text), text);
  assert.equal((pending.match(/<svg/g) || []).length, 4);
  assert.equal((pending.match(/aria-disabled="true"/g) || []).length, 0);
  assert.deepEqual(model.adminLeadActions({ status: 'ACTIVE' }), ['activate', 'reject', 'close']);
  assert.equal((render({ status: 'ACTIVE' }).match(/aria-disabled="true"/g) || []).length, 0);
  assert.deepEqual(model.adminLeadActions({ status: 'CLOSED' }), ['activate', 'reject']);
  assert.deepEqual(model.adminLeadActions({ status: 'REJECTED' }), ['activate', 'reject']);
  assert.equal((render(null).match(/aria-disabled="true"/g) || []).length, 4);
  const direct = render({ status: 'ACTIVE', leadType: 'DIRECT' });
  assert.deepEqual(model.adminLeadActions({ status: 'ACTIVE', leadType: 'DIRECT' }), ['close']);
  assert.deepEqual(model.adminLeadActions({ status: 'CLOSED', leadType: 'DIRECT' }), []);
  assert.equal((direct.match(/role="menuitem"/g) || []).length, 2);
  assert.ok(!direct.includes('>Activate<')); assert.ok(!direct.includes('>Reject<'));
});

test('compiled admin lead table renders only All, Pending Review and Shared tabs with KYC-style search', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const LeadList = load('src/components/superadmin/LeadList.jsx').default;
  const html = renderToStaticMarkup(React.createElement(LeadList));
  for (const text of ['Lead List', 'Pending Review', 'Shared', 'Search leads', 'Loading leads', 'lead-tab-all']) assert.ok(html.includes(text), text);
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.equal((html.match(/<th\b/g) || []).length, 8);
  assert.ok(!html.includes('>Requirement</th>'));
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.ok(!html.includes('All statuses')); assert.ok(!html.includes('All types'));
  assert.deepEqual(model.adminLeadTabs.map(({ label, status, leadType }) => ({ label, status, leadType })), [
    { label: 'All', status: '', leadType: '' },
    { label: 'Pending Review', status: 'PENDING_REVIEW', leadType: '' },
    { label: 'Shared', status: '', leadType: 'SHARED' },
  ]);
  const dashboard = fs.readFileSync(path.join(root, 'src/components/dashboard/SuperAdminDashboard.jsx'), 'utf8');
  assert.ok(dashboard.includes('"Lead List": LeadList'));
  assert.ok(dashboard.includes('"Lead List": "lead-list"'));
  const { proxy } = load('src/proxy.js');
  const request = (role) => ({ url: 'http://localhost/superadmin/lead-list', nextUrl: { pathname: '/superadmin/lead-list', search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
  assert.equal(proxy(request('SUPER_ADMIN')).next, true);
  assert.ok(proxy(request('VENDOR')).redirect.includes('/superadmin/login'));
});

const originalWindow = global.window;
const originalDocument = global.document;
after(() => { if (originalWindow === undefined) delete global.window; else global.window = originalWindow; if (originalDocument === undefined) delete global.document; else global.document = originalDocument; });

test('admin requests read all leads by default, paginate, combine filters, search and moderate with exact payloads', { skip: !process.env.ADMIN_LEADS_SIMULATION_URL }, async () => {
  global.window = { localStorage: { getItem: (key) => key === 'epic_access_token' ? 'lead-admin-token' : null }, location: { href: 'http://localhost/superadmin/lead-list' } };
  global.document = { cookie: '' };
  const api = load('src/util/MainApi.js').default;
  const first = await model.fetchAdminLeads(api);
  assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  assert.deepEqual([...new Set(first.items.map((item) => item.leadType))].sort(), ['DIRECT', 'SHARED']);
  const second = await model.fetchAdminLeads(api, { page: 2, limit: 20 });
  assert.equal(second.items.length, 5); assert.equal(second.hasNext, false);
  const shared = await model.fetchAdminLeads(api, { status: 'PENDING_REVIEW', leadType: 'SHARED' });
  assert.equal(shared.total, 13);
  assert.ok(shared.items.every((item) => item.status === 'PENDING_REVIEW' && item.leadType === 'SHARED'));
  const search = await model.fetchAdminLeads(api, { search: '  Customer 25  ' });
  assert.equal(search.total, 1); assert.equal(search.items[0].customerName, 'Customer 25');
  assert.equal((await model.fetchAdminLeads(api, { search: 'no match' })).items.length, 0);
  const id = model.adminLeadId(first.items[0]);
  assert.equal(id, 'lead & one');
  const detail = await model.fetchAdminLead(api, id);
  assert.deepEqual(detail.metadata, { verified: false, purchaseCount: 0 });
  const activated = await model.moderateAdminLead(api, id, 'activate', { basePrice: '100', maxBuyerCount: '5', reason: 'must not be sent' });
  assert.equal(activated.message, 'Lead activated successfully.');
  const active = await model.fetchAdminLead(api, id);
  assert.equal(active.status, 'ACTIVE'); assert.equal(active.basePrice, 100); assert.equal(active.maxBuyerCount, 5);
  assert.equal((await model.fetchAdminLeads(api, { status: 'ACTIVE' })).total, 1);
  await assert.rejects(model.moderateAdminLead(api, id, 'activate', { basePrice: 100, maxBuyerCount: 5 }), (error) => error.response.status === 409);
  await model.moderateAdminLead(api, 'lead-2', 'reject', { reason: '  Not enough valid information.  ', basePrice: 100 });
  assert.equal((await model.fetchAdminLead(api, 'lead-2')).rejectionReason, 'Not enough valid information.');
  assert.equal((await model.fetchAdminLeads(api, { status: 'REJECTED' })).total, 1);
  await model.moderateAdminLead(api, id, 'close', { reason: 'Customer cancelled.' });
  assert.equal((await model.fetchAdminLead(api, id)).status, 'CLOSED');
  await assert.rejects(model.moderateAdminLead(api, id, 'close', { reason: ' ' }), /reason/);
  await assert.rejects(model.moderateAdminLead(api, 'unavailable', 'reject', { reason: 'Not valid.' }), (error) => error.response.status === 503);
  await assert.rejects(model.moderateAdminLead(api, 'denied', 'close', { reason: 'Cancelled.' }), /denied/);
  await assert.rejects(model.fetchAdminLead(api, 'missing'), (error) => error.response.status === 404);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(model.fetchAdminLeads(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  global.window.localStorage.getItem = () => null;
  await assert.rejects(model.fetchAdminLeads(api), (error) => error.response.status === 401);
});
