// Request fields are supplied by the user. Response envelopes and seed IDs are synthetic.
const http = require('http');
const base = {
  code: 'BASIC', kind: 'PAID', displayName: 'Basic Growth',
  shortDescription: 'For growing wedding businesses that want more listings and lower direct lead prices.',
  monthlyPrice: 999, directLeadPrice: 10, maxActiveServiceListings: 5, maxActiveVenueProperties: 1,
  maxDirectLeadPurchasesPerMonth: 25, maxSharedLeadPurchasesPerMonth: 10, maxMediaPerListing: 15,
  featuredListingSlots: 0, benefits: ['5 active service listings', '1 active venue property', 'Direct leads at INR 10', '15 images per listing'],
  badgeText: 'Most Popular', theme: 'PURPLE', ctaText: 'Upgrade to Basic', sortOrder: 2,
  isFeatured: true, isActive: true, isDefault: false, isPurchasable: true,
};
const plans = [{ ...base, id: 'plan & basic', revision: 0 }, { ...base, id: 'plan-plus', code: 'PLUS', displayName: 'Plus Growth', isActive: false, sortOrder: 3, revision: 0 }];
const fields = Object.keys(base);
const flags = ['isFeatured', 'isActive', 'isDefault', 'isPurchasable'];
const numbers = ['monthlyPrice', 'directLeadPrice', 'maxActiveServiceListings', 'maxActiveVenueProperties', 'maxDirectLeadPurchasesPerMonth', 'maxSharedLeadPurchasesPerMonth', 'maxMediaPerListing', 'featuredListingSlots', 'sortOrder'];
function valid(plan) {
  return numbers.every((key) => typeof plan[key] === 'number' && Number.isFinite(plan[key]) && plan[key] >= 0)
    && flags.every((key) => typeof plan[key] === 'boolean')
    && Array.isArray(plan.benefits) && plan.benefits.every((item) => typeof item === 'string');
}
http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/v1/admin/subscription-plans')) return send(501, { message: 'Endpoint not modeled.' });
    if (req.headers.authorization !== 'Bearer plan-admin-token') return send(401, { message: 'Authentication token missing or malformed.' });
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/subscription-plans') {
      if (url.searchParams.has('isActive') && !['true', 'false'].includes(url.searchParams.get('isActive'))) return send(400, { message: 'Invalid active filter.' });
      const items = plans.filter((plan) => !url.searchParams.has('isActive') || plan.isActive === (url.searchParams.get('isActive') === 'true'));
      return send(200, { success: true, data: { subscriptionPlans: items } });
    }
    let body = req.body;
    if (!body) { let raw = ''; for await (const chunk of req) raw += chunk; body = raw ? JSON.parse(raw) : {}; }
    if (req.method === 'POST' && url.pathname === '/api/v1/admin/subscription-plans') {
      if (Object.keys(body).length !== fields.length || Object.keys(body).some((key) => !fields.includes(key)) || !valid(body)) return send(400, { message: 'Invalid create payload.' });
      if (plans.some((plan) => plan.code === body.code)) return send(409, { message: 'A plan with this code already exists.', errors: [{ field: 'code', message: 'Plan code must be unique.' }] });
      const plan = { ...body, id: `created-${plans.length}`, revision: 0 }; plans.push(plan);
      return send(201, { success: true, message: 'Subscription plan created.', data: { plan, received: body } });
    }
    const match = /^\/api\/v1\/admin\/subscription-plans\/([^/]+)(?:\/(activate|deactivate))?$/.exec(url.pathname);
    if (!match) return send(501, { message: 'Endpoint not modeled.' });
    const id = decodeURIComponent(match[1]), action = match[2];
    if (id === 'unavailable') return send(503, { message: 'Subscription service is unavailable.' });
    if (id === 'logical-failure') return send(200, { success: false, message: 'Plan change was declined.' });
    const plan = plans.find((item) => item.id === id);
    if (!plan) return send(404, { message: 'Subscription plan not found.' });
    if (req.method === 'PATCH' && !action) {
      if (!Object.keys(body).length || Object.keys(body).some((key) => !fields.includes(key)) || !valid({ ...plan, ...body })) return send(400, { message: 'Invalid partial update.' });
      Object.assign(plan, body, { revision: plan.revision + 1 });
      return send(200, { success: true, message: 'Subscription plan updated.', data: { plan, received: body } });
    }
    if (req.method === 'POST' && action) {
      if (Object.keys(body).length) return send(400, { message: 'No action payload is required.' });
      plan.isActive = action === 'activate'; plan.revision++;
      return send(200, { success: true, message: `Subscription plan ${plan.isActive ? 'activated' : 'deactivated'}.`, data: { plan } });
    }
    return send(501, { message: 'Endpoint not modeled.' });
  } catch { return send(400, { message: 'Invalid JSON request.' }); }
}).listen(process.env.PORT || 4508);
