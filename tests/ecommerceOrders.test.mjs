import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { fetchEcommerceOrders, fetchEcommerceOrder, markEcommerceOrderPaidForTest, cancelEcommerceOrder, updateEcommerceOrderFulfilment, ecommerceFulfilmentPayload, ecommerceOrderActions } from '../src/util/ecommerceOrders.mjs';
const shipping = { status: 'SHIPPED', courierName: 'Delhivery', trackingNumber: 'TEST123456', trackingUrl: 'https://example.com/track/TEST123456' };
test('fulfilment payloads contain only supplied fields and validate shipping values', () => {
  for (const status of ['PROCESSING', 'PACKED', 'DELIVERED', 'RETURNED', 'REFUNDED']) assert.deepEqual(ecommerceFulfilmentPayload({ ...shipping, status, ignored: true }), { status });
  assert.deepEqual(ecommerceFulfilmentPayload({ ...shipping, ignored: true }), shipping);
  for (const changes of [{ status: 'UNKNOWN' }, { trackingNumber: '' }, { trackingUrl: 'javascript:alert(1)' }, { courierName: null }]) assert.throws(() => ecommerceFulfilmentPayload({ ...shipping, ...changes }));
  assert.deepEqual(ecommerceOrderActions({ status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID' }).map(x => x.key), ['mark-paid', 'cancel']);
  assert.deepEqual(ecommerceOrderActions({ status: 'PAID' }).map(x => x.key), ['PROCESSING']);
  assert.deepEqual(ecommerceOrderActions({ status: 'PACKED' }).map(x => x.key), ['SHIPPED']);
  assert.deepEqual(ecommerceOrderActions({ status: 'REFUNDED' }), []);
  assert.deepEqual(ecommerceOrderActions({ status: 'PAID', fulfilmentStatus: 'PROCESSING' }).map(x => x.key), ['PACKED']);
});
test('admin order paths encode IDs and reject invalid inputs before writing', async () => {
  const calls = []; const api = { post: async (...args) => { calls.push(args); return { data: {} }; }, patch: async (...args) => { calls.push(args); return { data: {} }; } };
  await markEcommerceOrderPaidForTest(api, 'order & one');
  await cancelEcommerceOrder(api, 'order & one', { reason: ' Customer requested cancellation ', ignored: true });
  await updateEcommerceOrderFulfilment(api, 'order & one', shipping);
  assert.equal(calls[0][0], '/admin/ecommerce/orders/order%20%26%20one/mark-paid-for-test'); assert.deepEqual(calls[0][1], {});
  assert.deepEqual(calls[1][1], { reason: 'Customer requested cancellation' });
  assert.equal(calls[2][0], '/admin/ecommerce/orders/order%20%26%20one/fulfilment'); assert.deepEqual(calls[2][1], shipping);
  await assert.rejects(fetchEcommerceOrder(api, ''), /ID/);
  await assert.rejects(cancelEcommerceOrder(api, 'id', { reason: '' }), /reason/);
  await assert.rejects(fetchEcommerceOrders(api, { page: 0 }), /pagination/);
  assert.equal(calls.length, 3);
});
const baseURL = process.env.ECOMMERCE_ORDERS_SIMULATION_URL;
const client = () => axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-product-test-token' } });
const reset = api => api.post(`${baseURL.replace(/\/api\/v1$/, '')}/__admin_orders_reset`, {});
test('HTTP admin list, detail, payment and fulfilment transition lifecycle', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  const first = await fetchEcommerceOrders(api); assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  assert.equal((await fetchEcommerceOrders(api, { page: 2 })).items.length, 5);
  const id = first.items[0].id; assert.ok(id.includes('&'));
  await markEcommerceOrderPaidForTest(api, id);
  assert.equal((await fetchEcommerceOrder(api, id)).paymentStatus, 'PAID');
  for (const values of [{ status: 'PROCESSING' }, { status: 'PACKED' }, shipping, { status: 'DELIVERED' }]) {
    await updateEcommerceOrderFulfilment(api, id, values);
    assert.equal((await fetchEcommerceOrder(api, id)).status, values.status);
  }
  const delivered = await fetchEcommerceOrder(api, id); assert.equal(delivered.trackingNumber, shipping.trackingNumber);
  await updateEcommerceOrderFulfilment(api, first.items[1].id, { status: 'RETURNED' });
  await updateEcommerceOrderFulfilment(api, first.items[1].id, { status: 'REFUNDED' });
  assert.equal((await fetchEcommerceOrder(api, first.items[1].id)).paymentStatus, 'REFUNDED');
  await cancelEcommerceOrder(api, first.items[2].id, { reason: 'Customer requested cancellation' });
  assert.equal((await fetchEcommerceOrder(api, first.items[2].id)).status, 'CANCELLED');
  await assert.rejects(markEcommerceOrderPaidForTest(api, id), error => error.response.status === 409);
  await assert.rejects(updateEcommerceOrderFulfilment(api, id, { status: 'PACKED' }), error => error.response.status === 409);
});
test('HTTP handles forbidden, malformed, unavailable and ambiguous admin order responses', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  const id = (await fetchEcommerceOrders(api)).items[0].id;
  await assert.rejects(fetchEcommerceOrders(axios.create({ baseURL, proxy: false })), error => error.response.status === 401);
  api.defaults.headers['x-test-orders'] = 'invalid'; await assert.rejects(fetchEcommerceOrders(api), /invalid order list/);
  api.defaults.headers['x-test-orders'] = 'unavailable'; await assert.rejects(markEcommerceOrderPaidForTest(api, id), error => error.response.status === 503);
  delete api.defaults.headers['x-test-orders']; assert.equal((await fetchEcommerceOrder(api, id)).status, 'PENDING_PAYMENT');
  api.defaults.headers['x-test-orders'] = 'after-write'; await assert.rejects(markEcommerceOrderPaidForTest(api, id), error => error.response.status === 503);
  delete api.defaults.headers['x-test-orders']; assert.equal((await fetchEcommerceOrder(api, id)).status, 'PAID');
  await assert.rejects(fetchEcommerceOrder(api, 'missing order'), error => error.response.status === 404);
});
