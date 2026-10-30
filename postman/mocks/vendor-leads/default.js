// Synthetic responses: the user supplied the read endpoints, not their response schema.
const http = require('http');
const leads = Array.from({ length: 25 }, (_, index) => ({
  id: index ? `lead-${index + 1}` : 'lead & one', customerName: `Customer ${index + 1}`,
  customerPhone: '9876543210', customerEmail: 'customer@example.com',
  eventDate: '2027-02-10', guestCount: 250, message: 'Please share package details.',
  status: 'NEW', source: 'SERVICE_ENQUIRY', listing: { id: 'listing-test', title: 'Wedding photography' },
  city: { id: 'city-test', name: 'Test City' }, budgetMin: 100000, budgetMax: 500000,
  metadata: { contacted: false, followUpCount: 0, interests: ['Photography', 'Film'] },
  createdAt: '2026-10-28T08:00:00Z',
}));
const purchased = new Set();
const shared = Array.from({ length: 25 }, (_, index) => ({
  id: index ? `shared-${index + 1}` : 'shared & one',
  sharedLeadId: index ? `shared-${index + 1}` : 'shared & one',
  leadId: `shared-origin-${index + 1}`, price: 199, currency: 'INR',
  lead: { id: `shared-origin-${index + 1}`, customerName: `Shared customer ${index + 1}`, guestCount: 300, eventDate: '2027-03-10', city: { name: 'Test City' }, serviceSubcategory: { name: 'Wedding Photography' } },
}));
http.createServer((req, res) => {
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  const url = new URL(req.url, 'http://localhost');
  const matchesSearch = (item) => !url.searchParams.has('search') || JSON.stringify(item).toLowerCase().includes(url.searchParams.get('search').toLowerCase());
  if (url.searchParams.has('search') && !url.searchParams.get('search').trim()) return send(400, { message: 'Empty search must be omitted.' });
  if (!url.pathname.startsWith('/api/v1/vendor/leads')) return send(501, { message: 'Endpoint not modeled.' });
  if (req.headers.authorization !== 'Bearer lead-vendor-token') return send(401, { message: 'Authentication token missing or malformed.' });
  const purchase = /^\/api\/v1\/vendor\/leads\/([^/]+)\/purchase$/.exec(url.pathname);
  if (req.method === 'POST' && purchase) {
    const id = decodeURIComponent(purchase[1]);
    if (id === 'unavailable') return send(503, { message: 'Unable to purchase this lead.' });
    const item = shared.find((item) => item.sharedLeadId === id) || leads.find((item) => item.id === id);
    if (!item) return send(404, { message: 'Lead not found.' });
    if (purchased.has(id)) return send(409, { message: 'Lead already purchased.' });
    purchased.add(id);
    return send(200, { success: true, message: 'Lead purchased successfully.', data: { ...(item.sharedLeadId ? { sharedLeadId: id } : {}), leadId: item.leadId || item.id, isPurchased: true } });
  }
  if (req.method !== 'GET') return send(501, { message: 'Endpoint not modeled.' });
  if (url.pathname === '/api/v1/vendor/leads/shared') {
    const page = Number(url.searchParams.get('page') || 1), limit = Number(url.searchParams.get('limit') || 20);
    const items = shared.filter(matchesSearch);
    return send(200, { success: true, data: { sharedLeads: items.slice((page - 1) * limit, page * limit).map((item) => ({ ...item, isPurchased: purchased.has(item.sharedLeadId) })), pagination: { page, limit, total: items.length, hasNextPage: page * limit < items.length } } });
  }
  if (url.pathname === '/api/v1/vendor/leads') {
    const page = Number(url.searchParams.get('page') || 1), limit = Number(url.searchParams.get('limit') || 20);
    const items = leads.filter(matchesSearch).map((item) => ({ ...item, isPurchased: purchased.has(item.id) }));
    return send(200, { success: true, data: { leads: items.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: items.length, hasNextPage: page * limit < items.length } } });
  }
  const id = decodeURIComponent(url.pathname.slice('/api/v1/vendor/leads/'.length));
  const sharedOrigin = shared.find((item) => item.leadId === id);
  if (sharedOrigin) return purchased.has(sharedOrigin.sharedLeadId)
    ? send(200, { success: true, data: { lead: { ...sharedOrigin.lead, customerPhone: '9876543210', customerEmail: 'shared@example.com', message: 'Please share venue details.' } } })
    : send(403, { message: 'Full lead details are restricted.' });
  if (id === 'unavailable') return send(503, { success: false, message: 'Lead details are temporarily unavailable.' });
  if (id === 'invalid') return send(200, { success: true, data: {} });
  if (id === 'rejected') return send(200, { success: false, message: 'Lead access denied.' });
  const lead = leads.find((item) => item.id === id);
  return lead ? send(200, { success: true, data: { lead: { ...lead, isPurchased: purchased.has(lead.id) } } }) : send(404, { success: false, message: 'Lead not found.' });
}).listen(process.env.PORT || 4506);
