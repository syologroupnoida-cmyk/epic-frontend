// Request fields come from the user-provided contract. Response examples are
// synthetic; no production leads or personal data are created by these tests.
const http = require('http');
http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET') {
    const options = url.pathname === '/api/v1/cities' ? [{ id: 'city-test', name: 'Test City', stateName: 'Test State' }]
      : url.pathname === '/api/v1/service-categories' ? [{ id: 'category-photo', name: 'Photography Services' }, { id: 'category-decor', name: 'Decoration Services' }]
      : url.pathname === '/api/v1/service-subcategories' ? (url.searchParams.get('serviceCategoryId') === 'category-photo' ? [{ id: 'service-photo', name: 'Wedding Photography' }] : [{ id: 'service-decor', name: 'Wedding Decoration' }]) : null;
    return options ? send(200, { success: true, data: { items: options, hasNextPage: false } }) : send(501, { message: 'Endpoint not modeled.' });
  }
  const match = /^\/api\/v1\/marketplace\/(vendors|listings|venue-properties)\/([^/]+)\/enquiries$/.exec(url.pathname);
  const quote = url.pathname === '/api/v1/marketplace/leads/get-quotes';
  if (req.method !== 'POST' || (!match && !quote)) return send(501, { message: 'Endpoint not modeled.' });
  let body = req.body;
  if (!body) { let raw = ''; for await (const chunk of req) raw += chunk; try { body = JSON.parse(raw); } catch { return send(400, { message: 'Invalid JSON.' }); } }
  if (quote) {
    const fields = ['customerName', 'customerPhone', 'customerEmail', 'cityId', 'serviceSubcategoryId', 'eventDate', 'guestCount', 'budgetMin', 'budgetMax', 'message'];
    if (Object.keys(body).length !== fields.length || fields.some((key) => !(key in body)) || !Number.isInteger(body.guestCount) || typeof body.budgetMin !== 'number' || typeof body.budgetMax !== 'number') return send(400, { message: 'Invalid quote payload.' });
    if (body.cityId === 'unavailable') return send(503, { success: false, message: 'Quote requests are temporarily unavailable.' });
    return send(201, { success: true, message: 'Your quote request has been submitted successfully.', data: { id: 'quote-test', received: body } });
  }
  const expected = ['customerName', 'customerPhone', 'eventDate', 'guestCount', 'message', ...(match[1] === 'vendors' ? ['customerEmail'] : [])];
  if (Object.keys(body).length !== expected.length || expected.some((key) => !(key in body)) || !Number.isInteger(body.guestCount)) return send(400, { message: 'Invalid enquiry payload.' });
  if (match[2] === 'unavailable') return send(503, { success: false, message: 'Vendor enquiries are temporarily unavailable.' });
  if (match[2] === 'rejected') return send(200, { success: false, message: 'This vendor is not accepting enquiries.' });
  if (match[2] === 'invalid-response') { res.writeHead(502, { 'Content-Type': 'text/html' }); return res.end('<h1>Upstream unavailable</h1>'); }
  if (match[2] === 'empty-success') { res.writeHead(204); return res.end(); }
  return send(201, { success: true, message: 'Your enquiry has been submitted successfully.', data: { [match[1] === 'vendors' ? 'vendorSlug' : match[1] === 'listings' ? 'listingSlug' : 'venuePropertySlug']: decodeURIComponent(match[2]), received: body } });
}).listen(process.env.PORT || 4505);
