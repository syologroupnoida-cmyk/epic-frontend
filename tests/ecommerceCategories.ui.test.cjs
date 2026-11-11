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
const unused = { __esModule: true, default: () => null };

function load(relative) {
  let filename = path.resolve(root, relative);
  if (filename.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
  if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map((ext) => filename + ext).find(fs.existsSync);
  if (cache.has(filename)) return cache.get(filename).exports;
  const componentModule = new Module(filename);
  cache.set(filename, componentModule);
  componentModule.filename = filename;
  componentModule.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = componentModule.require.bind(componentModule);
  componentModule.require = (id) => {
    if (id === 'next/router') return { useRouter: () => ({ pathname: '/superadmin/[panel]', push() {}, replace() {} }) };
    if (id === '@/util/MainApi') return { __esModule: true, default: { get: () => assert.fail('SSR must not fetch categories'), post: () => assert.fail('SSR must not create categories') } };
    if (id.startsWith('@/components/superadmin/') || id === '@/components/dashboard/WeddingAdminOverview' || id === '@/components/vendor/BusinessPasswordUpdate') return unused;
    if (id === 'next/server') return { NextResponse: { next: () => ({ allowed: true }), redirect: (url) => ({ redirect: String(url) }) } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
    return original(id);
  };
  let source = fs.readFileSync(filename, 'utf8');
  if (filename.endsWith('.jsx')) source = require('@babel/core').transformSync(source, { filename, configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] }, plugins: ['babel-plugin-react-compiler'] }).code;
  componentModule._compile(swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
  return componentModule.exports;
}

test('shop workspace has its own sidebar and returns to the super-admin dashboard', () => {
  const Dashboard = load('src/components/dashboard/SuperAdminDashboard.jsx').default;
  for (const initialPanelSlug of ['shop-management', 'shop-add-category', 'shop-categories', 'shop-add-subcategory', 'shop-subcategories']) {
    const html = renderToStaticMarkup(React.createElement(Dashboard, { initialPanelSlug }));
    assert.ok(html.includes('Shop dashboard navigation'));
    assert.ok(html.includes('Shop Dashboard'));
    assert.ok(html.includes('Add Category'));
    assert.ok(html.includes('Category List'));
    assert.ok(html.includes('href="/superadmin/dashboard"'));
    assert.ok(html.includes('Super-admin Dashboard'));
    assert.ok(!html.includes('Vendor Kyc List'));
    assert.ok(!html.includes('Contact Enquiries'));
  }
  const admin = renderToStaticMarkup(React.createElement(Dashboard, { initialPanelSlug: 'overview' }));
  assert.ok(admin.includes('Super-admin navigation'));
  assert.ok(admin.includes('href="/dashboard/shop"'));
});

test('category form and list render matching admin controls without fetching on the server', () => {
  const Form = load('src/modules/ecommerce/management/categories/EcommerceCategoryForm.jsx').default;
  const List = load('src/modules/ecommerce/management/categories/EcommerceCategoryList.jsx').default;
  const form = renderToStaticMarkup(React.createElement(Form));
  for (const field of ['name', 'description', 'sortOrder']) assert.ok(form.includes(`name="${field}"`));
  assert.ok(form.includes('Create category'));
  assert.ok(form.includes('href="/categories"'));
  const list = renderToStaticMarkup(React.createElement(List));
  assert.ok(list.includes('Loading categories...'));
  assert.ok(list.includes('aria-label="Shop categories"'));
  assert.ok(list.includes('Search categories on this page'));
  assert.ok(!list.includes('>Refresh<'));
  assert.ok(!list.includes('href="/add-category"'));
});

test('shop category routes require an admin session', () => {
  const { proxy } = load('src/proxy.js');
  for (const pathname of ['/dashboard/shop', '/add-category', '/categories', '/add-subcategory', '/subcategories', '/products', '/orders', '/dashboard/shop/add-subcategory']) {
    const request = (role) => ({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
    assert.equal(proxy(request('SUPER_ADMIN')).allowed, true);
    assert.equal(proxy(request('ADMIN')).allowed, true);
    assert.ok(proxy(request('VENDOR')).redirect.includes('/superadmin/login'));
    assert.ok(proxy(request('CLIENT')).redirect.includes('/superadmin/login'));
    assert.ok(proxy({ ...request('ADMIN'), cookies: { get: () => undefined } }).redirect.includes('/superadmin/login'));
  }
});

test('old nested shop pages redirect to their root-level routes', () => {
  const { getServerSideProps } = load('src/pages/dashboard/shop/[[...panel]].js');
  for (const segment of ['add-category', 'categories', 'add-subcategory', 'subcategories', 'products', 'orders']) {
    assert.deepEqual(getServerSideProps({ params: { panel: [segment] } }), { redirect: { destination: `/${segment}`, permanent: false } });
  }
  assert.deepEqual(getServerSideProps({ params: {} }), { props: { initialPanelSlug: 'shop-management' } });
  assert.deepEqual(getServerSideProps({ params: { panel: ['unknown'] } }), { notFound: true });
});

test('table error state renders its icon above the message and subcategory controls render safely', () => {
  const State = load('src/modules/ecommerce/management/ShopTableState.jsx').default;
  const error = renderToStaticMarkup(React.createElement(State, { title: 'Categories could not be loaded.', error: 'Service unavailable.', onRetry() {} }));
  assert.ok(error.indexOf('<svg') < error.indexOf('Categories could not be loaded.'));
  assert.ok(error.includes('Try again'));
  const Form = load('src/modules/ecommerce/management/subcategories/EcommerceSubcategoryForm.jsx').default;
  const List = load('src/modules/ecommerce/management/subcategories/EcommerceSubcategoryList.jsx').default;
  const form = renderToStaticMarkup(React.createElement(Form));
  assert.ok(form.includes('Add Subcategory'));
  assert.ok(form.includes('Parent category'));
  assert.ok(form.includes('Add specification field'));
  assert.ok(form.includes('Specification template'));
  assert.ok(form.includes('Dropdown options'));
  assert.ok(form.includes('Field 1 option 1'));
  assert.ok(form.includes('Field 1 option 2'));
  assert.ok(form.includes('name="specificationTemplate.fields[0].key"'));
  assert.ok(form.includes('name="specificationTemplate.fields[0].label"'));
  assert.ok(form.includes('name="specificationTemplate.fields[0].required"'));
  assert.ok(form.includes('Add option'));
  const list = renderToStaticMarkup(React.createElement(List));
  assert.ok(list.includes('All categories'));
  assert.ok(list.includes('Search subcategories'));
  assert.ok(list.includes('Loading subcategories...'));
});

test('shop tables place search and filters in a separate toolbar below the main heading', () => {
  const components = [
    ['src/modules/ecommerce/management/categories/EcommerceCategoryList.jsx', 'Category List'],
    ['src/modules/ecommerce/management/subcategories/EcommerceSubcategoryList.jsx', 'Subcategory List'],
    ['src/modules/ecommerce/management/ShopProductList.jsx', 'Products'],
  ];
  for (const [file, title] of components) {
    const Table = load(file).default;
    const html = renderToStaticMarkup(React.createElement(Table));
    const headingEnd = html.indexOf('</h1>');
    const toolbar = html.indexOf('data-shop-table-toolbar="true"');
    const search = html.indexOf('type="search"');
    assert.ok(html.includes(title));
    assert.ok(headingEnd >= 0 && toolbar > headingEnd && search > toolbar, title);
    assert.ok(html.slice(headingEnd, toolbar).includes('</div>'), title);
  }
});
