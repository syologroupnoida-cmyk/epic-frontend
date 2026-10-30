const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
if (process.env.SUBSCRIPTION_PLANS_SIMULATION_URL) process.env.NEXT_PUBLIC_API_BASE_URL = process.env.SUBSCRIPTION_PLANS_SIMULATION_URL;
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
  if (/SubscriptionPlan(?:s|Card|Editor)\.jsx$/.test(filename)) source = require('@babel/core').transformSync(source, { filename, configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] }, plugins: ['babel-plugin-react-compiler'] }).code;
  module._compile(swc.transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
  return module.exports;
}
const model = load('src/util/subscriptionPlans.mjs');
const sample = {
  code: 'BASIC', kind: 'PAID', displayName: 'Basic Growth', shortDescription: 'For growing wedding businesses.',
  monthlyPrice: 999, directLeadPrice: 10, maxActiveServiceListings: 5, maxActiveVenueProperties: 1,
  maxDirectLeadPurchasesPerMonth: 25, maxSharedLeadPurchasesPerMonth: 10, maxMediaPerListing: 15,
  featuredListingSlots: 0, benefits: ['5 active service listings', '1 active venue property'],
  badgeText: 'Most Popular', theme: 'PURPLE', ctaText: 'Upgrade to Basic', sortOrder: 2,
  isFeatured: true, isActive: true, isDefault: false, isPurchasable: true,
};

test('plan payload contains exactly the 21 supplied fields and preserves numeric zero and false flags', () => {
  const form = model.planFormValues({ ...sample, id: 'server-id', monthlyPrice: '999.00', featuredListingSlots: '0', benefits: [' 5 active service listings ', '1 active venue property', ' '] });
  assert.deepEqual(model.validateSubscriptionPlan(form), {});
  assert.deepEqual(model.subscriptionPlanPayload(form), sample);
  assert.equal(Object.keys(model.subscriptionPlanPayload(form)).length, 21);
  form.benefits.push('New benefit');
  assert.equal(sample.benefits.length, 2);
});

test('partial updates omit unchanged fields, IDs and server metadata while preserving explicit clears', () => {
  const original = { ...sample, id: 'plan & basic', createdAt: '2026-10-29T00:00:00Z' };
  const form = model.planFormValues(original);
  assert.deepEqual(model.subscriptionPlanChanges({ ...form, monthlyPrice: '999.00', maxMediaPerListing: '15' }, original), {});
  assert.deepEqual(model.subscriptionPlanChanges({ ...form, directLeadPrice: '0', isFeatured: false, benefits: [], shortDescription: '' }, original), { shortDescription: '', directLeadPrice: 0, benefits: [], isFeatured: false });
  const nullable = { ...original, maxActiveServiceListings: null };
  const nullableForm = { ...model.planFormValues(nullable), displayName: 'Changed name' };
  assert.deepEqual(model.validateSubscriptionPlan(nullableForm, nullable), {});
  assert.deepEqual(model.subscriptionPlanChanges(nullableForm, nullable), { displayName: 'Changed name' });
});

test('invalid plan prices, limits and missing identity fields are rejected before sending', async () => {
  for (const monthlyPrice of ['', '-1', 'bad', '1.234', Infinity, true]) assert.ok(model.validateSubscriptionPlan({ ...sample, monthlyPrice }).monthlyPrice);
  for (const maxMediaPerListing of ['', -1, 1.5, Infinity]) assert.ok(model.validateSubscriptionPlan({ ...sample, maxMediaPerListing }).maxMediaPerListing);
  assert.ok(model.validateSubscriptionPlan({ ...sample, code: ' ' }).code);
  await assert.rejects(model.saveSubscriptionPlan(null, { ...sample, monthlyPrice: -1 }), /zero or more/);
  await assert.rejects(model.setSubscriptionPlanActive(null, '', true), /ID is missing/);
});

