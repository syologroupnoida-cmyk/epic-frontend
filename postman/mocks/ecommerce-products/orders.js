// Synthetic admin orders; no live orders, payments, refunds or inventory are changed.
const seed = () => Array.from({ length: 25 }, (_, index) => ({ id: `admin-order & ${index + 1}`, orderNumber: `ADMIN-${index + 1}`, status: index === 1 ? 'RETURN_REQUESTED' : 'PENDING_PAYMENT', paymentStatus: index === 1 ? 'PAID' : 'UNPAID', customer: { fullName: `Customer ${index + 1}`, email: `customer${index + 1}@example.test` }, createdAt: '2026-11-14T10:00:00Z', totalAmountPaise: 1299000, address: { fullName: `Customer ${index + 1}`, line1: '123 Main Street', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', phone: '9876543210' }, items: [{ id: `item-${index + 1}`, productTitle: 'Royal Bridal Lehenga', sku: 'LEH-RED-M', quantity: 1, unitSaleAmountPaise: 1299000 }] }));
let orders = seed();
module.exports = async function adminOrders(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const base = '/api/v1/admin/ecommerce/orders';
  if (url.pathname !== '/__admin_orders_reset' && url.pathname !== base && !url.pathname.startsWith(base + '/')) return false;
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); return true; };
  const ok = data => send(200, { success: true, data });
  if (req.method === 'POST' && url.pathname === '/__admin_orders_reset') { orders = seed(); return ok({}); }
  if (req.headers['x-test-orders'] === 'unavailable') return send(503, { message: 'Order service unavailable.' });
  if (req.headers['x-test-orders'] === 'invalid') return ok({ invalid: true });
  if (url.pathname === base && req.method === 'GET') {
    if ([...url.searchParams.keys()].sort().join(',') !== 'limit,page') return send(400, { message: 'Expected page and limit only.' });
    const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
    return ok({ orders: orders.slice((page - 1) * limit, page * limit), pagination: { total: orders.length, hasNextPage: page * limit < orders.length } });
  }
  const route = url.pathname.slice(base.length + 1).split('/');
  const order = orders.find(row => row.id === decodeURIComponent(route[0]));
  if (!order) return send(404, { message: 'Order not found.' });
  if (route.length === 1 && req.method === 'GET') return ok({ order });
  let body = req.body;
  if (['POST', 'PATCH'].includes(req.method)) {
    if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
    else if (typeof body === 'string') body = JSON.parse(body);
  }
  if (route[1] === 'mark-paid-for-test' && req.method === 'POST') {
    if (Object.keys(body || {}).length) return send(400, { message: 'No payment fields expected.' });
    if (order.status !== 'PENDING_PAYMENT') return send(409, { message: 'Only payment-pending orders can be marked paid.' });
    order.status = 'PAID'; order.paymentStatus = 'PAID';
  } else if (route[1] === 'cancel' && req.method === 'POST') {
    if (!body || Object.keys(body).join(',') !== 'reason' || typeof body.reason !== 'string' || !body.reason.trim()) return send(400, { message: 'Expected reason only.' });
    if (order.status !== 'PENDING_PAYMENT') return send(409, { message: 'Only payment-pending orders can be cancelled.' });
    order.status = 'CANCELLED'; order.cancellationReason = body.reason;
  } else if (route[1] === 'fulfilment' && req.method === 'PATCH') {
    const transitions = { PAID: 'PROCESSING', PROCESSING: 'PACKED', PACKED: 'SHIPPED', SHIPPED: 'DELIVERED', RETURN_REQUESTED: 'RETURNED', RETURNED: 'REFUNDED' };
    if (transitions[order.status] !== body?.status) return send(409, { message: 'Invalid fulfilment transition.' });
    const keys = body.status === 'SHIPPED' ? 'courierName,status,trackingNumber,trackingUrl' : 'status';
    if (Object.keys(body).sort().join(',') !== keys) return send(400, { message: 'Unexpected fulfilment fields.' });
    if (body.status === 'SHIPPED' && ['courierName', 'trackingNumber', 'trackingUrl'].some(key => typeof body[key] !== 'string' || !body[key].trim())) return send(400, { message: 'Shipping fields are required.' });
    Object.assign(order, body);
    if (body.status === 'REFUNDED') order.paymentStatus = 'REFUNDED';
  } else return send(501, { message: 'Admin order operation not modeled.' });
  if (req.headers['x-test-orders'] === 'after-write') return send(503, { message: 'Response lost after order update.' });
  return ok({ order });
};
