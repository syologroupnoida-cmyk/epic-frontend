import { shopImageUrl, shopProductId, shopProductImages, shopProductPrice, shopProductSlug, shopStock } from './shopCatalog.mjs';

const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
const whole = (value) => ['string', 'number'].includes(typeof value) && String(value).trim() !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
const id = (value) => { if (typeof value !== 'string' || !value.trim()) throw new Error('A valid ID is required.'); return encodeURIComponent(value); };
export const shopAddressId = (row) => String(row?.id || row?.ecommerceAddressId || row?.addressId || '');
export const shopOrderId = (row) => String(row?.id || row?.ecommerceOrderId || row?.orderId || '');
export const shopVariantId = (row) => String(row?.id || row?.ecommerceVariantId || row?.variantId || '');
export function shopAccountData(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The shop request failed.');
  return record(body) && Object.hasOwn(body, 'data') ? body.data : body;
}
function rows(data, keys) {
  const items = Array.isArray(data) ? data : keys.map((key) => data?.[key]).find(Array.isArray);
  if (!Array.isArray(items) || items.some((row) => !record(row))) throw new Error('The server returned an invalid shop response.');
  return items;
}
export function shopCartItemPayload(values) {
  id(values.variantId);
  if (!whole(values.quantity) || Number(values.quantity) < 1) throw new Error('Choose a positive whole quantity.');
  return { variantId: values.variantId, quantity: Number(values.quantity) };
}
export function shopCartQuantityPayload(values) {
  if (!whole(values.quantity) || Number(values.quantity) < 1) throw new Error('Choose a positive whole quantity.');
  return { quantity: Number(values.quantity) };
}
export function shopAddressPayload(values) {
  const payload = {};
  for (const key of ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']) {
    if (typeof values[key] !== 'string' || !values[key].trim()) throw new Error(`Enter ${key === 'line1' ? 'the street address' : key.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
    payload[key] = values[key].trim();
  }
  if (!/^\d{10}$/.test(payload.phone)) throw new Error('Enter a 10-digit phone number.');
  if (!/^\d{6}$/.test(payload.pincode)) throw new Error('Enter a 6-digit pincode.');
  if (typeof values.isDefault !== 'boolean') throw new Error('Choose whether this is your default address.');
  return { ...payload, isDefault: values.isDefault };
}
export function normalizeShopCartItem(item) {
  const variant = item.variant || item.productVariant || {};
  const product = item.product || variant.product || item.productSnapshot || {};
  const variantId = String(item.variantId || item.ecommerceVariantId || shopVariantId(variant));
  if (!variantId || !whole(item.quantity) || Number(item.quantity) < 1) throw new Error('The server returned an invalid cart item.');
  const price = shopProductPrice(product, variant);
  const sale = item.unitSaleAmountPaise ?? item.unitPriceAmountPaise ?? item.saleAmountPaise ?? price.sale;
  const image = shopProductImages(product, variant)[0] || (shopImageUrl(variant.imageUrl) ? { url: variant.imageUrl, alt: product.title } : null);
  const cartItemId = String(item.id || item.ecommerceCartItemId || item.cartItemId || '');
  return { key: cartItemId || variantId, cartItemId, id: shopProductId(product) || String(item.productId || ''), variantId, slug: shopProductSlug(product) || item.productSlug || '', title: product.title || item.productTitle || item.title || 'Product', sku: variant.sku || item.sku || '', optionValues: variant.optionValues || item.optionValues || {}, image, sale: whole(sale) ? Number(sale) : null, quantity: Number(item.quantity), stock: shopStock(variant) };
}
export async function fetchShopCart(api, signal) {
  const data = shopAccountData(await api.get('/shop/cart', { signal }));
  if (data === null || (record(data) && Object.hasOwn(data, 'cart') && data.cart === null)) return [];
  const cart = data?.cart ?? data;
  return rows(cart, ['items', 'cartItems']).map(normalizeShopCartItem);
}
export async function addShopCartProduct(api, values, signal) {
  return shopAccountData(await api.post('/shop/cart/items', shopCartItemPayload(values), { signal }));
}
export async function prepareShopBuyNow(api, items, values) {
  const payload = shopCartItemPayload(values);
  const existing = items.find((row) => row.variantId === payload.variantId);
  if (!existing) return addShopCartProduct(api, payload);
  if (existing.quantity === payload.quantity) return { cartItemId: existing.cartItemId };
  if (!existing.cartItemId) throw new Error('The cart item ID is missing. Refresh your cart before buying this product.');
  return updateShopCartItem(api, existing.cartItemId, { quantity: payload.quantity });
}
export async function updateShopCartItem(api, cartItemId, values, signal) {
  return shopAccountData(await api.patch(`/shop/cart/items/${id(cartItemId)}`, shopCartQuantityPayload(values), { signal }));
}
export async function removeShopCartItem(api, cartItemId, signal) {
  return shopAccountData(await api.delete(`/shop/cart/items/${id(cartItemId)}`, { signal }));
}
export async function fetchShopWishlist(api, signal) {
  const data = shopAccountData(await api.get('/shop/wishlist', { signal }));
  return rows(data?.wishlist ?? data, ['products', 'items', 'wishlistItems']).map((item) => {
    const product = item.product || item.ecommerceProduct || item;
    const productId = item.product || item.ecommerceProduct ? shopProductId(product) : String(item.productId || shopProductId(product));
    if (!productId) throw new Error('The server returned an invalid wishlist item.');
    return { id: productId, slug: shopProductSlug(product), title: product.title || 'Saved product', image: shopProductImages(product)[0] || null, ...shopProductPrice(product) };
  });
}
export async function addShopWishlistProduct(api, productId, signal) {
  return shopAccountData(await api.post(`/shop/wishlist/products/${id(productId)}`, {}, { signal }));
}
export async function removeShopWishlistProduct(api, productId, signal) {
  return shopAccountData(await api.delete(`/shop/wishlist/products/${id(productId)}`, { signal }));
}
export async function fetchShopAddresses(api, signal) {
  const data = shopAccountData(await api.get('/shop/addresses', { signal }));
  const items = rows(data, ['addresses', 'items']);
  if (items.some((row) => !shopAddressId(row))) throw new Error('The server returned an invalid address.');
  return items;
}
export async function createShopAddress(api, values, signal) {
  const data = shopAccountData(await api.post('/shop/addresses', shopAddressPayload(values), { signal }));
  return data?.address ?? data;
}
export async function updateShopAddress(api, addressId, values, signal) {
  const data = shopAccountData(await api.patch(`/shop/addresses/${id(addressId)}`, shopAddressPayload(values), { signal }));
  return data?.address ?? data;
}
export async function removeShopAddress(api, addressId, signal) {
  return shopAccountData(await api.delete(`/shop/addresses/${id(addressId)}`, { signal }));
}
export async function checkoutShopCart(api, addressId, signal) {
  id(addressId);
  const data = shopAccountData(await api.post('/shop/checkout', { addressId }, { signal }));
  return data?.order ?? data;
}
export async function fetchShopOrders(api, { page = 1, limit = 20, signal } = {}) {
  if (!whole(page) || Number(page) < 1 || ![20, 50, 100].includes(Number(limit))) throw new Error('Invalid order pagination.');
  const response = await api.get('/shop/orders', { params: { page: Number(page), limit: Number(limit) }, signal });
  const data = shopAccountData(response);
  const items = rows(data, ['orders', 'items', 'results']);
  if (items.some((row) => !shopOrderId(row))) throw new Error('The server returned an invalid order.');
  const meta = data?.pagination ?? response.data?.pagination ?? {};
  const total = whole(meta.total) ? Number(meta.total) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : total >= 0 ? page * limit < total : items.length === limit;
  return { items, total, hasNext };
}
export async function fetchShopOrder(api, orderId, signal) {
  const data = shopAccountData(await api.get(`/shop/orders/${id(orderId)}`, { signal }));
  const order = data?.order ?? data;
  if (!record(order) || !shopOrderId(order)) throw new Error('Order details are unavailable.');
  return order;
}
export function shopOrderReasonPayload(values) {
  if (typeof values?.reason !== 'string' || !values.reason.trim()) throw new Error('Enter a reason.');
  return { reason: values.reason.trim() };
}
export const canCancelShopOrder = (order) => typeof order?.canCancel === 'boolean' ? order.canCancel : ['PENDING', 'PENDING_PAYMENT'].includes(String(order?.status).toUpperCase());
export const canReturnShopOrder = (order) => {
  if (typeof order?.canRequestReturn === 'boolean') return order.canRequestReturn;
  if (typeof order?.canReturn === 'boolean') return order.canReturn;
  return String(order?.status).toUpperCase() === 'DELIVERED' && !order.returnRequest && !order.returnRequestedAt && !order.returnRequests?.length;
};
export async function cancelShopOrder(api, orderId, values, signal) {
  return shopAccountData(await api.post(`/shop/orders/${id(orderId)}/cancel`, shopOrderReasonPayload(values), { signal }));
}
export async function requestShopOrderReturn(api, orderId, values, signal) {
  return shopAccountData(await api.post(`/shop/orders/${id(orderId)}/return-request`, shopOrderReasonPayload(values), { signal }));
}
export const shopOrderTotal = (order) => order?.totalAmountPaise ?? order?.grandTotalAmountPaise ?? order?.totalPaise ?? order?.totals?.totalAmountPaise;

export function shopLoginReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '';
  try {
    const url = new URL(value, 'https://epic.invalid');
    return url.origin === 'https://epic.invalid' && (url.pathname === '/shop' || url.pathname.startsWith('/shop/') || url.pathname === '/user/orders' || url.pathname.startsWith('/user/orders/')) ? `${url.pathname}${url.search}${url.hash}` : '';
  } catch { return ''; }
}
