const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
if (process.env.VENDOR_BILLING_SIMULATION_URL) process.env.NEXT_PUBLIC_API_BASE_URL = process.env.VENDOR_BILLING_SIMULATION_URL;
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
  if (filename.endsWith('.jsx')) source = require('@babel/core').transformSync(source, { filename, configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] }, plugins: ['babel-plugin-react-compiler'] }).code;
  module._compile(swc.transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
  return module.exports;
}
const billing = load('src/util/vendorBilling.mjs');
test('the supplied nested catalog renders real plan data and preserves admin edit limits', () => {
  const { normalizeSubscriptionPlan, planFormValues, subscriptionPlanChanges } = load('src/util/subscriptionPlans.mjs');
  const response = JSON.parse(fs.readFileSync(path.join(root, 'postman/mocks/vendor-billing/plans.response.json'), 'utf8'));
  const [free, basic] = response.data.plans.map(normalizeSubscriptionPlan);
  assert.equal(free.id, response.data.currentPlanId);
  assert.equal(free.monthlyPrice, 0);
  assert.equal(free.maxActiveVenueProperties, 0);
  assert.equal(billing.isCurrentVendorPlan(free, null), true);
  assert.equal(billing.isCurrentVendorPlan(basic, { planId: basic.id, status: 'ACTIVE' }), false);
  assert.equal(basic.id, 'cmvth8ybs00dtl1kwnvxvmpa0');
  assert.equal(basic.cardAction, 'UPGRADE');
  assert.equal(basic.maxActiveServiceListings, 10);
  assert.equal(basic.maxSharedLeadPurchasesPerMonth, 10);
  const form = planFormValues(response.data.plans[1]);
  assert.equal(form.featuredListingSlots, 5);
  assert.deepEqual(subscriptionPlanChanges({ ...form, displayName: 'Changed name' }, basic), { displayName: 'Changed name' });
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Card = load('src/components/superadmin/SubscriptionPlanCard.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Card, { plan: basic }));
  assert.ok(html.includes('Basic Plan')); assert.ok(html.includes('200')); assert.ok(html.includes('Buy Now'));
  assert.ok(!html.includes('Your plan name')); assert.ok(!html.includes('Not set'));
});
test('current subscription matching handles null, IDs, codes and ended subscriptions', () => {
  const plan = { id: 'basic-plan', code: 'BASIC' };
  assert.equal(billing.isCurrentVendorPlan(plan, null), false);
  assert.equal(billing.isCurrentVendorPlan(plan, { id: 'subscription-id', planId: 'basic-plan', status: 'ACTIVE' }), true);
  assert.equal(billing.isCurrentVendorPlan(plan, { plan: { code: 'BASIC', displayName: 'Basic Growth' }, status: 'ACTIVE' }), true);
  assert.equal(billing.isCurrentVendorPlan(plan, { planId: 'basic-plan', status: 'EXPIRED' }), false);
  assert.equal(billing.isCurrentVendorPlan(plan, { id: 'basic-plan', status: 'ACTIVE' }), false);
  assert.equal(billing.subscriptionSummary(null).planId, '');
  assert.equal(billing.billingMoney(null), 'Not available');
  assert.ok(billing.billingMoney(0).includes('0.00'));
  const row = billing.walletTransaction({ type: 'DEBIT', amount: 0, balanceAfter: 0, reference: { unsupported: true } });
  assert.equal(row.amount, 0); assert.equal(row.balance, 0); assert.equal(row.reference, '');
});

test('vendor billing screens compile with React Compiler and render safe loading states', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { VendorWalletProvider, VendorWalletBalance, VendorPlanChip } = load('src/components/vendor/billing/VendorWalletProvider.jsx');
  const Plans = load('src/components/vendor/billing/VendorSubscriptionPlans.jsx').default;
  const Transactions = load('src/components/vendor/billing/WalletTransactions.jsx').default;
  const plans = renderToStaticMarkup(React.createElement(VendorWalletProvider, null, React.createElement(Plans)));
  assert.ok(plans.includes('Loading subscription plans'));
  const wallet = renderToStaticMarkup(React.createElement(VendorWalletProvider, null, React.createElement(Transactions)));
  assert.ok(wallet.includes('Wallet Transactions')); assert.ok(wallet.includes('Loading transactions...'));
  const badge = renderToStaticMarkup(React.createElement(VendorWalletProvider, null, React.createElement(VendorWalletBalance)));
  assert.ok(badge.includes('/partner/wallet-transactions')); assert.ok(badge.includes('Loading...'));
  assert.ok(!badge.includes('0.00'));
  assert.equal(badge.replace(/<[^>]*>/g, ''), 'Loading...');
  const chip = renderToStaticMarkup(React.createElement(VendorWalletProvider, null, React.createElement(VendorPlanChip)));
  assert.ok(chip.includes('/partner/subscription-plans'));
  assert.ok(chip.includes('<svg'));
  assert.ok(chip.includes('Loading plan...'));
});

