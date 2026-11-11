// Endpoints and create fields come from the user. All responses are synthetic.
const http = require('http');
const meetings = Array.from({ length: 25 }, (_, i) => ({
  id: i ? `meeting-${i + 1}` : 'meeting & one', status: i ? 'REQUESTED' : 'SCHEDULED',
  requestedStartAt: '2027-02-10T10:00:00+05:30', requestedEndAt: '2027-02-10T10:30:00+05:30',
  vendorNote: 'Please explain subscription plans and lead pricing.', createdAt: '2026-11-06T09:00:00Z',
  ...(i ? {} : { meetingUrl: 'https://meet.example.test/sales-1' }),
}));
http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const url = new URL(req.url, 'http://localhost');
  if (req.headers.authorization !== 'Bearer vendor-meeting-test-token') return send(401, { message: 'Unauthorized.' });
  if (url.pathname === '/api/v1/vendor/sales-meetings') {
    if (req.method === 'GET') {
      const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) return send(400, { message: 'Invalid pagination.' });
      return send(200, { success: true, data: { salesMeetings: meetings.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: meetings.length, hasNextPage: page * limit < meetings.length } } });
    }
    if (req.method === 'POST') {
      try {
        let body = req.body;
        if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString()); }
        else if (typeof body === 'string') body = JSON.parse(body);
        if (Object.keys(body).sort().join(',') !== 'requestedEndAt,requestedStartAt,vendorNote' || typeof body.vendorNote !== 'string' || !body.requestedStartAt?.endsWith('+05:30') || !body.requestedEndAt?.endsWith('+05:30') || !(Date.parse(body.requestedEndAt) > Date.parse(body.requestedStartAt))) return send(400, { message: 'Invalid meeting payload.' });
        if (body.vendorNote === 'unavailable') return send(503, { message: 'Meeting service unavailable.' });
        if (body.vendorNote === 'conflict') return send(409, { message: 'The requested slot is unavailable.' });
        if (body.vendorNote === 'rejected') return send(200, { success: false, message: 'Meeting request rejected.' });
        const meeting = { id: `meeting-${meetings.length + 1}`, status: 'REQUESTED', ...body, createdAt: new Date().toISOString() };
        meetings.unshift(meeting);
        return send(201, { success: true, message: 'Your meeting request has been sent.', data: { salesMeeting: meeting } });
      } catch { return send(400, { message: 'Invalid JSON.' }); }
    }
  }
  const match = /^\/api\/v1\/vendor\/sales-meetings\/([^/]+)$/.exec(url.pathname);
  if (match && req.method === 'GET') {
    const id = decodeURIComponent(match[1]);
    if (id === 'unavailable') return send(503, { message: 'Meeting service unavailable.' });
    if (id === 'denied') return send(403, { message: 'Access denied.' });
    if (id === 'invalid') return send(200, { success: true, data: null });
    const meeting = meetings.find((item) => item.id === id);
    return meeting ? send(200, { success: true, data: { salesMeeting: meeting } }) : send(404, { message: 'Meeting not found.' });
  }
  return send(501, { message: 'Endpoint not modeled.' });
}).listen(process.env.PORT || 4514);
