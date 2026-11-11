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
  if (filename.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
  if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map((ext) => filename + ext).find(fs.existsSync);
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiledModule = new Module(filename);
  cache.set(filename, compiledModule);
  compiledModule.filename = filename;
  compiledModule.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = compiledModule.require.bind(compiledModule);
  compiledModule.require = (id) => {
    if (id === '@/util/MainApi') return { __esModule: true, default: { get: () => assert.fail('Server rendering must not fetch meetings') } };
    if (id === 'next/server') return { NextResponse: { next: () => ({ allowed: true }), redirect: (url) => ({ redirect: String(url) }) } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
    return original(id);
  };
  let source = fs.readFileSync(filename, 'utf8');
  if (filename.endsWith('.jsx')) source = require('@babel/core').transformSync(source, { filename, configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] }, plugins: ['babel-plugin-react-compiler'] }).code;
  compiledModule._compile(swc.transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
  return compiledModule.exports;
}

test('compiled header button, calendar form and list render without fetching private data', () => {
  const Button = load('src/components/vendor/meetings/MeetingHeaderButton.jsx').default;
  const Form = load('src/components/vendor/meetings/ScheduleMeetingForm.jsx').default;
  const List = load('src/components/vendor/meetings/MeetingList.jsx').default;
  const button = renderToStaticMarkup(React.createElement(Button));
  assert.ok(button.includes('aria-label="Schedule a video meeting"'));
  assert.ok(button.includes('aria-haspopup="dialog"'));
  const form = renderToStaticMarkup(React.createElement(Form, { onSuccess: () => {}, onCancel: () => {} }));
  assert.ok(form.includes('name="startTime"'));
  assert.ok(form.includes('name="endTime"'));
  assert.ok(!form.includes('Choose your preferred date and time range.'));
  assert.equal((form.match(/aria-labelledby="meeting-date-range-label"/g) || []).length, 1);
  assert.ok(form.includes('Start date'));
  assert.ok(form.includes('End date'));
  assert.ok(!form.includes('Select your date range'));
  assert.ok(!form.includes('India Standard Time'));
  assert.ok(form.includes('Meeting note'));
  const list = renderToStaticMarkup(React.createElement(List));
  assert.ok(list.includes('aria-label="Vendor sales meetings"'));
  assert.ok(list.includes('Loading meetings...'));
  assert.ok(list.includes('aria-label="Search meetings on this page"'));
});

test('meeting search matches vendor, note, status and formatted dates without exposing admin notes', () => {
  const { filterMeetingRows } = load('src/util/vendorMeetings.mjs');
  const rows = [{ status: 'CONFIRMED', vendor: { businessName: 'Digital Studio' }, vendorNote: 'Discuss pricing', scheduledStartAt: '2027-02-10T10:00:00+05:30', adminNote: 'Private assignment' }, { status: 'PENDING', vendorNote: 'Discuss plans' }];
  assert.deepEqual(filterMeetingRows(rows, 'digital confirmed'), [rows[0]]);
  assert.deepEqual(filterMeetingRows(rows, '10 Feb 2027'), [rows[0]]);
  assert.deepEqual(filterMeetingRows(rows, 'pending plans'), [rows[1]]);
  assert.deepEqual(filterMeetingRows(rows, 'Private assignment'), []);
  assert.equal(filterMeetingRows(rows, '  '), rows);
});

test('only confirmed meetings with a safe meeting URL expose the video link in a new tab', () => {
  const JoinButton = load('src/components/vendor/meetings/MeetingJoinButton.jsx').default;
  const render = (meeting) => renderToStaticMarkup(React.createElement(JoinButton, { meeting }));
  const html = render({ status: 'CONFIRMED', meetingUrl: 'https://meet.google.com/cvd-owdh-huw' });
  assert.ok(html.includes('href="https://meet.google.com/cvd-owdh-huw"'));
  assert.ok(html.includes('target="_blank"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes('Join video meeting'));
  assert.equal(render({ status: 'PENDING', meetingUrl: 'https://meet.google.com/cvd-owdh-huw' }), '');
  assert.equal(render({ status: 'CONFIRMED' }), '');
  assert.equal(render({ status: 'CONFIRMED', meetingUrl: 'javascript:alert(1)' }), '');
});

test('meeting sidebar destination and route retain vendor protection', () => {
  const routes = load('src/util/agentDashboardRoutes.mjs');
  assert.equal(routes.agentPanelPath('Meeting List'), '/partner/meeting-list');
  assert.equal(routes.agentPanelFromSlug('meeting-list'), 'Meeting List');
  const { proxy } = load('src/proxy.js');
  const pathname = '/partner/meeting-list';
  const request = (role) => ({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
  assert.equal(proxy(request('VENDOR')).allowed, true);
  assert.ok(proxy(request('CLIENT')).redirect.includes('/partner/login'));
});

test('admin sales meeting panel renders its table and retains admin route protection', () => {
  const SalesMeetings = load('src/components/superadmin/SalesMeetings.jsx').default;
  const html = renderToStaticMarkup(React.createElement(SalesMeetings));
  assert.ok(html.includes('aria-label="Admin sales meetings"'));
  assert.ok(html.includes('Loading sales meetings...'));
  assert.ok(html.includes('All statuses'));
  assert.ok(html.includes('aria-label="Search meetings on this page"'));
  const { proxy } = load('src/proxy.js');
  const pathname = '/superadmin/sales-meetings';
  const request = (role) => ({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
  assert.equal(proxy(request('SUPER_ADMIN')).allowed, true);
  assert.equal(proxy(request('ADMIN')).allowed, true);
  assert.ok(proxy(request('VENDOR')).redirect.includes('/superadmin/login'));
});

test('partner hero calendar starts consistently and selected dates reach the existing scheduler', () => {
  const Calendar = load('src/components/templates/PartnerExpertCalendar.jsx').default;
  const Form = load('src/components/vendor/meetings/ScheduleMeetingForm.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Calendar));
  assert.ok(html.includes('Meet with our expert'));
  assert.ok(html.includes('Loading calendar...'));
  assert.ok(html.includes('Select a date to continue'));
  assert.ok(!html.includes('Business Name'));
  const day = '2099-12-10';
  const form = renderToStaticMarkup(React.createElement(Form, { initialDate: day, onSuccess() {}, onCancel() {} }));
  assert.ok(form.includes('10 Dec 2099'));
});