test('vendor billing pages use protected partner routes', () => {
  const routes = load('src/util/agentDashboardRoutes.mjs');
  const { proxy } = load('src/proxy.js');
  for (const panel of ['Subscription Plans', 'Wallet Transactions']) {
    const route = routes.agentPanelPath(panel);
    assert.ok(fs.existsSync(path.join(root, 'src/pages', `${route}.js`)));
    const request = (role) => ({ url: `http://localhost${route}`, nextUrl: { pathname: route, search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
    assert.equal(proxy(request('VENDOR')).next, true);
    assert.ok(proxy(request('CLIENT')).redirect.includes('/partner/login'));
  }
});

const originalWindow = global.window, originalDocument = global.document;
after(() => { if (originalWindow === undefined) delete global.window; else global.window = originalWindow; if (originalDocument === undefined) delete global.document; else global.document = originalDocument; });
test('real authenticated HTTP purchases send only planId and refresh current plan, balance and paginated transactions', { skip: !process.env.VENDOR_BILLING_SIMULATION_URL }, async () => {
  global.window = { localStorage: { getItem: (key) => key === 'epic_access_token' ? 'vendor-billing-token' : null }, location: { href: 'http://localhost/partner/subscription-plans' } };
  global.document = { cookie: '' };
  const api = load('src/util/MainApi.js').default;
  const catalog = await billing.fetchVendorPlanCatalog(api);
  assert.equal(catalog.currentPlanSource, 'DEFAULT_FREE_PLAN');
  assert.equal(catalog.hasCurrentPlanInfo, true);
  let plans = catalog.plans;
  assert.equal(plans[1].displayName, 'Basic Plan');
  assert.equal(plans[1].monthlyPrice, 200);
  assert.equal(plans[1].maxActiveServiceListings, 10);
  assert.equal(plans[1].cardAction, 'UPGRADE');
  assert.equal(plans.length, 3);
  assert.ok(billing.isCurrentVendorPlan(plans[0], await billing.fetchVendorSubscription(api)));
  assert.equal((await billing.fetchVendorWallet(api)).balance, 5000);
  const first = await billing.fetchWalletTransactions(api);
  assert.equal(first.items.length, 20); assert.equal(first.total, 21); assert.equal(first.hasNext, true);
  const second = await billing.fetchWalletTransactions(api, { page: 2, limit: 20 });
  assert.equal(second.items.length, 1); assert.equal(second.hasNext, false);
  const basicId = plans[1].id;
  const bought = await billing.purchaseVendorPlan(api, basicId);
  assert.deepEqual(bought.data.received, { planId: basicId });
  plans = await billing.fetchVendorPlans(api);
  assert.ok(billing.isCurrentVendorPlan(plans[1], await billing.fetchVendorSubscription(api)));
  assert.equal((await billing.fetchVendorWallet(api)).balance, 4800);
  assert.equal((await billing.fetchWalletTransactions(api)).items[0].amount, 200);
  await assert.rejects(billing.purchaseVendorPlan(api, basicId), (error) => error.response.status === 409);
  assert.equal((await billing.fetchVendorWallet(api)).balance, 4800);
  await billing.purchaseVendorPlan(api, 'pro-plan');
  plans = await billing.fetchVendorPlans(api);
  assert.ok(billing.isCurrentVendorPlan(plans[2], await billing.fetchVendorSubscription(api)));
  assert.equal((await billing.fetchVendorWallet(api)).balance, 2301);
  assert.equal((await billing.fetchWalletTransactions(api)).items[0].description, 'Professional subscription');
  await assert.rejects(billing.purchaseVendorPlan(api, ''), /plan ID is required/);
  await assert.rejects(billing.purchaseVendorPlan(api, 'unavailable'), (error) => error.response.status === 503);
  await assert.rejects(billing.purchaseVendorPlan(api, 'declined'), /Purchase declined/);
  await assert.rejects(billing.purchaseVendorPlan(api, 'missing'), (error) => error.response.status === 404);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(billing.fetchVendorWallet(api, controller.signal), (error) => error.code === 'ERR_CANCELED');
  global.window.localStorage.getItem = () => null;
  await assert.rejects(billing.fetchVendorWallet(api), (error) => error.response.status === 401);
});
