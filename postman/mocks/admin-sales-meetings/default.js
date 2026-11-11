// User-supplied paths and decision payloads. Records and envelopes are synthetic.
const http = require('http');
const meetings = Array.from({ length: 25 }, (_, i) => ({
  id: i ? `sales-${i + 1}` : 'sales & one', status: 'PENDING',
  requestedStartAt: '2027-02-10T10:00:00+05:30', requestedEndAt: '2027-02-10T10:30:00+05:30',
  vendorNote: 'Please explain subscription plans and lead pricing.',
  vendor: { businessName: `Vendor ${i + 1}`, email: 'vendor@example.test' },
  vendorMessage: '', adminNote: '', createdAt: '2026-11-06T09:00:00Z',
}));
http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const url = new URL(req.url, 'http://localhost');
  if (req.headers.authorization !== 'Bearer admin-sales-meeting-test-token') return send(401, { message: 'Unauthorized.' });
  if (url.pathname === '/api/v1/admin/sales-meetings' && req.method === 'GET') {
    const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
    const status = url.searchParams.get('status');
    if (status === 'INVALID') return send(200, { success: true, data: {} });
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || (url.searchParams.has('status') && !status)) return send(400, { message: 'Invalid list query.' });
    const filtered = meetings.filter((row) => !status || row.status === status);
    return send(200, { success: true, data: { salesMeetings: filtered.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: filtered.length, hasNextPage: page * limit < filtered.length } } });
  }
  const match = /^\/api\/v1\/admin\/sales-meetings\/([^/]+)$/.exec(url.pathname);
  if (!match) return send(501, { message: 'Endpoint not modeled.' });
  const id = decodeURIComponent(match[1]);
  if (id === 'denied') return send(403, { message: 'Access denied.' });
  if (id === 'unavailable') return send(503, { message: 'Sales meeting service unavailable.' });
  if (id === 'invalid') return send(200, { success: true, data: null });
  const meeting = meetings.find((row) => row.id === id);
  if (!meeting) return send(404, { message: 'Sales meeting not found.' });
  if (req.method === 'GET') return send(200, { success: true, data: { salesMeeting: meeting } });
  if (req.method !== 'PATCH') return send(501, { message: 'Endpoint not modeled.' });
  try {
    let body = req.body;
    if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString()); }
    else if (typeof body === 'string') body = JSON.parse(body);
    const expectedKeys = body.status === 'CONFIRMED' ? 'adminNote,scheduledEndAt,scheduledStartAt,status,vendorMessage' : 'adminNote,status,vendorMessage';
    if (Object.keys(body).sort().join(',') !== expectedKeys || !['CONFIRMED', 'REJECTED'].includes(body.status) || typeof body.adminNote !== 'string' || typeof body.vendorMessage !== 'string') return send(400, { message: 'Invalid decision payload.' });
    if (body.status === 'CONFIRMED' && (!body.scheduledStartAt?.endsWith('+05:30') || !body.scheduledEndAt?.endsWith('+05:30') || !(Date.parse(body.scheduledEndAt) > Date.parse(body.scheduledStartAt)))) return send(400, { message: 'Invalid scheduled range.' });
    if (body.vendorMessage === 'conflict') return send(409, { message: 'The meeting has changed. Please reload.' });
    if (body.vendorMessage === 'unavailable') return send(503, { message: 'Sales meeting service unavailable.' });
    if (body.vendorMessage === 'rejected') return send(200, { success: false, message: 'Update rejected.' });
    Object.assign(meeting, body, { updatedAt: new Date().toISOString() });
    return send(200, { success: true, message: body.status === 'CONFIRMED' ? 'Sales meeting confirmed.' : 'Sales meeting rejected.', data: meeting });
  } catch { return send(400, { message: 'Invalid JSON.' }); }
}).listen(process.env.PORT || 4516);
