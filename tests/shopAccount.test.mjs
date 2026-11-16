import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { addShopCartProduct, addShopWishlistProduct, checkoutShopCart, createShopAddress, fetchShopAddresses, fetchShopCart, fetchShopOrder, fetchShopOrders, fetchShopWishlist, removeShopWishlistProduct, shopAddressId, shopAddressPayload, shopCartItemPayload, shopLoginReturnPath, shopOrderId, updateShopAddress, shopOrderReasonPayload, canCancelShopOrder, canReturnShopOrder, cancelShopOrder, requestShopOrderReturn, prepareShopBuyNow, updateShopCartItem, removeShopCartItem, removeShopAddress, shopCartQuantityPayload, normalizeShopCartItem } from '../src/util/shopAccount.mjs';

const address = { fullName: 'Ravi Sharma', phone: '9876543210', line1: '123 Main Street', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', isDefault: true };
test('address and cart payloads use only the supplied fields and validate before writing', () => {
  assert.deepEqual(shopAddressPayload({ ...address, fullName: ' Ravi Sharma ', id: 'ignored' }), address);
  assert.deepEqual(shopCartItemPayload({ variantId: 'variant & one', quantity: '2', ignored: true }), { variantId: 'variant & one', quantity: 2 });
  for (const value of ['', null, true, 0, -1, .5]) assert.throws(() => shopCartItemPayload({ variantId: 'one', quantity: value }));
  for (const changes of [{ phone: '123' }, { pincode: 'ABC' }, { line1: '' }, { isDefault: 'true' }]) assert.throws(() => shopAddressPayload({ ...address, ...changes }));
});
test('login return paths stay inside the shop and reject external or traversed URLs', () => {
  assert.equal(shopLoginReturnPath('/shop/checkout'), '/shop/checkout');
  assert.equal(shopLoginReturnPath('/shop?categorySlug=bridal-wear'), '/shop?categorySlug=bridal-wear');
  for (const path of ['https://example.test', '//example.test', '/shop/../superadmin/dashboard', '/shopper', '/\\example.test']) assert.equal(shopLoginReturnPath(path), '');
});
test('cart parsing accepts explicit empty carts and rejects malformed responses', async () => {
  assert.deepEqual(await fetchShopCart({ get: async () => ({ data: { success: true, data: { cart: null } } }) }), []);
  await assert.rejects(fetchShopCart({ get: async () => ({ data: { success: true, data: {} } }) }), /invalid shop response/);
});
const baseURL = process.env.SHOP_ACCOUNT_SIMULATION_URL;
const client = (token = 'shop-customer-one') => axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: `Bearer ${token}` } });
const reset = (api) => api.post(`${baseURL.replace(/\/api\/v1$/, '')}/__shop_reset`, {});

