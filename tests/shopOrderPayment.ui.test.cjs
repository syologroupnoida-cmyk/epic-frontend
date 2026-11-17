const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const swc = require('next/dist/build/swc');

function harness({ verificationFails = false, pending = false } = {}) {
  const slots = []; let cursor = 0;
  const routes = []; const calls = [];
  const order = { id: 'order & one', status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID' };
  let refreshes = 0;
  const cache = new Map();
  function load(relative) {
    let filename = path.resolve(__dirname, '..', relative);
    if (filename.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map(ext => filename + ext).find(fs.existsSync);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename); cache.set(filename, mod);
    mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
    const original = mod.require.bind(mod);
    mod.require = (id) => {
      if (id === 'react') return { ...React,
        useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
        useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
        useEffect() {},
      };
      if (id === 'next/router') return { useRouter: () => ({ push: async route => { routes.push(route); } }) };
      if (id === '@mui/material') return { Alert: 'Alert', Button: 'Button', CircularProgress: 'Spinner' };
      if (id === './ShopPaymentOptions') return { __esModule: true, default: 'PaymentOptions' };
      if (id === '@/util/useAuthUser') return { __esModule: true, default: () => ({ email: 'test@example.test' }) };
      if (id === '@/util/MainApi') return { __esModule: true, default: {} };
      if (id === '@/util/shopPayment.mjs') return {
        ...load('src/util/shopPayment.mjs'),
        loadRazorpayCheckout: async () => {},
        createShopOrderPayment: async (_api, orderId) => { calls.push(['create', orderId]); return {}; },
        shopRazorpayDetails: () => ({ paymentId: 'internal-payment', options: { order_id: 'order_provider' } }),
        openRazorpayCheckout: async () => ({ razorpay_order_id: 'order_provider', razorpay_payment_id: 'pay_test', razorpay_signature: 'test-signature' }),
        verifyShopPayment: async (_api, paymentId, values) => { calls.push(['verify', paymentId, values]); if (verificationFails) throw new Error('Verification failed.'); },
      };
      if (id.startsWith('@/')) return load('src/' + id.slice(2));
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
      return original(id);
    };
    mod._compile(swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
    return mod.exports;
  }
  const Payment = load('src/modules/ecommerce/components/ShopOrderPayment.jsx').default;
  function render() {
    cursor = 0;
    const nodes = [];
    function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== 'object') return; nodes.push(node); visit(node.props?.children); }
    visit(Payment({ order, onRefresh: async () => { refreshes++; return { ...order, paymentStatus: refreshes > (pending ? 2 : 1) ? 'PAID' : 'UNPAID' }; } }));
    return nodes;
  }
  async function pay() {
    render().find(node => node.type === 'PaymentOptions').props.onChange('RAZORPAY');
    await render().find(node => node.type === 'Button' && node.props.variant === 'contained').props.onClick();
  }
  return { render, pay, routes, calls };
}

test('verified payment redirects to the success page for the same encoded order', async () => {
  const h = harness();
  await h.pay();
  assert.deepEqual(h.routes, ['/shop/orders/order%20%26%20one/success']);
  assert.deepEqual(h.calls.map(call => call[0]), ['create', 'verify']);
  assert.equal(h.calls[0][1], 'order & one');
});

test('verification failure never navigates to congratulations', async () => {
  const h = harness({ verificationFails: true });
  await h.pay();
  assert.deepEqual(h.routes, []);
  assert.ok(h.render().some(node => node.type === 'Alert' && node.props.children.includes('could not be completed')));
  assert.equal(h.render().find(node => node.type === 'Button' && node.props.variant === 'contained').props.disabled, true);
});

test('pending capture stays on the order until a refresh confirms paid status', async () => {
  const h = harness({ pending: true });
  await h.pay();
  assert.deepEqual(h.routes, []);
  await h.render().find(node => node.type === 'Button' && node.props.children === 'Refresh payment status').props.onClick();
  assert.deepEqual(h.routes, ['/shop/orders/order%20%26%20one/success']);
  assert.equal(h.calls.filter(call => call[0] === 'create').length, 1);
});
