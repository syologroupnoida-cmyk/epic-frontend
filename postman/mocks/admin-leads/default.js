// Request paths/payloads come from the user. Responses and transitions are synthetic.
const http = require('http');
const leads = Array.from({ length: 25 }, (_, index) => ({
  id: index ? `lead-${index + 1}` : 'lead & one', customerName: `Customer ${index + 1}`,
  customerPhone: '9876543210', customerEmail: 'customer@example.com',
  eventDate: '2027-02-10', guestCount: 250, message: 'Need wedding planning support.',
  status: 'PENDING_REVIEW', leadType: index % 2 ? 'DIRECT' : 'SHARED',
  city: { id: 'city-test', name: 'Test City' }, serviceSubcategory: { name: 'Wedding planning' },
  metadata: { verified: false, purchaseCount: 0 }, createdAt: '2026-10-28T08:00:00Z',
}));
http.createServer(async (req, res) => {
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/v1/admin/leads')) return send(501, { message: 'Endpoint not modeled.' });
    if (req.headers.authorization !== 'Bearer lead-admin-token') return send(401, { message: 'Authentication token missing or malformed.' });
    if (req.method === 'GET' && url.pathname === '/api/v1/admin/leads') {
      for (const name of ['status', 'leadType', 'search']) if (url.searchParams.has(name) && !url.searchParams.get(name).trim()) return send(400, { message: 'Empty filters must be omitted.' });
      const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
      if (page < 1 || limit < 1) return send(400, { message: 'Invalid pagination.' });
      const items = leads.filter((item) => (!url.searchParams.has('status') || item.status === url.searchParams.get('status')) && (!url.searchParams.has('leadType') || item.leadType === url.searchParams.get('leadType')) && (!url.searchParams.has('search') || item.customerName.toLowerCase().includes(url.searchParams.get('search').toLowerCase())));
      return send(200, { success: true, data: { leads: items.slice((page - 1) * limit, page * limit), pagination: { total: items.length, hasNextPage: page * limit < items.length } } });
    }
    const match = /^\/api\/v1\/admin\/leads\/([^/]+)(?:\/(activate|reject|close))?$/.exec(url.pathname);
    if (!match) return send(501, { message: 'Endpoint not modeled.' });
    const id = decodeURIComponent(match[1]), action = match[2];
    if (id === 'unavailable') return send(503, { message: 'Lead service is unavailable.' });
    if (id === 'denied') return send(200, { success: false, message: 'Lead moderation denied.' });
    const item = leads.find((item) => item.id === id);
    if (!item) return send(404, { message: 'Lead not found.' });
    if (req.method === 'GET' && !action) return send(200, { success: true, data: { lead: item } });
    if (req.method !== 'POST' || !action) return send(501, { message: 'Endpoint not modeled.' });
    let payload = req.body;
    if (!payload) { let body = ''; for await (const chunk of req) body += chunk; payload = JSON.parse(body); }
    if (action === 'activate') {
      if (Object.keys(payload).sort().join(',') !== 'basePrice,maxBuyerCount' || typeof payload.basePrice !== 'number' || payload.basePrice < 0 || !Number.isInteger(payload.maxBuyerCount) || payload.maxBuyerCount < 1) return send(400, { message: 'Invalid activation payload.' });
      if (item.status !== 'PENDING_REVIEW') return send(409, { message: 'Lead already reviewed.' });
      Object.assign(item, payload, { status: 'ACTIVE' });
    } else {
      if (Object.keys(payload).join(',') !== 'reason' || typeof payload.reason !== 'string' || !payload.reason.trim()) return send(400, { message: 'A reason is required.' });
      Object.assign(item, { status: action === 'reject' ? 'REJECTED' : 'CLOSED', [action === 'reject' ? 'rejectionReason' : 'closureReason']: payload.reason });
    }
    return send(200, { success: true, message: `Lead ${action === 'activate' ? 'activated' : action === 'reject' ? 'rejected' : 'closed'} successfully.`, data: item });
  } catch { return send(400, { message: 'Invalid request.' }); }
}).listen(process.env.PORT || 4507);
