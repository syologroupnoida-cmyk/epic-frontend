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
let mainApiOverride = null;
const mainApi = { get: (...args) => mainApiOverride ? mainApiOverride.get(...args) : assert.fail('SSR must not fetch account data'), post: (...args) => mainApiOverride ? mainApiOverride.post(...args) : assert.fail('SSR must not write account data') };

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
    if (id === '@/util/MainApi') return { __esModule: true, default: mainApi };
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
  for (const initialPanelSlug of ['shop-management', 'shop-add-category', 'shop-categories', 'shop-add-subcategory', 'shop-subcategories', 'shop-add-product', 'shop-products']) {
    const html = renderToStaticMarkup(React.createElement(Dashboard, { initialPanelSlug }));
    assert.ok(html.includes('Shop dashboard navigation'));
    assert.ok(html.includes('Shop Dashboard'));
    assert.ok(html.includes('Add Category'));
    assert.ok(html.includes('Category List'));
    assert.ok(html.includes('Add Product'));
    assert.ok(html.includes('Product List'));
    assert.ok(html.includes('href="/superadmin/dashboard"'));
    assert.ok(html.includes('Super-admin Dashboard'));
    assert.ok(!html.includes('Vendor Kyc List'));
    assert.ok(!html.includes('Contact Enquiries'));
  }
  const admin = renderToStaticMarkup(React.createElement(Dashboard, { initialPanelSlug: 'overview' }));
  assert.ok(admin.includes('Super-admin navigation'));
  assert.ok(admin.includes('href="/dashboard/shop"'));
  assert.ok(!admin.includes('title="Orders"'));
  assert.ok(!admin.includes('title="Order"'), 'Order menu belongs only to the shop workspace');
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
  for (const pathname of ['/dashboard/shop', '/add-category', '/categories', '/add-subcategory', '/subcategories', '/add-product', '/product-list', '/orders', '/dashboard/shop/add-subcategory']) {
    const request = (role) => ({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: (key) => ({ value: key === 'epic_auth_role' ? role : 'synthetic-token' }) } });
    assert.equal(proxy(request('SUPER_ADMIN')).allowed, true);
    assert.equal(proxy(request('ADMIN')).allowed, true);
    assert.ok(proxy(request('VENDOR')).redirect.includes('/superadmin/login'));
    assert.ok(proxy(request('CLIENT')).redirect.includes('/superadmin/login'));
    assert.ok(proxy({ ...request('ADMIN'), cookies: { get: () => undefined } }).redirect.includes('/superadmin/login'));
  }
});

test('old nested shop pages redirect to their root-level routes', () => {
  const { getServerSideProps } = load('src/pages/dashboard/shop/[...panel].js');
  for (const segment of ['add-category', 'categories', 'add-subcategory', 'subcategories', 'add-product', 'product-list', 'orders']) {
    assert.deepEqual(getServerSideProps({ params: { panel: [segment] } }), { redirect: { destination: `/${segment}`, permanent: false } });
  }
  assert.deepEqual(getServerSideProps({ params: { panel: ['products'] } }), { redirect: { destination: '/product-list', permanent: false } });
  assert.deepEqual(getServerSideProps({ params: {} }), { notFound: true });
  assert.deepEqual(getServerSideProps({ params: { panel: ['unknown'] } }), { notFound: true });
  assert.deepEqual(getServerSideProps({ params: { panel: ['categories', 'unknown'] } }), { notFound: true });
});

test('shop index opens the shop overview with its dashboard navigation', () => {
  const Page = load('src/pages/dashboard/shop/index.js').default;
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.ok(html.includes('shop-dashboard-banner.png'));
  for (const text of ['YOUR SHOP WORKSPACE', 'Shop Overview', 'Your products, categories and orders in one place.', 'View Shop', 'Sample catalog preview.']) assert.ok(!html.includes(text), text);
  assert.ok(html.includes('Shop dashboard navigation'));
  assert.ok(html.includes('Super-admin Dashboard'));
});

