const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '..');
const cache = new Map();
let session = null;

function load(relative) {
  let filename = path.resolve(root, relative);
  if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map((ext) => filename + ext).find(fs.existsSync);
  if (cache.has(filename)) return cache.get(filename).exports;
  const componentModule = new Module(filename);
  cache.set(filename, componentModule);
  componentModule.filename = filename;
  componentModule.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = componentModule.require.bind(componentModule);
  componentModule.require = (id) => {
    // Exercise client snapshots without depending on a browser or live sessions.
    if (id === 'react') return { ...React, useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() };
    if (id === '@/util/authSession') return { getAccessToken: () => session ? 'synthetic-token' : null, getAuthUser: () => session };
    if (id === '@/util/useAuthLogout') return { __esModule: true, default: () => ({ handleLogout() {}, logoutFeedback: null }) };
    if (id === '@/util/MainApi') return { __esModule: true, default: { get: () => assert.fail('Rendering must not fetch a profile') } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
    return original(id);
  };
  let source = fs.readFileSync(filename, 'utf8');
  if (filename.endsWith('.jsx')) source = require('@babel/core').transformSync(source, { filename, configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] }, plugins: ['babel-plugin-react-compiler'] }).code;
  componentModule._compile(swc.transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
  return componentModule.exports;
}

test('partner guests see login and registration actions', () => {
  session = null;
  const Menu = load('src/components/common/HeaderAccountMenu.jsx').default;
  const fallback = React.createElement('div', { 'data-guest-actions': true }, React.createElement('a', { href: '/partner/login' }, 'Login'), React.createElement('a', { href: '/partner/sign-up' }, 'Register as a Partner'));
  const html = renderToStaticMarkup(React.createElement(Menu, { variant: 'partner', guestFallback: fallback }));
  assert.ok(html.includes('data-guest-actions'));
  assert.ok(html.includes('Register as a Partner'));
  assert.ok(!html.includes('Open account menu'));
});

test('signed-in roles replace guest actions with a profile and their correct dashboard', () => {
  const Menu = load('src/components/common/HeaderAccountMenu.jsx').default;
  for (const [role, dashboard] of [['VENDOR', '/partner/dashboard'], ['AGENT', '/partner/dashboard'], ['CLIENT', '/user/dashboard'], ['ADMIN', '/superadmin/dashboard'], ['SUPER_ADMIN', '/superadmin/dashboard']]) {
    session = { role, name: 'Test Member', email: 'member@example.test' };
    const html = renderToStaticMarkup(React.createElement(Menu, { variant: 'partner', guestFallback: React.createElement('span', null, 'Guest registration') }));
    assert.ok(html.includes('Open account menu'), role);
    assert.ok(html.includes('aria-expanded="false"'), role);
    assert.ok(html.includes(`href="${dashboard}"`), role);
    assert.ok(html.includes('Logout'), role);
    assert.ok(!html.includes('Guest registration'), role);
    assert.ok(!html.includes('/partner/sign-up'), role);
    assert.equal(html.includes('Update Profile'), role === 'VENDOR' || role === 'AGENT');
  }
  session = null;
});