test('HTTP customer cart, wishlist, address edit, reservation and order history form one lifecycle', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  assert.deepEqual(await fetchShopCart(api), []); assert.deepEqual(await fetchShopWishlist(api), []);
  await addShopWishlistProduct(api, 'shop-0'); assert.equal((await fetchShopWishlist(api))[0].slug, 'royal-bridal-lehenga');
  await removeShopWishlistProduct(api, 'shop-0'); assert.deepEqual(await fetchShopWishlist(api), []);
  await addShopCartProduct(api, { variantId: 'shop-variant-0', quantity: 2, ignored: 'not sent' });
  const cart = await fetchShopCart(api); assert.equal(cart[0].quantity, 2); assert.equal(cart[0].sale, 1299000); assert.equal(cart[0].stock, 5);
  const created = await createShopAddress(api, address); const addressId = shopAddressId(created); assert.ok(addressId.includes('&'));
  await updateShopAddress(api, addressId, { ...address, city: 'Delhi', isDefault: false });
  assert.equal((await fetchShopAddresses(api))[0].city, 'Delhi'); assert.equal((await fetchShopAddresses(api))[0].isDefault, false);
  const order = await checkoutShopCart(api, addressId); const orderId = shopOrderId(order);
  assert.equal(order.status, 'PENDING_PAYMENT'); assert.equal(order.totalAmountPaise, 2598000); assert.equal(order.address.city, 'Delhi');
  assert.deepEqual(await fetchShopCart(api), []);
  const first = await fetchShopOrders(api); assert.equal(first.items.length, 20); assert.equal(first.total, 26); assert.equal(first.hasNext, true);
  assert.equal((await fetchShopOrders(api, { page: 2 })).items.length, 6);
  assert.equal(shopOrderId(await fetchShopOrder(api, orderId)), orderId);
  const other = client('shop-customer-two');
  assert.deepEqual(await fetchShopCart(other), []); assert.deepEqual(await fetchShopAddresses(other), []);
  await assert.rejects(fetchShopOrder(other, orderId), (error) => error.response.status === 404);
  await assert.rejects(updateShopAddress(other, addressId, address), (error) => error.response.status === 404);
  await assert.rejects(checkoutShopCart(other, addressId), (error) => error.response.status === 404);
});
test('HTTP keeps rejected writes separate from ambiguous reservation responses and handles read failures', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  const saved = await createShopAddress(api, address);
  await assert.rejects(checkoutShopCart(api, shopAddressId(saved)), (error) => error.response.status === 400);
  await assert.rejects(addShopCartProduct(api, { variantId: 'shop-variant-0', quantity: 6 }), (error) => error.response.status === 409);
  assert.deepEqual(await fetchShopCart(api), []);
  await addShopCartProduct(api, { variantId: 'shop-variant-0', quantity: 1 });
  api.defaults.headers['x-test-commerce'] = 'checkout-after-write';
  await assert.rejects(checkoutShopCart(api, shopAddressId(saved)), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-commerce'];
  assert.equal((await fetchShopOrders(api)).total, 26); assert.deepEqual(await fetchShopCart(api), []);
  api.defaults.headers['x-test-commerce'] = 'invalid'; await assert.rejects(fetchShopCart(api), /invalid shop response/);
  api.defaults.headers['x-test-commerce'] = 'unavailable'; await assert.rejects(fetchShopAddresses(api), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-commerce'];
  await assert.rejects(fetchShopOrder(api, 'missing & order'), (error) => error.response.status === 404);
  await assert.rejects(fetchShopCart(client('not-a-user')), (error) => error.response.status === 401);
  const controller = new AbortController(); controller.abort(); await assert.rejects(fetchShopWishlist(api, controller.signal), (error) => error.code === 'ERR_CANCELED');
});


test('cart item IDs stay distinct from variants and quantity updates send only quantity', async () => {
  assert.deepEqual(shopCartQuantityPayload({ quantity: '3', variantId: 'ignored', price: 1 }), { quantity: 3 });
  for (const quantity of ['', null, true, 0, -1, .5, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => shopCartQuantityPayload({ quantity }));
  assert.equal(normalizeShopCartItem({ variantId: 'variant-one', quantity: 1 }).cartItemId, '');
  const calls = [];
  const api = { patch: async (...args) => { calls.push(args); return { data: {} }; }, delete: async (...args) => { calls.push(args); return { data: {} }; } };
  await updateShopCartItem(api, 'cart & one', { quantity: 2, ignored: true });
  await removeShopCartItem(api, 'cart & one');
  await removeShopAddress(api, 'address & one');
  assert.equal(calls[0][0], '/shop/cart/items/cart%20%26%20one');
  assert.deepEqual(calls[0][1], { quantity: 2 });
  assert.equal(calls[1][0], calls[0][0]);
  assert.equal(calls[2][0], '/shop/addresses/address%20%26%20one');
});

test('HTTP cart quantity changes and deletion use owned cart item IDs and preserve state on failure', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  await addShopCartProduct(api, { variantId: 'shop-variant-0', quantity: 2 });
  const [item] = await fetchShopCart(api);
  assert.notEqual(item.cartItemId, item.variantId);
  for (const quantity of [1, 3]) {
    await updateShopCartItem(api, item.cartItemId, { quantity });
    assert.equal((await fetchShopCart(api))[0].quantity, quantity);
  }
  await assert.rejects(updateShopCartItem(api, item.cartItemId, { quantity: 6 }), (error) => error.response.status === 409);
  const other = client('shop-customer-two');
  await assert.rejects(updateShopCartItem(other, item.cartItemId, { quantity: 1 }), (error) => error.response.status === 404);
  await assert.rejects(removeShopCartItem(other, item.cartItemId), (error) => error.response.status === 404);
  api.defaults.headers['x-test-commerce'] = 'unavailable';
  await assert.rejects(updateShopCartItem(api, item.cartItemId, { quantity: 2 }), (error) => error.response.status === 503);
  await assert.rejects(removeShopCartItem(api, item.cartItemId), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-commerce'];
  assert.equal((await fetchShopCart(api))[0].quantity, 3);
  await removeShopCartItem(api, item.cartItemId);
  assert.deepEqual(await fetchShopCart(api), []);
});

test('HTTP delivery address deletion preserves other addresses and rejects another account', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  const first = shopAddressId(await createShopAddress(api, address));
  const second = shopAddressId(await createShopAddress(api, { ...address, city: 'Delhi', isDefault: false }));
  await assert.rejects(removeShopAddress(client('shop-customer-two'), first), (error) => error.response.status === 404);
  api.defaults.headers['x-test-commerce'] = 'unavailable';
  await assert.rejects(removeShopAddress(api, first), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-commerce'];
  assert.equal((await fetchShopAddresses(api)).length, 2);
  await removeShopAddress(api, first);
  assert.deepEqual((await fetchShopAddresses(api)).map(shopAddressId), [second]);
  await removeShopAddress(api, second);
  assert.deepEqual(await fetchShopAddresses(api), []);
});


test('HTTP Buy Now reuses a cart variant and updates its quantity without adding stock twice', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  await prepareShopBuyNow(api, await fetchShopCart(api), { variantId: 'shop-variant-0', quantity: 1 });
  const [first] = await fetchShopCart(api);
  await prepareShopBuyNow(api, await fetchShopCart(api), { variantId: 'shop-variant-0', quantity: 5 });
  let items = await fetchShopCart(api);
  assert.equal(items.length, 1); assert.equal(items[0].cartItemId, first.cartItemId); assert.equal(items[0].quantity, 5);
  await prepareShopBuyNow(api, items, { variantId: 'shop-variant-0', quantity: 5 });
  assert.equal((await fetchShopCart(api))[0].quantity, 5);
  await addShopCartProduct(api, { variantId: 'shop-variant-1', quantity: 1 });
  await prepareShopBuyNow(api, await fetchShopCart(api), { variantId: 'shop-variant-0', quantity: 2 });
  items = await fetchShopCart(api);
  assert.equal(items.length, 2); assert.equal(items.find(row => row.variantId === 'shop-variant-0').quantity, 2);
});


test('order reason payloads, eligibility, encoded paths and user order login returns', async () => {
  assert.deepEqual(shopOrderReasonPayload({ reason: ' Changed my mind ', status: 'ignored' }), { reason: 'Changed my mind' });
  for (const reason of ['', ' ', null, true]) assert.throws(() => shopOrderReasonPayload({ reason }));
  assert.equal(canCancelShopOrder({ status: 'PENDING_PAYMENT' }), true);
  assert.equal(canCancelShopOrder({ status: 'DELIVERED' }), false);
  assert.equal(canCancelShopOrder({ status: 'PENDING', canCancel: false }), false);
  assert.equal(canReturnShopOrder({ status: 'DELIVERED' }), true);
  assert.equal(canReturnShopOrder({ status: 'DELIVERED', returnRequest: {} }), false);
  assert.equal(canReturnShopOrder({ status: 'DELIVERED', canReturn: false }), false);
  assert.equal(canReturnShopOrder({ status: 'RETURN_REQUESTED' }), false);
  assert.equal(shopLoginReturnPath('/user/orders/order-one'), '/user/orders/order-one');
  assert.equal(shopLoginReturnPath('/user/orders/../../superadmin/dashboard'), '');
  const calls = []; const api = { post: async (...args) => { calls.push(args); return { data: {} }; } };
  await cancelShopOrder(api, 'order & one', { reason: 'Changed my mind', ignored: true });
  await requestShopOrderReturn(api, 'order & one', { reason: 'Product arrived damaged' });
  assert.equal(calls[0][0], '/shop/orders/order%20%26%20one/cancel');
  assert.deepEqual(calls[0][1], { reason: 'Changed my mind' });
  assert.equal(calls[1][0], '/shop/orders/order%20%26%20one/return-request');
});

test('HTTP customer cancels pending orders and requests returns with status and ownership checks', { skip: !baseURL }, async () => {
  const api = client(); await reset(api);
  await addShopCartProduct(api, { variantId: 'shop-variant-0', quantity: 1 });
  const saved = await createShopAddress(api, address);
  const orderId = shopOrderId(await checkoutShopCart(api, shopAddressId(saved)));
  await assert.rejects(cancelShopOrder(client('shop-customer-two'), orderId, { reason: 'Changed my mind' }), error => error.response.status === 404);
  api.defaults.headers['x-test-commerce'] = 'unavailable';
  await assert.rejects(cancelShopOrder(api, orderId, { reason: 'Changed my mind' }), error => error.response.status === 503);
  delete api.defaults.headers['x-test-commerce'];
  assert.equal((await fetchShopOrder(api, orderId)).status, 'PENDING_PAYMENT');
  await cancelShopOrder(api, orderId, { reason: 'Changed my mind' });
  assert.equal((await fetchShopOrder(api, orderId)).status, 'CANCELLED');
  assert.equal((await fetchShopOrders(api)).items[0].status, 'CANCELLED');
  await assert.rejects(cancelShopOrder(api, orderId, { reason: 'Changed my mind' }), error => error.response.status === 409);
  await assert.rejects(requestShopOrderReturn(api, orderId, { reason: 'Product arrived damaged' }), error => error.response.status === 409);
  api.defaults.headers['x-test-commerce'] = 'order-after-write';
  await assert.rejects(requestShopOrderReturn(api, 'historic-order-1', { reason: 'Product arrived damaged' }), error => error.response.status === 503);
  delete api.defaults.headers['x-test-commerce'];
  const returned = await fetchShopOrder(api, 'historic-order-1');
  assert.equal(returned.status, 'RETURN_REQUESTED'); assert.equal(returned.returnRequest.reason, 'Product arrived damaged');
  await assert.rejects(requestShopOrderReturn(api, 'historic-order-1', { reason: 'Product arrived damaged' }), error => error.response.status === 409);
});
