const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  let filename = path.resolve(root, relative);
  if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map((ext) => filename + ext).find(fs.existsSync);
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiledModule = new Module(filename);
  cache.set(filename, compiledModule);
  compiledModule.filename = filename;
  compiledModule.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = compiledModule.require.bind(compiledModule);
  compiledModule.require = (id) => {
    if (id === '@/util/MainApi') return { __esModule: true, default: { get: () => assert.fail('Server rendering must not fetch private data') } };
    if (id === 'next/server') return { NextResponse: { next: () => ({ allowed: true }), redirect: (url) => ({ redirect: String(url) }) } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
    return original(id);
  };
  const source = fs.readFileSync(filename, 'utf8');
  compiledModule._compile(swc.transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
  return compiledModule.exports;
}

test('business and batch entry points render the intended loading table and filters', () => {
  const { default: VendorBusinesses, BusinessImportBatches } = load('src/components/superadmin/VendorBusinesses.jsx');
  const businesses = renderToStaticMarkup(React.createElement(VendorBusinesses));
  assert.ok(businesses.includes('aria-label="Imported vendor businesses"'));
  assert.ok(businesses.includes('Website / Contact'));
  assert.ok(businesses.includes('Loading businesses...'));
  assert.ok(businesses.includes('aria-label="Search businesses"'));
  const batches = renderToStaticMarkup(React.createElement(BusinessImportBatches));
  assert.ok(batches.includes('aria-label="Business import batches"'));
  assert.ok(batches.includes('Loading import batches...'));
  assert.ok(batches.includes('aria-label="Search import batches"'));
  assert.ok(!batches.includes('aria-label="Imported vendor businesses"'));
});

test('both admin routes retain existing admin-only access checks', () => {
  const { proxy } = load('src/proxy.js');
  for (const panel of ['vendor-businesses', 'business-import-batches']) {
    const pathname = `/superadmin/${panel}`;
    const request = (role) => ({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
    assert.equal(proxy(request('SUPER_ADMIN')).allowed, true);
    assert.equal(proxy(request('ADMIN')).allowed, true);
    assert.ok(proxy(request('VENDOR')).redirect.includes('/superadmin/login'));
  }
});
