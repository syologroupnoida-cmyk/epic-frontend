// User-supplied endpoints and PATCH fields. All records and response envelopes are synthetic.
const http = require('http');
const businesses = Array.from({ length: 25 }, (_, i) => ({
  id: i ? `business-${i + 1}` : 'business & one', businessName: `Imported Business ${i + 1}`,
  city: 'Noida', state: 'Uttar Pradesh', category: 'Wedding planner',
  email: 'business@example.test', phone: '9876543210', website: 'https://example.test',
  status: 'NEW', salesNote: '', rating: '4.7', reviewCount: 0, createdAt: '2026-11-06T08:00:00Z',
}));
const batches = Array.from({ length: 23 }, (_, i) => ({ id: `batch-${i + 1}`, fileName: `import-${i + 1}.csv`, city: 'Noida', status: 'COMPLETED', totalRecords: 25, importedCount: 25, failedCount: 0, createdAt: '2026-11-06T08:00:00Z' }));
http.createServer(async (req, res) => {
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  const url = new URL(req.url, 'http://localhost');
  const matchesSearch = (row) => !url.searchParams.has('search') || JSON.stringify(row).toLowerCase().includes(url.searchParams.get('search').toLowerCase());
  if (url.searchParams.has('search') && !url.searchParams.get('search').trim()) return send(400, { message: 'Empty search must be omitted.' });
  if (req.headers.authorization !== 'Bearer imported-admin-test-token') return send(401, { message: 'Unauthorized.' });
  const list = (records, key) => {
    const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) return send(400, { message: 'Invalid pagination.' });
    return send(200, { success: true, data: { [key]: records.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: records.length, hasNextPage: page * limit < records.length } } });
  };
  if (req.method === 'GET' && url.pathname === '/api/v1/admin/business-import-batches') {
    if (url.searchParams.has('status')) return send(400, { message: 'Unexpected batch status filter.' });
    return list(batches.filter(matchesSearch), 'batches');
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/admin/imported-businesses') {
    const status = url.searchParams.get('status');
    if (status === 'UNAVAILABLE') return send(503, { message: 'Business service unavailable.' });
    if (status === 'INVALID') return send(200, { success: true, data: {} });
    if (url.searchParams.has('status') && !status) return send(400, { message: 'Empty status must be omitted.' });
    return list(businesses.filter((row) => !status || row.status === status).filter(matchesSearch), 'businesses');
  }
  const match = /^\/api\/v1\/admin\/imported-businesses\/([^/]+)$/.exec(url.pathname);
  if (!match) return send(501, { message: 'Endpoint not modeled.' });
  const id = decodeURIComponent(match[1]);
  if (id === 'denied') return send(403, { message: 'Access denied.' });
  if (id === 'unavailable') return send(503, { message: 'Business service unavailable.' });
  if (id === 'rejected') return send(200, { success: false, message: 'Update rejected.' });
  if (id === 'invalid') return send(200, { success: true, data: null });
  const business = businesses.find((row) => row.id === id);
  if (!business) return send(404, { message: 'Business not found.' });
  if (req.method === 'GET') return send(200, { success: true, data: { business } });
  if (req.method !== 'PATCH') return send(501, { message: 'Endpoint not modeled.' });
  try {
    let payload = req.body;
    if (payload == null) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      payload = JSON.parse(Buffer.concat(chunks).toString());
    } else if (typeof payload === 'string') payload = JSON.parse(payload);
    if (Object.keys(payload).sort().join(',') !== 'salesNote,status' || !['NEW', 'CONTACTED'].includes(payload.status) || typeof payload.salesNote !== 'string') return send(400, { message: 'Invalid update payload.' });
    Object.assign(business, payload, { updatedAt: new Date().toISOString() });
    return send(200, { success: true, message: 'Business updated successfully.', data: business });
  } catch { return send(400, { message: 'Invalid JSON.' }); }
}).listen(process.env.PORT || 4512);