test('product management renders live loading, creation controls and variant inputs safely', () => {
  const List = load('src/modules/ecommerce/management/ShopProductList.jsx').default;
  const Form = load('src/modules/ecommerce/management/products/EcommerceProductForm.jsx').default;
  const Detail = load('src/modules/ecommerce/management/products/EcommerceProductDetail.jsx').default;
  const list = renderToStaticMarkup(React.createElement(List));
  assert.ok(list.includes('Loading products...'));
  assert.ok(list.includes('Add Product'));
  assert.ok(list.includes('href="/add-product"'));
  assert.ok(list.includes('All statuses'));
  assert.ok(!list.includes('Sample catalog'));
  const form = renderToStaticMarkup(React.createElement(Form));
  assert.ok(form.includes('Product images'));
  assert.ok(form.includes('Upload image'));
  assert.ok(!form.includes('Image description'));
  for (const heading of ['Created date', 'Price', 'Variants', 'Stock']) assert.ok(list.includes(heading), heading);
  for (const label of ['Category', 'Subcategory', 'Product title', 'Brand name', 'GST (%)', 'Description', 'SKU', 'MRP (paise)', 'Sale price (paise)', 'Initial stock', 'Default variant', 'Add option', 'Add variant', 'Create draft product']) assert.ok(form.includes(label), label);
  const detail = renderToStaticMarkup(React.createElement(Detail, { id: 'product-one' }));
  assert.ok(detail.includes('Loading product details...'));
  assert.ok(detail.includes('Products List'));
  assert.ok(!detail.includes('Refresh details'));
  assert.ok(!detail.includes('Back to products'));
});

test('product details show readable information without exposing category or subcategory IDs', () => {
  const { ProductDetailContent } = load('src/modules/ecommerce/management/products/EcommerceProductDetail.jsx');
  const product = { title: 'Royal Bridal Lehenga', brandName: 'Epic Collection', description: 'Silk bridal wear.', status: 'DRAFT', categoryId: 'internal-category-id', subcategoryId: 'cmwd173440004l16lfyeq0sda', gstPercentage: 5, specifications: { fabric: 'Silk', blouseIncluded: true }, variants: [{ ecommerceVariantId: 'variant-one', sku: 'LEH-RED-M', optionValues: { Color: 'Red' }, saleAmountPaise: 1299000, mrpAmountPaise: 1599000, stockQuantity: 0, isDefault: true }] };
  const render = (row) => renderToStaticMarkup(React.createElement(ProductDetailContent, { product: row, stock: { variantId: '', quantity: '', type: 'STOCK_RECEIVED', note: '' }, onStockChange() {}, onStockSubmit() {}, onPublish() {} }));
  const html = render(product);
  assert.ok(!html.includes(product.subcategoryId));
  assert.ok(!html.includes(product.categoryId));
  for (const text of ['Royal Bridal Lehenga', 'Product information', 'Product variants', 'Inventory adjustment', 'Blouse Included', 'Yes', 'LEH-RED-M', 'Publish product']) assert.ok(html.includes(text), text);
  for (const text of ['Options', 'Pricing (Selected Variant)', '19% OFF', 'Out of stock', 'Specifications', 'Additional Information', 'No product image available']) assert.ok(html.includes(text), text);
  const named = render({ ...product, category: { name: 'Bridal Wear' }, subcategory: { name: 'Lehengas' } });
  assert.ok(named.includes('Bridal Wear'));
  assert.ok(named.includes('Lehengas'));
  const gallery = render({ ...product, images: ['/images/ecommerce/lehenga.webp', '/images/ecommerce/saree.webp'], optionDefinitions: [{ name: 'Color', values: ['Red', 'Maroon'] }], createdAt: '2026-11-12T10:00:00Z' });
  assert.ok(gallery.includes('View product image 2'));
  assert.ok(gallery.includes('Maroon'));
  assert.ok(!gallery.includes('No product image available'));
  assert.ok(gallery.includes('12 Nov 2026'));
});

