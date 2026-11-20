// Subscription payment creation and verification endpoints were supplied by the user.
// The two catalog plans and response envelope come from the user's API response.
// The third plan, wallet/subscription responses, balances and errors are synthetic.
const http = require('http');
const plans = [
  ...require('./plans.response.json').data.plans.map((entry) => entry.plan),
  { id: 'pro-plan', code: 'PRO', displayName: 'Professional', kind: 'PAID', monthlyPrice: 2499, directLeadPrice: 5, isActive: true, isPurchasable: true, sortOrder: 2, isFeatured: true, benefits: ['10 active listings'] },
];
let subscription = null;
let currentPlanId = plans[0].id;
let balance = 5000;
const pendingPayments = new Map();
const transactions = Array.from({ length: 21 }, (_, index) => ({ id: `seed-${index}`, type: 'CREDIT', amount: 100, balanceAfter: 5000, currency: 'INR', description: 'Wallet credit', status: 'COMPLETED', createdAt: '2026-10-29T09:00:00Z' }));
http.createServer(async (req, res) => {
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.headers.authorization !== 'Bearer vendor-billing-token') return send(401, { message: 'Authentication token missing or malformed.' });
    if (req.method === 'GET') {
      if (url.pathname === '/api/v1/vendor/subscription-plans') return send(200, { success: true, data: { currentPlanId, currentPlanSource: subscription ? 'SUBSCRIPTION' : 'DEFAULT_FREE_PLAN', plans: plans.map((plan) => ({ plan, isCurrentPlan: plan.id === currentPlanId, cardAction: plan.id === currentPlanId ? 'CURRENT_PLAN' : 'UPGRADE' })) } });
      if (url.pathname === '/api/v1/vendor/subscription') return send(200, { success: true, data: { subscription } });
      if (url.pathname === '/api/v1/vendor/wallet') return send(200, { success: true, data: { wallet: { balance, currency: 'INR' } } });
      if (url.pathname === '/api/v1/vendor/wallet/transactions') {
        const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
        if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1) return send(400, { message: 'Invalid pagination.' });
        return send(200, { success: true, data: { transactions: transactions.slice((page - 1) * limit, page * limit), pagination: { total: transactions.length, page, limit, hasNextPage: page * limit < transactions.length } } });
      }
    }
    const paymentCreate = /^\/api\/v1\/vendor\/subscription-plans\/([^/]+)\/payment$/.exec(url.pathname);
    if (req.method === 'POST' && paymentCreate) {
      const planId = decodeURIComponent(paymentCreate[1]);
      if (planId === 'unavailable') return send(503, { message: 'Subscription service is unavailable.' });
      if (planId === 'declined') return send(200, { success: false, message: 'Purchase declined.' });
      const plan = plans.find((item) => item.id === planId);
      if (!plan) return send(404, { message: 'Subscription plan not found.' });
      if (currentPlanId === plan.id) return send(409, { message: 'This plan is already active.' });
      if (!plan.isPurchasable) return send(400, { message: 'This plan cannot be purchased.' });
      const paymentId = `vendor-payment-${transactions.length + 1}`;
      const orderId = `order_subscription_${transactions.length + 1}`;
      const amountPaise = Math.round(Number(plan.monthlyPrice) * 100);
      pendingPayments.set(paymentId, { plan, orderId });
      return send(200, { success: true, message: 'Subscription payment created.', data: { vendorSubscriptionPaymentId: paymentId, vendorSubscriptionRazorpayOrderId: orderId, razorpayKeyId: 'rzp_test_subscription', amountPaise, currency: 'INR', checkoutOptions: { key: 'rzp_test_subscription', order_id: orderId, amount: amountPaise, currency: 'INR' } } });
    }
    const paymentVerify = /^\/api\/v1\/vendor\/subscription-payments\/([^/]+)\/verify$/.exec(url.pathname);
    if (req.method === 'POST' && paymentVerify) {
      let body = req.body;
      if (!body) { let raw = ''; for await (const chunk of req) raw += chunk; body = raw ? JSON.parse(raw) : {}; }
      const paymentId = decodeURIComponent(paymentVerify[1]);
      const pending = pendingPayments.get(paymentId);
      if (!pending) return send(404, { message: 'Subscription payment not found.' });
      if (Object.keys(body).length !== 3 || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) return send(400, { message: 'Payment signature verification failed.' });
      if (body.razorpay_order_id !== pending.orderId) return send(400, { message: 'Payment signature verification failed.' });
      const { plan } = pending;
      pendingPayments.delete(paymentId);
      const verifiedAt = new Date().toISOString();
      subscription = { id: `sub-${paymentId}`, planId: plan.id, plan, status: 'ACTIVE', expiresAt: '2026-12-29T09:00:00Z' };
      currentPlanId = plan.id;
      balance -= Number(plan.monthlyPrice);
      transactions.unshift({ id: `purchase-${transactions.length}`, type: 'DEBIT', amount: Number(plan.monthlyPrice), balanceAfter: balance, currency: 'INR', description: `${plan.displayName} subscription`, status: 'COMPLETED', referenceId: body.razorpay_payment_id, createdAt: verifiedAt });
      return send(200, { success: true, message: 'Subscription payment verified successfully.', data: { subscription } });
    }
    return send(501, { message: 'Endpoint not modeled.' });
  } catch { return send(400, { message: 'Invalid JSON request.' }); }
}).listen(process.env.PORT || 4509);
