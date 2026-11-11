// Synthetic tokens only. This tests client header and refresh behavior,
// not backend identity verification or JWT validity.
const http = require('http');
let refreshes = 0;
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (url.pathname === '/api/v1/test/reset') { refreshes = 0; return send(200, { success: true }); }
  if (url.pathname === '/api/v1/test/stats') return send(200, { refreshes });
  if (url.pathname === '/api/v1/auth/refresh' && req.method === 'POST') {
    refreshes++;
    let body = req.body;
    if (!body) { let raw = ''; for await (const chunk of req) raw += chunk; body = JSON.parse(raw || '{}'); }
    await new Promise(resolve => setTimeout(resolve, 100));
    if (body.refreshToken !== 'valid-refresh') return send(401, { message: 'Invalid refresh token.' });
    return send(200, { success: true, data: { accessToken: 'fresh-access', refreshToken: 'valid-refresh' } });
  }
  if (url.pathname === '/api/v1/auth/login') return send(401, { message: 'Invalid credentials.' });
  if (url.pathname === '/api/v1/auth/change-password' && req.method === 'POST') {
    if (!['Bearer cookie-access', 'Bearer fresh-access'].includes(req.headers.authorization)) return send(401, { message: 'Authentication token missing or malformed.' });
    let body = req.body;
    if (!body) { let raw = ''; for await (const chunk of req) raw += chunk; body = JSON.parse(raw || '{}'); }
    if (Object.keys(body).sort().join(',') !== 'currentPassword,newPassword') return send(400, { message: 'Unexpected password payload.' });
    if (body.currentPassword !== ' CurrentPassword123! ') return send(400, { message: 'Current password is incorrect.' });
    if (body.newPassword !== ' NewPassword456! ') return send(400, { message: 'New password did not preserve its value.' });
    return send(200, { success: true, message: 'Password updated successfully.' });
  }
  if (['/api/v1/vendor/kyc', '/api/v1/vendor/profile'].includes(url.pathname)) {
    if (!['Bearer cookie-access', 'Bearer fresh-access'].includes(req.headers.authorization)) return send(401, { message: 'Authentication token missing or malformed.' });
    return send(200, { success: true, data: { authenticated: true } });
  }
  return send(501, { message: 'Endpoint not modeled.' });
}).listen(process.env.PORT || 4501);