test('saved product variant form uses its option definitions and exposes the live-save action', () => {
  const Form = load('src/modules/ecommerce/management/products/LiveProductVariantForm.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Form, { product: { ecommerceProductId: 'product-one', optionDefinitions: [{ name: 'Color', values: ['Red', 'Maroon'] }, { name: 'Size', values: ['M', 'L'] }], variants: [{ sku: 'LEH-RED-M' }] } }));
  for (const label of ['Add product variant', 'Color', 'Size', 'MRP (paise)', 'Sale price (paise)', 'Initial stock', 'Save variant', 'LEH-RED-M']) assert.ok(html.includes(label), label);
  assert.ok(!html.includes('Default variant'));
});

test('edit product page keeps the shop shell and loads protected product details', () => {
  const Page = load('src/pages/product-list/edit/[productId].js').default;
  const html = renderToStaticMarkup(React.createElement(Page, { productId: 'product-one' }));
  assert.ok(html.includes('Edit Product'));
  assert.ok(html.includes('Loading product for editing...'));
  assert.ok(html.includes('Shop dashboard navigation'));
  const { proxy } = load('src/proxy.js');
  const pathname = '/product-list/edit/product-one';
  assert.ok(proxy({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: () => undefined } }).redirect.includes('/superadmin/login'));
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
    ['src/modules/ecommerce/management/ShopProductList.jsx', 'Product List'],
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


test('public shop renders API loading and dedicated product detail content without sample products', () => {
  const Home = load('src/modules/ecommerce/ShopHome.jsx').default;
  const home = renderToStaticMarkup(React.createElement(Home));
  assert.ok(home.includes('Loading products...')); assert.ok(home.includes('Product filters'));
  for (const label of ['Open wishlist (0)', 'Open cart (0)']) assert.ok(home.includes(label), label);
  assert.ok(!home.includes('Min price (INR)')); assert.ok(!home.includes('Max price (INR)')); assert.ok(!home.includes('Apply price'));
  assert.ok(!home.includes('Royal Bridal Lehenga'));
  const { ShopProductDetails } = load('src/modules/ecommerce/ShopProductPage.jsx');
  const product = { id: 'one', slug: 'royal-bridal-lehenga', title: 'Royal Bridal Lehenga', description: 'Silk bridal wear', images: [], optionDefinitions: [{ name: 'Color', values: ['Red', 'Maroon'] }, { name: 'Size', values: ['M', 'L'] }], variants: [{ sku: 'LEH-RED-M', optionValues: { Color: 'Red', Size: 'M' }, mrpAmountPaise: 1599000, saleAmountPaise: 1299000, stockQuantity: 5, isDefault: true }], specifications: { fabric: 'Silk' } };
  const detail = renderToStaticMarkup(React.createElement(ShopProductDetails, { product }));
  for (const text of ['Royal Bridal Lehenga', 'LEH-RED-M', '19% OFF', 'Color: Maroon', 'Size: L', '5 available', 'No product image available', 'Buy Now']) assert.ok(detail.includes(text), text);
  const liveStock = renderToStaticMarkup(React.createElement(ShopProductDetails, { product: { ...product, variants: [{ ...product.variants[0], stockQuantity: undefined, availableQuantity: 4, inStock: true }] } }));
  assert.ok(liveStock.includes('4 available'));
  const increase = liveStock.match(/<button[^>]*aria-label="Increase quantity"[^>]*>/)?.[0];
  assert.ok(increase && !increase.includes('disabled'));
  const purchase = liveStock.match(/<button[^>]*class="purchaseButton"[^>]*>/)?.[0];
  assert.ok(purchase && !purchase.includes('disabled'));
  const Card = load('src/modules/ecommerce/components/ProductCard.jsx').default;
  const card = renderToStaticMarkup(React.createElement(Card, { product, onSave() {} }));
  assert.ok(card.includes('href="/shop/royal-bridal-lehenga"'));
});

test('image previews expose an X and separate choose/upload controls; variant editing offers only supported fields', () => {
  const Upload = load('src/modules/ecommerce/management/products/ProductImageUpload.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Upload, { images: [{ key: 'image', filename: 'side.png', preview: '/image.png', altText: 'side', sortOrder: 1 }], onImagesChange() {} }));
  for (const label of ['Remove image side.png', 'Choose image', 'Upload image', 'Order']) assert.ok(html.includes(label), label);
  assert.ok(!html.includes('Image description'));
  const savedImages = renderToStaticMarkup(React.createElement(Upload, { productId: 'product-one', images: [{ key: 'saved', filename: 'saved.png', url: 'https://example.test/saved.png', altText: 'Saved image', sortOrder: 1, attached: true }], onImagesChange() {}, onRemoveSavedImage: async () => {} }));
  assert.ok(savedImages.includes('src="https://example.test/saved.png"'));
  const removeSaved = savedImages.match(/<button[^>]*aria-label="Remove image saved.png"[^>]*>/)?.[0];
  assert.ok(removeSaved && !removeSaved.includes('disabled'), 'A supplied saved-image removal handler enables the X');
  const Edit = load('src/modules/ecommerce/management/products/ProductVariantEditor.jsx').default;
  const form = renderToStaticMarkup(React.createElement(Edit, { variant: { id: 'variant', sku: 'LEH-RED-M', saleAmountPaise: 1249000, isActive: false } }));
  for (const text of ['1249000', 'Active', 'Save variant', 'LEH-RED-M']) assert.ok(form.includes(text), text);
  assert.ok(!form.includes('Initial stock'));
  const Color = load('src/modules/ecommerce/management/products/ProductColorPicker.jsx').default;
  const color = renderToStaticMarkup(React.createElement(Color, { multiple: true, values: ['Red'], onChange() {} }));
  assert.ok(color.includes('type="color"'));
});


test('inventory menu pages and variant history use shop tables and require admin access', () => {
  for (const [file, heading] of [['src/pages/inventory.js', 'Inventory List'], ['src/pages/low-stock-variants.js', 'Low-stock Variants']]) {
    const Page = load(file).default;
    const html = renderToStaticMarkup(React.createElement(Page));
    for (const text of [heading, 'Inventory Management', 'Available stock', 'Reserved stock', 'Low-stock threshold', 'Loading inventory...', 'data-shop-table-toolbar="true"']) assert.ok(html.includes(text), text);
  }
  const History = load('src/modules/ecommerce/management/inventory/EcommerceInventoryMovements.jsx').default;
  const history = renderToStaticMarkup(React.createElement(History, { variant: { variantId: 'variant-one', sku: 'LEH-RED-M' }, onBack() {} }));
  for (const text of ['Movement History', 'LEH-RED-M', 'Back to inventory', 'Loading movement history...', 'Stock before', 'Stock after']) assert.ok(history.includes(text), text);
  const { proxy } = load('src/proxy.js');
  for (const pathname of ['/inventory', '/low-stock-variants']) assert.ok(proxy({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: () => undefined } }).redirect.includes('/superadmin/login'));
});


test('customer address, checkout and order pages render safe loading and guest states', () => {
  for (const [file, title, props] of [['src/pages/shop/checkout.js', 'Delivery address', {}], ['src/pages/shop/orders/index.js', 'My orders', {}], ['src/pages/shop/orders/[orderId].js', 'Order details', { orderId: 'order-one' }]]) {
    const Page = load(file).default;
    const html = renderToStaticMarkup(React.createElement(Page, props));
    assert.ok(html.includes(title)); assert.ok(html.includes('Sign in to continue'));
  }
  const { CheckoutContent } = load('src/modules/ecommerce/ShopCheckout.jsx');
  const checkout = renderToStaticMarkup(React.createElement(CheckoutContent, { account: { cart: [], loading: false, refresh() {} } }));
  for (const text of ['Loading saved addresses...', 'Full name', 'Phone number', 'Street address', 'Pincode', 'Set as default address', 'Confirm checkout']) assert.ok(checkout.includes(text), text);
  const { ShopOrderContent } = load('src/modules/ecommerce/ShopOrderDetails.jsx');
  const details = renderToStaticMarkup(React.createElement(ShopOrderContent, { order: { id: 'order-one', status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', totalAmountPaise: 1299000, items: [{ id: 'item', productTitle: 'Royal Lehenga', quantity: 1, unitSaleAmountPaise: 1299000 }], address: { fullName: 'Ravi Sharma', line1: '123 Main Street', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', phone: '9876543210' } } }));
  for (const text of ['Awaiting payment', 'Order items', 'Royal Lehenga', 'Ravi Sharma', '123 Main Street']) assert.ok(details.includes(text), text);
  const awaitingPayment = { id: 'pending-order', status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', totalAmountPaise: 1299000 };
  const paymentDetails = renderToStaticMarkup(React.createElement(ShopOrderContent, { order: awaitingPayment, onRefresh: async () => awaitingPayment }));
  for (const text of ['Order payment', 'Payment method', 'Razorpay', 'Cash on Delivery', 'Pay ']) assert.ok(paymentDetails.includes(text), text);
  for (const status of ['CREATED', 'CONFIRMED', 'RESERVED']) {
    const active = renderToStaticMarkup(React.createElement(ShopOrderContent, { order: { ...awaitingPayment, status }, onRefresh: async () => awaitingPayment }));
    assert.ok(active.includes('Pay '), `${status} unpaid order offers payment`);
    assert.ok(!active.includes('Payment is unavailable for the current order status'));
  }
  for (const patch of [{ status: 'CANCELLED' }, { paymentStatus: 'PAID' }]) {
    const closed = renderToStaticMarkup(React.createElement(ShopOrderContent, { order: { ...awaitingPayment, ...patch }, onRefresh: async () => awaitingPayment }));
    assert.ok(!closed.includes('Pay '));
    assert.ok(closed.includes('Order payment') && closed.includes('Payment method') && closed.includes('Razorpay'), 'Keep payment options visible with payment disabled');
  }
  const expired = renderToStaticMarkup(React.createElement(ShopOrderContent, { order: { ...awaitingPayment, reservationExpiresAt: '2000-01-01T00:00:00Z' }, onRefresh: async () => awaitingPayment }));
  assert.ok(expired.includes('Payment method') && expired.includes('reservation for this order has expired'));
  for (const item of [
    { product: { images: [{ url: 'https://example.test/product.jpg' }] } },
    { variant: { images: [{ url: 'https://example.test/product.jpg' }] } },
    { productSnapshot: { imageUrl: 'https://example.test/product.jpg' } },
    { imageUrl: 'https://example.test/product.jpg' },
  ]) {
    const images = renderToStaticMarkup(React.createElement(ShopOrderContent, { order: { ...awaitingPayment, items: [{ ...item, productTitle: 'Order product', quantity: 1 }] } }));
    assert.ok(images.includes('src="https://example.test/product.jpg"') && images.includes('alt="Order product"'));
    assert.ok(images.includes('width="144"') && images.includes('height="148"'));
  }
  const placeholder = renderToStaticMarkup(React.createElement(ShopOrderContent, { order: { ...awaitingPayment, items: [{ productTitle: 'Missing photo' }] } }));
  assert.ok(placeholder.includes('No image available for Missing photo'));
  const { PaymentSuccessCard } = load('src/modules/ecommerce/ShopPaymentSuccess.jsx');
  const success = renderToStaticMarkup(React.createElement(PaymentSuccessCard, { order: { ...awaitingPayment, paymentStatus: 'PAID' }, orderId: 'order & one' }));
  assert.ok(success.includes('Congratulations!') && success.includes('My Order'));
  assert.ok(success.includes('href="/shop/orders/order%20%26%20one"'));
  const unconfirmed = renderToStaticMarkup(React.createElement(PaymentSuccessCard, { order: awaitingPayment, orderId: awaitingPayment.id }));
  assert.ok(!unconfirmed.includes('Congratulations!') && unconfirmed.includes('not confirmed a successful payment'));
  const SuccessPage = load('src/pages/shop/orders/[orderId]/success.js');
  assert.deepEqual(SuccessPage.getServerSideProps({ params: { orderId: 'order-one' } }), { props: { orderId: 'order-one' } });
  assert.deepEqual(SuccessPage.getServerSideProps({ params: { orderId: '' } }), { notFound: true });
  const Header = load('src/modules/ecommerce/components/ShopPublicHeader.jsx').default;
  const header = renderToStaticMarkup(React.createElement(Header));
  assert.ok(header.includes('href="/shop">Home'));
});

test('API collection store isolates accounts, deduplicates reads and blocks duplicate or unconfirmed writes', async (t) => {
  const previousWindow = global.window; const previousDocument = global.document;
  const data = new Map([['epic_access_token', 'token-a'], ['epic_auth_user', JSON.stringify({ id: 'customer-a' })]]);
  global.window = { localStorage: { getItem: (key) => data.get(key) || null } }; global.document = { cookie: '' };
  const store = load('src/modules/ecommerce/components/shopAccountStore.js'); store.resetShopAccount();
  t.after(() => { store.resetShopAccount(); mainApiOverride = null; if (previousWindow === undefined) delete global.window; else global.window = previousWindow; if (previousDocument === undefined) delete global.document; else global.document = previousDocument; });
  let releaseCart; let releaseWishlist; let reads = 0;
  mainApiOverride = { get: (path) => { reads++; return new Promise((resolve) => { if (path === '/shop/cart') releaseCart = resolve; else releaseWishlist = resolve; }); } };
  const first = store.refreshShopAccount('customer-a'); const second = store.refreshShopAccount('customer-a');
  assert.equal(reads, 2);
  releaseCart({ data: { data: { cart: { items: [] } } } }); releaseWishlist({ data: { data: { products: [] } } }); await Promise.all([first, second]);
  assert.equal(store.shopAccountSnapshot().loaded, true);
  store.showShopCollectionNotice('customer-a', 'cart');
  const firstNotice = store.shopAccountSnapshot().notice;
  assert.equal(firstNotice.kind, 'cart');
  store.showShopCollectionNotice('customer-a', 'wishlist', 'Refresh failed');
  const latestNotice = store.shopAccountSnapshot().notice;
  assert.equal(latestNotice.kind, 'wishlist');
  assert.equal(latestNotice.refreshError, true);
  store.dismissShopCollectionNotice(firstNotice.id);
  assert.equal(store.shopAccountSnapshot().notice.id, latestNotice.id, 'An old timeout must not dismiss a newer notification');
  store.showShopCollectionNotice('another-customer', 'cart');
  assert.equal(store.shopAccountSnapshot().notice.id, latestNotice.id, 'Ignore another account notification');
  store.dismissShopCollectionNotice(latestNotice.id);
  assert.equal(store.shopAccountSnapshot().notice, null);
  store.showShopCollectionNotice('customer-a', 'cart');
  mainApiOverride.get = async (path) => ({ data: { data: path === '/shop/cart' ? { items: [] } : { products: [] } } });
  let releaseWrite; let writes = 0;
  const mutation = store.mutateShopAccount('customer-a', () => { writes++; return new Promise((resolve) => { releaseWrite = resolve; }); }, 'cart');
  await Promise.resolve(); await Promise.resolve();
  await assert.rejects(store.mutateShopAccount('customer-a', () => { writes++; }, 'cart'), /wait/);
  releaseWrite({}); await mutation; assert.equal(writes, 1);
  mainApiOverride.get = async () => { throw new Error('Read failed after write'); };
  const committed = await store.mutateShopAccount('customer-a', async () => { writes++; }, 'cart');
  assert.equal(committed.saved, true); assert.ok(committed.refreshError);
  await assert.rejects(store.mutateShopAccount('customer-a', async () => { writes++; }, 'cart'), /Refresh/);
  assert.equal(writes, 2);
  let lateCart; let lateWishlist;
  mainApiOverride.get = (path) => new Promise((resolve) => { if (path === '/shop/cart') lateCart = resolve; else lateWishlist = resolve; });
  const staleRead = store.refreshShopAccount('customer-a', true);
  data.set('epic_access_token', 'token-b'); data.set('epic_auth_user', JSON.stringify({ id: 'customer-b' }));
  mainApiOverride.get = async (path) => ({ data: { data: path === '/shop/cart' ? { items: [] } : { products: [{ id: 'product-b', title: 'B', slug: 'b' }] } } });
  await store.refreshShopAccount('customer-b'); assert.equal(store.shopAccountSnapshot().session, 'customer-b'); assert.equal(store.shopAccountSnapshot().wishlist[0].id, 'product-b');
  assert.equal(store.shopAccountSnapshot().notice, null, 'Account changes clear notifications');
  store.showShopCollectionNotice('customer-a', 'cart');
  assert.equal(store.shopAccountSnapshot().notice, null, 'Late additions from the old account cannot show notifications');
  lateCart({ data: { data: { items: [] } } }); lateWishlist({ data: { data: { products: [{ id: 'old-private-product', slug: 'old', title: 'Old' }] } } });
  await staleRead; assert.equal(store.shopAccountSnapshot().wishlist[0].id, 'product-b');

  await assert.rejects(store.mutateShopAccount('customer-a', async () => { writes++; }, 'wishlist'), /Sign in/);
  data.delete('epic_access_token'); await store.refreshShopAccount(''); assert.equal(store.shopAccountSnapshot().wishlist.length, 0);
});


test('cart writes recover from initial read errors and do not wait for a slow wishlist read', async (t) => {
  const previousWindow = global.window; const previousDocument = global.document;
  global.window = { localStorage: { getItem: (key) => key === 'epic_access_token' ? 'token-a' : key === 'epic_auth_user' ? JSON.stringify({ id: 'customer-a' }) : null } }; global.document = { cookie: '' };
  const store = load('src/modules/ecommerce/components/shopAccountStore.js'); store.resetShopAccount();
  t.after(() => { store.resetShopAccount(); mainApiOverride = null; if (previousWindow === undefined) delete global.window; else global.window = previousWindow; if (previousDocument === undefined) delete global.document; else global.document = previousDocument; });
  mainApiOverride = { get: async () => { throw Object.assign(new Error('Read unavailable'), { response: { status: 503 } }); } };
  await store.refreshShopAccount('customer-a');
  assert.ok(store.shopAccountSnapshot().cartError);
  mainApiOverride.get = async () => ({ data: { data: { items: [] } } });
  let writes = 0;
  await store.mutateShopAccount('customer-a', async () => { writes++; }, 'cart');
  assert.equal(writes, 1); assert.equal(store.shopAccountSnapshot().cartError, '');
  let releaseWishlist;
  mainApiOverride.get = (path) => path === '/shop/wishlist' ? new Promise(resolve => { releaseWishlist = resolve; }) : Promise.resolve({ data: { data: { items: [] } } });
  const loading = store.refreshShopAccount('customer-a', true);
  await store.mutateShopAccount('customer-a', async () => { writes++; }, 'cart');
  assert.equal(writes, 2); assert.equal(store.shopAccountSnapshot().wishlistLoading, true);
  releaseWishlist({ data: { data: { products: [] } } }); await loading;
  // A failed preflight read has sent no write and must remain retryable.
  mainApiOverride.get = async () => { throw new Error('Read failed'); };
  await assert.rejects(store.mutateShopAccount('customer-a', async () => { writes++; }, 'wishlist', { readBeforeWrite: true }), /Read failed/);
  assert.equal(store.shopAccountSnapshot().wishlistNeedsRefresh, false);
  mainApiOverride.get = async () => ({ data: { data: { products: [] } } });
  await store.mutateShopAccount('customer-a', async () => { writes++; }, 'wishlist', { readBeforeWrite: true });
  assert.equal(writes, 3);
});


test('user dashboard orders reuse shop tables and protect user order routes', () => {
  const Page = load('src/pages/user/orders/index.js').default;
  const html = renderToStaticMarkup(React.createElement(Page));
  for (const text of ['My Orders', 'My shop orders', 'Created date', 'Loading your orders...', 'data-shop-table-toolbar="true"']) assert.ok(html.includes(text), text);
  const { proxy } = load('src/proxy.js');
  for (const pathname of ['/user/orders', '/user/orders/order-one']) {
    const guest = proxy({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: () => undefined } });
    assert.ok(guest.redirect.includes('/user/login'));
    const values = { epic_access_token: 'token', epic_refresh_token: 'refresh', epic_auth_role: 'CLIENT' };
    assert.ok(proxy({ url: `http://localhost${pathname}`, nextUrl: { pathname, search: '' }, cookies: { get: key => ({ value: values[key] }) } }).allowed);
  }
  const Actions = load('src/modules/ecommerce/components/ShopOrderActions.jsx').default;
  const pending = renderToStaticMarkup(React.createElement(Actions, { order: { id: 'one', status: 'PENDING_PAYMENT' }, onChanged() {} }));
  assert.ok(pending.includes('Cancel order')); assert.ok(!pending.includes('Request return'));
  const delivered = renderToStaticMarkup(React.createElement(Actions, { order: { id: 'one', status: 'DELIVERED' }, onChanged() {} }));
  assert.ok(delivered.includes('Request return')); assert.ok(!delivered.includes('Cancel order'));
});


test('admin orders use live shop tables and status-driven payment and fulfilment actions', () => {
  const Page = load('src/pages/orders.js').default;
  const html = renderToStaticMarkup(React.createElement(Page));
  for (const text of ['Admin shop orders', 'Customer', 'Fulfilment', 'Payment status', 'Loading orders...', 'data-shop-table-toolbar="true"']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('Live orders are not connected yet'));
  assert.ok(html.includes('Shop dashboard navigation'));
  assert.ok(!html.includes('Super-admin navigation'));
  assert.ok(html.includes('All orders'));
  assert.ok(html.includes('title="Order"'));
  assert.equal(load('src/pages/superadmin/[panel].js').getServerSideProps({ params: { panel: 'all-orders' } }).redirect.destination, '/orders');
  const shop = renderToStaticMarkup(React.createElement(load('src/components/dashboard/SuperAdminDashboard.jsx').default, { initialPanelSlug: 'shop-management' }));
  assert.ok(shop.includes('title="Order"'));
  const Actions = load('src/modules/ecommerce/management/orders/EcommerceOrderActions.jsx').default;
  const pending = renderToStaticMarkup(React.createElement(Actions, { order: { id: 'one', status: 'PENDING_PAYMENT' }, onChanged() {} }));
  assert.ok(pending.includes('Mark paid (test)')); assert.ok(pending.includes('Cancel order')); assert.ok(!pending.includes('Ship order'));
  for (const [status, text] of [['PAID', 'Start processing'], ['PROCESSING', 'Mark packed'], ['PACKED', 'Ship order'], ['SHIPPED', 'Mark delivered'], ['RETURN_REQUESTED', 'Accept return and restock'], ['RETURNED', 'Record refund']]) {
    const rendered = renderToStaticMarkup(React.createElement(Actions, { order: { id: 'one', status }, onChanged() {} }));
    assert.ok(rendered.includes(text), text);
  }
});


test('category and subcategory edit forms prefill data with save actions', () => {
  const Category = load('src/modules/ecommerce/management/categories/EcommerceCategoryForm.jsx').default;
  const html = renderToStaticMarkup(React.createElement(Category, { category: { id: 'category-one', name: 'Bridal Wear', description: 'Silk and velvet', sortOrder: 0 }, onSaved() {}, onCancel() {} }));
  for (const text of ['Edit Category', 'Bridal Wear', 'Silk and velvet', 'Save category']) assert.ok(html.includes(text), text);
  const Subcategory = load('src/modules/ecommerce/management/subcategories/EcommerceSubcategoryForm.jsx').default;
  const sub = renderToStaticMarkup(React.createElement(Subcategory, { subcategory: { id: 'sub-one', categoryId: 'category-one', name: 'Royal Lehenga', specificationTemplate: { fields: [{ key: 'fabric', label: 'Fabric', type: 'SELECT', required: true, options: ['Silk', 'Velvet'] }] } }, onSaved() {}, onCancel() {} }));
  for (const text of ['Edit Subcategory', 'Royal Lehenga', 'Fabric', 'Silk', 'Velvet', 'Save subcategory']) assert.ok(sub.includes(text), text);
});