test('compiled subscription dashboard and themed preview render without hardcoded server plans', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Card = load('src/components/superadmin/SubscriptionPlanCard.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Card, { plan: sample }));
  for (const text of ['Basic Growth', 'Most Popular', '999', '5 active service listings', 'Upgrade to Basic']) assert.ok(html.replace(/<[^>]*>/g, '').includes(text), text);
  const custom = renderToStaticMarkup(React.createElement(Card, { plan: { ...sample, theme: '#123456' } }));
  assert.ok(custom.includes('--plan-accent:#123456'));
  assert.equal(model.subscriptionPlanPayload({ ...sample, theme: '#123456' }).theme, '#123456');
  const List = load('src/components/superadmin/SubscriptionPlans.jsx').default;
  const initial = renderToStaticMarkup(React.createElement(List));
  assert.ok(initial.includes('Subscription Plans')); assert.ok(initial.includes('Create plan')); assert.ok(initial.includes('Loading subscription plans'));
  assert.ok(!initial.includes('Basic Growth'));
  const Editor = load('src/components/superadmin/SubscriptionPlanEditor.jsx').default;
  const editor = renderToStaticMarkup(React.createElement(Editor, { plan: { ...sample, id: 'test-plan' }, onClose() {}, onSaved() {}, onToggleActive() {} }));
  assert.ok(editor.includes('name="monthlyPrice"'));
  assert.ok(editor.includes('Live card preview'));
  assert.ok(editor.includes('role="switch"'));
  assert.ok(editor.includes('Theme color'));
  assert.ok(editor.includes('type="color"'));
  assert.ok(editor.indexOf('role="switch"') < editor.indexOf('</form>'));
  assert.ok(!editor.slice(editor.indexOf('Live card preview')).includes('role="switch"'));
  assert.ok(editor.indexOf('Live card preview') > editor.indexOf('</form>'));
  assert.ok(editor.includes('Save changes'));
  assert.ok(!editor.includes('role="dialog"'));
  assert.ok(!initial.includes('Filter subscription plans'));
  const dashboard = fs.readFileSync(path.join(root, 'src/components/dashboard/SuperAdminDashboard.jsx'), 'utf8');
  assert.ok(dashboard.includes('"Subscription Plans": SubscriptionPlans'));
  assert.ok(dashboard.includes('"Subscription Plans": "subscription-plans"'));
});

const originalWindow = global.window;
const originalDocument = global.document;
after(() => { if (originalWindow === undefined) delete global.window; else global.window = originalWindow; if (originalDocument === undefined) delete global.document; else global.document = originalDocument; });

test('authenticated plan requests create individually, PATCH only changed fields and activate/deactivate through real HTTP', { skip: !process.env.SUBSCRIPTION_PLANS_SIMULATION_URL }, async () => {
  global.window = { localStorage: { getItem: (key) => key === 'epic_access_token' ? 'plan-admin-token' : null }, location: { href: 'http://localhost/superadmin/subscription-plans' } };
  global.document = { cookie: '' };
  const api = load('src/util/MainApi.js').default;
  assert.equal((await model.fetchSubscriptionPlans(api, { isActive: true })).length, 1);
  assert.equal((await model.fetchSubscriptionPlans(api, { isActive: false })).length, 1);
  assert.equal((await model.fetchSubscriptionPlans(api)).length, 2);
  const create = { ...sample, code: 'GROWTH', displayName: 'Growth plan' };
  const created = await model.saveSubscriptionPlan(api, create);
  assert.equal(created.message, 'Subscription plan created.');
  assert.deepEqual(created.data.received, create);
  const original = created.data.plan;
  const edited = { ...model.planFormValues(original), monthlyPrice: '1299.00', maxSharedLeadPurchasesPerMonth: '0', isFeatured: false, benefits: ['New benefit'] };
  const saved = await model.saveSubscriptionPlan(api, edited, original);
  assert.deepEqual(saved.data.received, { monthlyPrice: 1299, maxSharedLeadPurchasesPerMonth: 0, benefits: ['New benefit'], isFeatured: false });
  assert.equal(saved.data.plan.directLeadPrice, 10);
  const noChange = await model.saveSubscriptionPlan(api, model.planFormValues(saved.data.plan), saved.data.plan);
  assert.equal(noChange.changed, false);
  await model.setSubscriptionPlanActive(api, original.id, false);
  assert.ok(!(await model.fetchSubscriptionPlans(api, { isActive: true })).some((plan) => plan.id === original.id));
  assert.ok((await model.fetchSubscriptionPlans(api, { isActive: false })).some((plan) => plan.id === original.id));
  await model.setSubscriptionPlanActive(api, original.id, true);
  assert.ok((await model.fetchSubscriptionPlans(api, { isActive: true })).some((plan) => plan.id === original.id));
  await model.setSubscriptionPlanActive(api, 'plan & basic', false);
  await model.setSubscriptionPlanActive(api, 'plan & basic', true);
  assert.equal((await model.fetchSubscriptionPlans(api)).find((plan) => plan.id === 'plan & basic').monthlyPrice, 999);
  await assert.rejects(model.saveSubscriptionPlan(api, sample), (error) => error.response.status === 409 && model.subscriptionFieldErrors(error).code === 'Plan code must be unique.');
  await assert.rejects(model.setSubscriptionPlanActive(api, 'logical-failure', true), /declined/);
  await assert.rejects(model.setSubscriptionPlanActive(api, 'unavailable', true), (error) => error.response.status === 503);
  await assert.rejects(model.setSubscriptionPlanActive(api, 'missing', true), (error) => error.response.status === 404);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(model.fetchSubscriptionPlans(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  global.window.localStorage.getItem = () => null;
  await assert.rejects(model.fetchSubscriptionPlans(api), (error) => error.response.status === 401);
});
