// Synthetic authenticated customer API. No production credentials or writes.
const { products } = require('./shop');
const accounts = new Map();
let sequence = 1;
const initial = () => ({ addresses: [], cart: [], wishlist: [], orders: Array.from({ length: 25 }, (_, index) => ({ id: `historic-order-${index + 1}`, orderNumber: `EP-${index + 1}`, status: index === 0 ? 'DELIVERED' : 'PENDING_PAYMENT', paymentStatus: index === 0 ? 'PAID' : 'UNPAID', totalAmountPaise: 1299000, createdAt: '2026-11-13T10:00:00Z', items: [] })) });
const variantFor = (variantId) => products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))).find((row) => row.variant.id === variantId);
function cartItems(account) {
  return account.cart.map((item) => {
    const { product, variant } = variantFor(item.variantId);
    return { ...item, variant: { ...variant, product: { id: product.id, slug: product.slug, title: product.title, images: product.images } } };
  });
}
module.exports = async function customer(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const base = '/api/v1/shop';
  if (url.pathname !== '/__shop_reset' && !['/addresses', '/cart', '/cart/items', '/wishlist', '/wishlist/products/', '/checkout', '/orders', '/payments'].some((path) => path.endsWith('/') ? url.pathname.startsWith(base + path) : url.pathname === base + path || url.pathname.startsWith(base + path + '/'))) return false;
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); return true; };
  const ok = (data, status = 200) => send(status, { success: true, data });
  const token = req.headers.authorization;
  if (!['Bearer shop-customer-one', 'Bearer shop-customer-two'].includes(token)) return send(401, { message: 'Please sign in.' });
  if (url.pathname === '/__shop_reset' && req.method === 'POST') { accounts.clear(); sequence = 1; products.forEach((product) => product.variants.forEach((variant) => { variant.availableQuantity = 5; })); return ok({}); }
  if (!accounts.has(token)) accounts.set(token, initial());
  const account = accounts.get(token);
  if (req.headers['x-test-commerce'] === 'unavailable') return send(503, { message: 'Shop service unavailable.' });
  if (req.headers['x-test-commerce'] === 'invalid') return ok({ invalid: true });
  let body = req.body;
  if (['POST', 'PATCH'].includes(req.method)) {
    if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
    else if (typeof body === 'string') body = JSON.parse(body);
  }
  if (url.pathname === base + '/cart' && req.method === 'GET') return ok({ cart: { items: cartItems(account) } });
  if (url.pathname === base + '/cart/items' && req.method === 'POST') {
    if (!body || Object.keys(body).sort().join(',') !== 'quantity,variantId' || !Number.isSafeInteger(body.quantity) || body.quantity < 1) return send(400, { message: 'Invalid cart payload.' });
    const found = variantFor(body.variantId);
    if (!found) return send(404, { message: 'Variant not found.' });
    const existing = account.cart.find((item) => item.variantId === body.variantId);
    if ((existing?.quantity || 0) + body.quantity > found.variant.availableQuantity) return send(409, { message: 'Not enough stock available.' });
    if (existing) existing.quantity += body.quantity;
    else account.cart.push({ id: `cart-item-${sequence++}`, ...body });
    return ok({ cart: { items: cartItems(account) } }, 201);
  }
  const cartItem = url.pathname.match(/^\/api\/v1\/shop\/cart\/items\/([^/]+)$/);
  if (cartItem && ['PATCH', 'DELETE'].includes(req.method)) {
    const item = account.cart.find((row) => row.id === decodeURIComponent(cartItem[1]));
    if (!item) return send(404, { message: 'Cart item not found.' });
    if (req.method === 'PATCH') {
      if (!body || Object.keys(body).join(',') !== 'quantity' || !Number.isSafeInteger(body.quantity) || body.quantity < 1) return send(400, { message: 'Expected a positive whole quantity only.' });
      if (body.quantity > variantFor(item.variantId).variant.availableQuantity) return send(409, { message: 'Not enough stock available.' });
      item.quantity = body.quantity;
    } else account.cart = account.cart.filter((row) => row.id !== item.id);
    return ok({});
  }
  if (url.pathname === base + '/wishlist' && req.method === 'GET') return ok({ wishlist: { products: account.wishlist.map((id) => products.find((product) => product.id === id)) } });
  const wish = url.pathname.match(/^\/api\/v1\/shop\/wishlist\/products\/([^/]+)$/);
  if (wish && ['POST', 'DELETE'].includes(req.method)) {
    const id = decodeURIComponent(wish[1]);
    if (!products.some((product) => product.id === id)) return send(404, { message: 'Product not found.' });
    if (req.method === 'POST' && !account.wishlist.includes(id)) account.wishlist.push(id);
    if (req.method === 'DELETE') account.wishlist = account.wishlist.filter((value) => value !== id);
    return ok({});
  }
  if (url.pathname === base + '/addresses' && req.method === 'GET') return ok({ addresses: account.addresses });
  const edit = url.pathname.match(/^\/api\/v1\/shop\/addresses\/([^/]+)$/);
  if (edit && req.method === 'DELETE') {
    const index = account.addresses.findIndex((row) => row.id === decodeURIComponent(edit[1]));
    if (index < 0) return send(404, { message: 'Address not found.' });
    account.addresses.splice(index, 1);
    return ok({});
  }
  if ((url.pathname === base + '/addresses' && req.method === 'POST') || (edit && req.method === 'PATCH')) {
    if (!body || Object.keys(body).sort().join(',') !== 'city,fullName,isDefault,line1,phone,pincode,state' || typeof body.isDefault !== 'boolean') return send(400, { message: 'Invalid address payload.' });
    let address;
    if (edit) { address = account.addresses.find((row) => row.id === decodeURIComponent(edit[1])); if (!address) return send(404, { message: 'Address not found.' }); }
    else { address = { id: `address & ${sequence++}` }; account.addresses.push(address); }
    if (body.isDefault) account.addresses.forEach((row) => { row.isDefault = false; });
    Object.assign(address, body);
    return ok({ address }, edit ? 200 : 201);
  }
  if (url.pathname === base + '/checkout' && req.method === 'POST') {
    if (!body || Object.keys(body).join(',') !== 'addressId') return send(400, { message: 'Expected addressId only.' });
    const address = account.addresses.find((row) => row.id === body.addressId);
    if (!address) return send(404, { message: 'Address not found.' });
    if (!account.cart.length) return send(400, { message: 'Your cart is empty.' });
    if (account.cart.some((item) => item.quantity > variantFor(item.variantId).variant.availableQuantity)) return send(409, { message: 'Stock changed. Review your cart.' });
    const items = cartItems(account);
    account.cart.forEach((item) => { variantFor(item.variantId).variant.availableQuantity -= item.quantity; });
    const order = { id: `order & ${sequence++}`, status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', address: { ...address }, items, totalAmountPaise: items.reduce((sum, item) => sum + item.variant.saleAmountPaise * item.quantity, 0), createdAt: new Date().toISOString() };
    account.orders.unshift(order); account.cart = [];
    if (req.headers['x-test-commerce'] === 'checkout-after-write') return send(503, { message: 'Response lost after reservation.' });
    return ok({ order }, 201);
  }
  if (url.pathname === base + '/orders' && req.method === 'GET') {
    if ([...url.searchParams.keys()].sort().join(',') !== 'limit,page') return send(400, { message: 'Expected page and limit.' });
    const page = Number(url.searchParams.get('page')); const limit = Number(url.searchParams.get('limit'));
    return ok({ orders: account.orders.slice((page - 1) * limit, page * limit), pagination: { total: account.orders.length, hasNextPage: page * limit < account.orders.length } });
  }
  const orderAction = url.pathname.match(/^\/api\/v1\/shop\/orders\/([^/]+)\/(cancel|return-request)$/);
  if (orderAction && req.method === 'POST') {
    const order = account.orders.find(row => row.id === decodeURIComponent(orderAction[1]));
    if (!order) return send(404, { message: 'Order not found.' });
    if (!body || Object.keys(body).join(',') !== 'reason' || typeof body.reason !== 'string' || !body.reason.trim()) return send(400, { message: 'Expected a reason only.' });
    if (orderAction[2] === 'cancel') {
      if (!['PENDING', 'PENDING_PAYMENT'].includes(order.status)) return send(409, { message: 'Only pending orders can be cancelled.' });
      order.status = 'CANCELLED'; order.cancellationReason = body.reason;
      order.items.forEach(item => { const found = variantFor(item.variantId); if (found) found.variant.availableQuantity += item.quantity; });
    } else {
      if (order.status !== 'DELIVERED' || order.returnRequest) return send(409, { message: 'Order is not eligible for a return request.' });
      order.status = 'RETURN_REQUESTED'; order.returnRequest = { reason: body.reason, status: 'PENDING' };
    }
    if (req.headers['x-test-commerce'] === 'order-after-write') return send(503, { message: 'Response lost after order update.' });
    return ok({ order });
  }
  // Payment response envelopes are synthetic until a backend example is supplied.
  const paymentOrder = url.pathname.match(/^\/api\/v1\/shop\/orders\/([^/]+)\/payment$/);
  if (paymentOrder && req.method === 'POST') {
    const order = account.orders.find(row => row.id === decodeURIComponent(paymentOrder[1]));
    if (!order) return send(404, { message: 'Order not found.' });
    if (!['PENDING', 'PENDING_PAYMENT'].includes(order.status) || order.paymentStatus === 'PAID') return send(409, { message: 'Order is not awaiting payment.' });
    if (Object.keys(body || {}).length) return send(400, { message: 'Payment creation expects an empty body in this fixture.' });
    account.payments ||= [];
    const payment = { id: `payment & ${sequence++}`, orderId: order.id, razorpayOrderId: `order_synthetic_${sequence}`, amountPaise: order.totalAmountPaise, currency: 'INR' };
    account.payments.push(payment);
    if (req.headers['x-test-commerce'] === 'payment-after-write') return send(503, { message: 'Response lost after payment creation.' });
    return ok({ payment, keyId: 'rzp_test_synthetic' }, 201);
  }
  const verify = url.pathname.match(/^\/api\/v1\/shop\/payments\/([^/]+)\/verify$/);
  if (verify && req.method === 'POST') {
    const payment = account.payments?.find(row => row.id === decodeURIComponent(verify[1]));
    if (!payment) return send(404, { message: 'Payment not found.' });
    if (Object.keys(body || {}).sort().join(',') !== 'razorpay_order_id,razorpay_payment_id,razorpay_signature' || body.razorpay_order_id !== payment.razorpayOrderId || body.razorpay_payment_id !== 'pay_synthetic' || body.razorpay_signature !== 'synthetic-signature') return send(400, { message: 'Payment signature verification failed.' });
    const order = account.orders.find(row => row.id === payment.orderId);
    if (order.status === 'CANCELLED') return send(409, { message: 'Order was cancelled.' });
    order.paymentStatus = 'PAID'; order.status = 'PAID';
    if (req.headers['x-test-commerce'] === 'verify-after-write') return send(503, { message: 'Response lost after verification.' });
    return ok({ order, payment: { ...payment, status: 'CAPTURED' } });
  }
  const details = url.pathname.match(/^\/api\/v1\/shop\/orders\/([^/]+)$/);
  if (details && req.method === 'GET') {
    const order = account.orders.find((row) => row.id === decodeURIComponent(details[1]));
    return order ? ok({ order }) : send(404, { message: 'Order not found.' });
  }
  return send(501, { message: 'Customer operation not modeled.' });
};
