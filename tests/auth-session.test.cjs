const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
if (process.env.AUTH_SIMULATION_URL) process.env.NEXT_PUBLIC_API_BASE_URL = process.env.AUTH_SIMULATION_URL;
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = new Module(filename); cache.set(filename, module);
  module.filename = filename; module.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = module.require.bind(module);
  module.require = (id) => {
    if (id === 'next/server') return { NextResponse: { next: () => ({ next: true }), redirect: url => ({ redirect: String(url) }) } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}${path.extname(id) ? '' : '.js'}`);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
    return original(id);
  };
  module._compile(swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript' } }, module: { type: 'commonjs' } }).code, filename);
  return module.exports;
}
const auth = load('src/util/authSession.js');
const originalWindow = global.window;
const originalDocument = global.document;
after(() => { if (originalWindow === undefined) delete global.window; else global.window = originalWindow; if (originalDocument === undefined) delete global.document; else global.document = originalDocument; });
function browser() {
  const storage = new Map(); const cookies = new Map();
  global.window = { location: { href: 'http://localhost:3001/kyc' }, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }, dispatchEvent() {} };
  global.document = {};
  Object.defineProperty(global.document, 'cookie', { get: () => [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), set: value => { const pair = value.split(';')[0]; const index = pair.indexOf('='); const key = pair.slice(0, index); if (value.includes('max-age=0')) cookies.delete(key); else cookies.set(key, pair.slice(index + 1)); } });
  return { storage, cookies };
}
test('cookie-only sessions attach usable tokens across frontend ports', () => {
  const { storage, cookies } = browser();
  cookies.set('epic_access_token', encodeURIComponent('Bearer cookie-access'));
  cookies.set('epic_refresh_token', 'valid-refresh');
  assert.equal(auth.getAccessToken(), 'cookie-access'); assert.equal(auth.getRefreshToken(), 'valid-refresh');
  storage.set('epic_access_token', 'stale-access');
  assert.equal(auth.getAccessToken(), 'cookie-access');
  window.localStorage.getItem = () => { throw new Error('Storage unavailable'); };
  assert.equal(auth.getAccessToken(), 'cookie-access');
});
test('malformed storage values are rejected and bearer prefixes are normalized', () => {
  const { storage } = browser();
  for (const value of ['undefined', 'null', 'Bearer', '[object Object]', 'bad token', '{}']) { storage.set('epic_access_token', value); assert.equal(auth.getAccessToken(), '', value); }
  storage.set('epic_access_token', JSON.stringify({ accessToken: 'Bearer Bearer local-access' }));
  assert.equal(auth.getAccessToken(), 'local-access');
  assert.throws(() => auth.setAuthTokens({ accessToken: 'undefined' }), /valid access token/);
});
test('KYC routes require a vendor session and preserve the intended destination', () => {
  const { proxy } = load('src/proxy.js');
  for (const role of ['', 'CLIENT', 'ADMIN', 'VENDOR']) {
    const result = proxy({ url: 'http://localhost/kyc?steps=company-details', nextUrl: { pathname: '/kyc', search: '?steps=company-details' }, cookies: { get: key => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
    assert.equal(Boolean(result.next), role === 'VENDOR');
    if (role !== 'VENDOR') assert.equal(new URL(result.redirect).searchParams.get('next'), '/kyc?steps=company-details');
  }
});
test('real HTTP uses cookie tokens and shares one refresh for concurrent expired requests', { skip: !process.env.AUTH_SIMULATION_URL }, async () => {
  const { cookies } = browser(); const api = load('src/util/MainApi.js').default;
  cookies.set('epic_access_token', 'cookie-access'); cookies.set('epic_refresh_token', 'valid-refresh');
  assert.equal((await api.get('/vendor/kyc')).data.data.authenticated, true);
  await fetch(`${process.env.AUTH_SIMULATION_URL}/test/reset`);
  auth.setAuthTokens({ accessToken: 'expired-access', refreshToken: 'valid-refresh' });
  const responses = await Promise.all([api.get('/vendor/kyc'), api.get('/vendor/profile')]);
  assert(responses.every(response => response.data.data.authenticated));
  assert.equal((await (await fetch(`${process.env.AUTH_SIMULATION_URL}/test/stats`)).json()).refreshes, 1);
  assert.equal(auth.getAccessToken(), 'fresh-access');
  await assert.rejects(api.post('/auth/login', { email: 'synthetic@example.com', password: 'invalid' }), error => error.response.status === 401);
  assert.equal((await (await fetch(`${process.env.AUTH_SIMULATION_URL}/test/stats`)).json()).refreshes, 1);
  auth.setAuthTokens({ accessToken: 'expired-access', refreshToken: 'invalid-refresh' });
  await assert.rejects(api.get('/vendor/kyc'), error => error.response.status === 401);
  assert.equal(auth.getAccessToken(), ''); assert.equal(auth.getRefreshToken(), '');
});
