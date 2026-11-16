import { shopAccountData, shopOrderId, shopOrderReasonPayload } from './shopAccount.mjs';
const base = '/admin/ecommerce/orders';
const encodedId = value => { if (typeof value !== 'string' || !value.trim()) throw new Error('A valid order ID is required.'); return encodeURIComponent(value); };
const statuses = ['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'REFUNDED'];
export const ecommerceOrderStage = order => String(order.fulfilmentStatus || order.fulfillmentStatus || order.status || '').toUpperCase();
export const ecommerceOrderCustomer = order => order.customer?.fullName || order.customer?.name || order.user?.fullName || order.address?.fullName || order.shippingAddress?.fullName || order.addressSnapshot?.fullName || order.customer?.email || order.user?.email || 'Unavailable';
export function ecommerceOrderActions(order) {
  const stage = ecommerceOrderStage(order);
  const payment = String(order.paymentStatus || '').toUpperCase();
  const pending = ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_PENDING'].includes(String(order.status || '').toUpperCase()) && payment !== 'PAID';
  const actions = [];
  if (pending) actions.push({ key: 'mark-paid', label: 'Mark paid (test)' }, { key: 'cancel', label: 'Cancel order' });
  if (['PAID', 'CONFIRMED'].includes(stage) || (payment === 'PAID' && ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_PENDING', 'UNFULFILLED'].includes(stage))) actions.push({ key: 'PROCESSING', label: 'Start processing' });
  if (stage === 'PROCESSING') actions.push({ key: 'PACKED', label: 'Mark packed' });
  if (stage === 'PACKED') actions.push({ key: 'SHIPPED', label: 'Ship order' });
  if (stage === 'SHIPPED') actions.push({ key: 'DELIVERED', label: 'Mark delivered' });
  if (['RETURN_REQUESTED', 'RETURN_APPROVED'].includes(stage) || (stage === 'DELIVERED' && (order.returnRequest || order.returnRequests?.length || order.returnRequestedAt))) actions.push({ key: 'RETURNED', label: 'Accept return and restock' });
  if (stage === 'RETURNED') actions.push({ key: 'REFUNDED', label: 'Record refund' });
  return actions;
}
export function ecommerceFulfilmentPayload(values) {
  if (!statuses.includes(values?.status)) throw new Error('Choose a valid fulfilment status.');
  const payload = { status: values.status };
  if (values.status === 'SHIPPED') {
    for (const key of ['courierName', 'trackingNumber', 'trackingUrl']) {
      if (typeof values[key] !== 'string' || !values[key].trim()) throw new Error('Enter the courier name, tracking number and tracking URL.');
      payload[key] = values[key].trim();
    }
    let url;
    try { url = new URL(payload.trackingUrl); } catch { throw new Error('Enter a valid tracking URL.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Enter an HTTP or HTTPS tracking URL.');
  }
  return payload;
}
export async function fetchEcommerceOrders(api, { page = 1, limit = 20, signal } = {}) {
  if (!Number.isSafeInteger(page) || page < 1 || ![20, 50, 100].includes(limit)) throw new Error('Invalid order pagination.');
  const response = await api.get(base, { params: { page, limit }, signal });
  const data = shopAccountData(response);
  const items = Array.isArray(data) ? data : [data?.orders, data?.items, data?.results].find(Array.isArray);
  if (!Array.isArray(items) || items.some(row => !row || !shopOrderId(row))) throw new Error('The server returned an invalid order list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems;
  const total = count != null && String(count).trim() && Number.isSafeInteger(Number(count)) && Number(count) >= 0 ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : total >= 0 ? page * limit < total : meta.totalPages ? page < Number(meta.totalPages) : items.length === limit;
  return { items, total, hasNext };
}
export async function fetchEcommerceOrder(api, orderId, signal) {
  const data = shopAccountData(await api.get(`${base}/${encodedId(orderId)}`, { signal }));
  const order = data?.order ?? data;
  if (!order || !shopOrderId(order)) throw new Error('Order details are unavailable.');
  return order;
}
export async function markEcommerceOrderPaidForTest(api, orderId, signal) {
  return shopAccountData(await api.post(`${base}/${encodedId(orderId)}/mark-paid-for-test`, {}, { signal }));
}
export async function cancelEcommerceOrder(api, orderId, values, signal) {
  return shopAccountData(await api.post(`${base}/${encodedId(orderId)}/cancel`, shopOrderReasonPayload(values), { signal }));
}
export async function updateEcommerceOrderFulfilment(api, orderId, values, signal) {
  return shopAccountData(await api.patch(`${base}/${encodedId(orderId)}/fulfilment`, ecommerceFulfilmentPayload(values), { signal }));
}
