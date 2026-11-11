// Paths and payloads are user supplied. Responses and sample data are synthetic.
const http = require('http');
const messages = Array.from({ length: 25 }, (_, index) => ({ id: index ? `message-${index + 1}` : 'message & one', name: `Contact ${index + 1}`, email: 'contact@example.test', phone: '9876543210', userType: 'CLIENT', subject: 'Wedding planning enquiry', message: 'Please help with vendor selection.', website: '', status: index % 2 ? 'IN_PROGRESS' : 'NEW', adminNote: '', createdAt: '2026-10-30T08:00:00Z' }));
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  if (req.method === 'OPTIONS') return send(200, {});
  try {
    const url = new URL(req.url, 'http://localhost');
    const body = async () => { if (req.body) return req.body; let text = ''; for await (const chunk of req) text += chunk; return JSON.parse(text); };
    if (req.method === 'POST' && url.pathname === '/api/v1/contact-us') {
      const payload = await body();
      if (Object.keys(payload).sort().join(',') !== 'email,message,name,phone,subject,userType,website' || !['name', 'email', 'phone', 'userType', 'subject', 'message'].every((field) => typeof payload[field] === 'string' && payload[field].trim()) || payload.website !== '') return send(400, { success: false, message: 'Invalid contact payload.' });
      if (payload.subject === 'simulate-failure') return send(503, { success: false, message: 'Contact service unavailable.' });
      const message = { ...payload, id: `submitted-${messages.length}`, status: 'NEW', adminNote: '', createdAt: new Date().toISOString() };
      messages.push(message);
      return send(201, { success: true, message: 'Enquiry submitted successfully.', data: message });
    }
    if (!url.pathname.startsWith('/api/v1/admin/contact-messages')) return send(501, { message: 'Endpoint not modeled.' });
    if (req.headers.authorization !== 'Bearer contact-admin-token') return send(401, { message: 'Unauthorized.' });
    if (url.pathname === '/api/v1/admin/contact-messages' && req.method === 'GET') {
      const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
      if (page < 1 || limit < 1 || (url.searchParams.has('status') && !url.searchParams.get('status'))) return send(400, { message: 'Invalid filters.' });
      const filtered = messages.filter((message) => !url.searchParams.has('status') || message.status === url.searchParams.get('status'));
      return send(200, { success: true, data: { contactMessages: filtered.slice((page - 1) * limit, page * limit), pagination: { total: filtered.length, hasNextPage: page * limit < filtered.length } } });
    }
    const match = /^\/api\/v1\/admin\/contact-messages\/([^/]+)$/.exec(url.pathname);
    if (!match) return send(404, { message: 'Not found.' });
    const id = decodeURIComponent(match[1]);
    if (id === 'unavailable') return send(503, { message: 'Message service unavailable.' });
    if (id === 'denied') return send(200, { success: false, message: 'Message update denied.' });
    const message = messages.find((item) => item.id === id);
    if (!message) return send(404, { message: 'Message not found.' });
    if (req.method === 'GET') return send(200, { success: true, data: { contactMessage: message } });
    if (req.method !== 'PATCH') return send(405, { message: 'Method not allowed.' });
    const payload = await body();
    if (Object.keys(payload).sort().join(',') !== 'adminNote,status' || !['NEW', 'IN_PROGRESS'].includes(payload.status) || typeof payload.adminNote !== 'string') return send(400, { message: 'Invalid update payload.' });
    Object.assign(message, payload, { updatedAt: new Date().toISOString() });
    return send(200, { success: true, message: 'Contact message updated successfully.', data: message });
  } catch { return send(400, { message: 'Invalid JSON.' }); }
}).listen(process.env.PORT || 4510);
