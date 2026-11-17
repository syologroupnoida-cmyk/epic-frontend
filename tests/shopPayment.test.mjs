import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import axios from 'axios';
import { createRequire } from 'node:module';
import { canPayShopOrder, createShopOrderPayment, loadRazorpayCheckout, openRazorpayCheckout, shopOrderPaymentUnavailableReason, shopPaymentVerificationPayload, shopRazorpayDetails, verifyShopPayment } from '../src/util/shopPayment.mjs';

const callback = { razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: 'synthetic-signature' };
const previousWindow = global.window;
after(() => { if (previousWindow === undefined) delete global.window; else global.window = previousWindow; });

test('verification sends only the three supplied callback fields to the encoded payment endpoint', async (t) => {
  const calls = [];
  const server = http.createServer(async (req, res) => {
    const parts = [];
    for await (const part of req) parts.push(part);
    calls.push({ method: req.method, url: req.url, body: JSON.parse(Buffer.concat(parts).toString()) });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { paymentStatus: 'PAID' } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const api = axios.create({ baseURL: `http://127.0.0.1:${server.address().port}`, proxy: false });
  const result = await verifyShopPayment(api, 'payment & one', { ...callback, amount: 1, status: 'PAID' });
  assert.equal(result.paymentStatus, 'PAID');
  assert.deepEqual(calls, [{ method: 'POST', url: '/shop/payments/payment%20%26%20one/verify', body: callback }]);
  await assert.rejects(verifyShopPayment(api, '', callback), /reference is missing/);
  await assert.rejects(verifyShopPayment(api, 'payment-one', { ...callback, razorpay_signature: '' }), /incomplete/);
  assert.equal(calls.length, 1);
});

test('verification rejects incomplete callbacks', () => {
  for (const field of Object.keys(callback)) {
    for (const value of [undefined, null, '', ' ', 42]) assert.throws(() => shopPaymentVerificationPayload({ ...callback, [field]: value }), /incomplete/);
  }
});

function sdk() {
  let options;
  const events = {};
  let opened = 0;
  let closed = 0;
  class Razorpay {
    constructor(value) { options = value; }
    on(name, handler) { events[name] = handler; }
    open() { opened++; }
    close() { closed++; options.modal.ondismiss(); }
  }
  global.window = { Razorpay };
  return { Razorpay, events, get options() { return options; }, get opened() { return opened; }, get closed() { return closed; } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('active unpaid orders accept payment across lifecycle labels while completed and expired orders stay blocked', () => {
  const order = { status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID' };
  assert.equal(canPayShopOrder(order), true);
  for (const paymentStatus of ['PAID', 'CAPTURED', 'AUTHORIZED', 'REFUNDED']) assert.equal(canPayShopOrder({ ...order, paymentStatus }), false);
  for (const status of ['CANCELLED', 'EXPIRED', 'DELIVERED', 'RETURNED']) assert.equal(canPayShopOrder({ ...order, status }), false);
  assert.equal(canPayShopOrder({ ...order, reservationExpiresAt: '2000-01-01T00:00:00Z' }), false);
  assert.match(shopOrderPaymentUnavailableReason({ ...order, reservationExpiresAt: '2000-01-01T00:00:00Z' }), /reservation.*expired/);
  assert.match(shopOrderPaymentUnavailableReason({ ...order, paymentStatus: 'PAID' }), /already been paid/);
  assert.match(shopOrderPaymentUnavailableReason({ ...order, paymentStatus: 'AUTHORIZED' }), /awaiting confirmation/);
  assert.match(shopOrderPaymentUnavailableReason({ status: 'UNKNOWN', paymentStatus: 'UNKNOWN' }), /could not be determined/);
  assert.equal(canPayShopOrder({ status: ' pending_payment ', paymentStatus: ' unpaid ' }), true);
  for (const status of ['CREATED', 'PLACED', 'CONFIRMED', 'RESERVED', 'AWAITING_PAYMENT', 'PAYMENT_PENDING']) {
    assert.equal(canPayShopOrder({ status, paymentStatus: 'UNPAID' }), true, status);
    assert.equal(canPayShopOrder({ status, paymentStatus: 'CREATED' }), true, status);
    assert.equal(canPayShopOrder({ status, paymentStatus: 'PAID' }), false, status);
  }
  assert.equal(canPayShopOrder({ status: 'RESERVED' }), true);
  assert.equal(canPayShopOrder({ ...order, canPay: false }), false);
  assert.equal(canPayShopOrder({ ...order, status: 'CONFIRMED', paymentStatus: 'UNKNOWN', canPay: true }), true);
  assert.equal(canPayShopOrder({ ...order, paymentStatus: 'CAPTURED', canPay: true }), false);
});

test('provider details require a server amount, currency, payment reference and public key', () => {
  const payment = { id: 'internal-payment', razorpayOrderId: 'order_server', amountPaise: 10000, currency: 'INR' };
  assert.deepEqual(shopRazorpayDetails({ payment, keyId: 'rzp_test_public' }), { paymentId: payment.id, options: { key: 'rzp_test_public', order_id: 'order_server', amount: 10000, currency: 'INR' } });
  assert.equal(shopRazorpayDetails({ payment }, 'rzp_test_configured').options.key, 'rzp_test_configured');
  for (const patch of [{ id: '' }, { razorpayOrderId: '' }, { amountPaise: 0 }, { amountPaise: -1 }, { amountPaise: 1.5 }, { currency: '' }]) assert.throws(() => shopRazorpayDetails({ payment: { ...payment, ...patch }, keyId: 'rzp_test_public' }), /incomplete/);
  assert.throws(() => shopRazorpayDetails({ payment }), /incomplete/);
});

test('real HTTP creates payment for the existing order, verifies the callback and reloads server-paid status', async (t) => {
  const customer = createRequire(import.meta.url)('../postman/mocks/ecommerce-products/customer.js');
  const traffic = [];
  const server = http.createServer(async (req, res) => {
    traffic.push({ method: req.method, path: req.url });
    try { if (!(await customer(req, res))) { res.writeHead(501); res.end(); } }
    catch { res.writeHead(500); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const api = axios.create({ baseURL: `http://127.0.0.1:${server.address().port}/api/v1`, proxy: false, headers: { Authorization: 'Bearer shop-customer-one' } });
  const other = axios.create({ baseURL: api.defaults.baseURL, proxy: false, headers: { Authorization: 'Bearer shop-customer-two' } });
  const data = await createShopOrderPayment(api, 'historic-order-2');
  const payment = shopRazorpayDetails(data);
  assert.equal(payment.options.amount, 1299000);
  const fake = sdk();
  const checkout = openRazorpayCheckout(payment.options);
  await tick();
  fake.options.handler({ razorpay_order_id: payment.options.order_id, razorpay_payment_id: 'pay_synthetic', razorpay_signature: 'synthetic-signature' });
  const values = await checkout;
  await assert.rejects(verifyShopPayment(other, payment.paymentId, values), error => error.response.status === 404);
  await assert.rejects(verifyShopPayment(api, payment.paymentId, { ...values, razorpay_signature: 'invalid' }), error => error.response.status === 400);
  assert.equal((await api.get('/shop/orders/historic-order-2')).data.data.order.paymentStatus, 'UNPAID');
  await verifyShopPayment(api, payment.paymentId, values);
  assert.equal((await api.get('/shop/orders/historic-order-2')).data.data.order.paymentStatus, 'PAID');
  await assert.rejects(createShopOrderPayment(api, 'historic-order-2'), error => error.response.status === 409);
  assert.ok(traffic.some(row => row.path.endsWith(`/payments/${encodeURIComponent(payment.paymentId)}/verify`)));
  await assert.rejects(createShopOrderPayment({ post: (...args) => api.post(...args.slice(0, 2), { headers: { 'x-test-commerce': 'payment-after-write' } }) }, 'historic-order-3'), error => error.response.status === 503);
});

test('Razorpay returns genuine callback fields once and rejects a mismatched order', async () => {
  const fake = sdk();
  assert.equal(await loadRazorpayCheckout(), fake.Razorpay);
  const payment = openRazorpayCheckout({ key: 'rzp_test_public', order_id: 'order_test', amount: 10000, currency: 'INR' });
  await tick();
  assert.equal(fake.opened, 1);
  assert.equal(fake.options.retry.enabled, false);
  fake.options.handler(callback);
  fake.options.modal.ondismiss();
  assert.deepEqual(await payment, callback);
  const mismatch = openRazorpayCheckout({ order_id: 'another-order' });
  const rejection = assert.rejects(mismatch, /does not match/);
  await tick();
  fake.options.handler(callback);
  await rejection;
});

test('dismissal, provider failure and navigation cancel payment without reporting success', async () => {
  const fake = sdk();
  let payment = openRazorpayCheckout({ order_id: 'order_test' });
  let rejection = assert.rejects(payment, /cancelled/);
  await tick(); fake.options.modal.ondismiss(); await rejection;
  payment = openRazorpayCheckout({ order_id: 'order_test' });
  rejection = assert.rejects(payment, /declined/);
  await tick(); fake.events['payment.failed']({ error: { description: 'Payment declined.' } }); await rejection;
  const controller = new AbortController();
  payment = openRazorpayCheckout({ order_id: 'order_test' }, controller.signal);
  rejection = assert.rejects(payment, /cancelled/);
  await tick(); controller.abort(); await rejection;
  assert.equal(fake.closed, 2);
});
