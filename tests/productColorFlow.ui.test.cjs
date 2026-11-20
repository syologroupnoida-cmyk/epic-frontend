const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const swc = require('next/dist/build/swc');

function harness(initial = [], api = {}, routes = []) {
  const slots = [...initial]; let cursor = 0;
  const cache = new Map();
  function load(relative) {
    let filename = path.resolve(__dirname, '..', relative);
    if (filename.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (!path.extname(filename)) filename = ['.js', '.jsx', '.mjs'].map(ext => filename + ext).find(fs.existsSync);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename); cache.set(filename, mod);
    mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
    const original = mod.require.bind(mod);
    mod.require = id => {
      if (id === 'react') return { ...React, useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; }, useRef(value) { const index = cursor++; if (!(index in slots)) slots[index] = { current: value }; return slots[index]; }, useEffect() {}, useId: () => 'color-picker' };
      if (id === '@mui/material') return new Proxy({}, { get: (_, name) => name });
      if (id === 'next/router') return { useRouter: () => ({ push(path) { routes.push(path); } }) };
      if (id === 'next/image') return { __esModule: true, default: 'Image' };
      if (id === 'next/link') return { __esModule: true, default: 'Link' };
      if (id === '@/util/MainApi') return { __esModule: true, default: api };
      if (id.endsWith('useShopCollections')) return { __esModule: true, default: () => ({ wishlist: [], busy: false }) };
      if (id.startsWith('./') && /ProductImageUpload|ProductVariantImageInput|LiveProductVariantForm|ProductVariantOption|ProductRemoveButton|ShopPublicHeader|ShopIcon|ProductColorPicker/.test(id)) return { __esModule: true, default: id.slice(2) };
      if (id.startsWith('@/')) return load('src/' + id.slice(2));
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
      return original(id);
    };
    mod._compile(swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code, filename);
    return mod.exports;
  }
  function render(Component, props) {
    cursor = 0;
    const nodes = [];
    function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== 'object') return; nodes.push(node); visit(node.props?.children); }
    visit(Component(props)); return nodes;
  }
  return { load, render };
}

test('product creation submits gallery and variant image once and enables hex color picking', async () => {
  const image = { key: 'local', url: 'https://example.test/red.jpg', publicId: 'products/red', altText: 'Red lehenga', sortOrder: '1', status: 'uploaded' };
  const form = { categoryId: 'category', subcategoryId: 'subcategory', title: 'Lehenga', description: 'Silk lehenga', brandName: 'Epic', gstPercentage: '5', specifications: {}, optionDefinitions: [{ name: 'Color', values: ['#DC2626'] }], images: [], variants: [{ sku: 'RED', optionValues: { Color: '#DC2626' }, imageUrl: image.url, mrpAmountPaise: '200', saleAmountPaise: '100', initialStock: '5', isDefault: true }] };
  const calls = [];
  const h = harness([form, [image]], { post: async (url, payload) => { calls.push({ url, payload }); return { data: { product: { id: 'created', ...payload } } }; } });
  const Form = h.load('src/modules/ecommerce/management/products/EcommerceProductForm.jsx').default;
  const nodes = h.render(Form, { onCreated() {} });
  assert.equal(nodes.find(node => node.type === 'ProductColorPicker').props.hexValues, true);
  assert.equal(nodes.find(node => node.type === 'ProductVariantImageInput').props.value, image.url);
  await nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/admin/ecommerce/products');
  assert.deepEqual(calls[0].payload.images, [{ url: image.url, publicId: image.publicId, altText: image.altText, sortOrder: 1 }]);
  assert.equal(calls[0].payload.variants[0].imageUrl, image.url);
});

test('product table Edit opens the canonical route with the selected encoded product ID', () => {
  const product = { id: 'product & one', title: 'Lehenga', status: 'DRAFT' };
  const routes = [];
  const h = harness(['', 0, 20, '', { items: [product], total: 1, hasNext: false }, false], {}, routes);
  const List = h.load('src/modules/ecommerce/management/ShopProductList.jsx').default;
  const Actions = h.load('src/modules/ecommerce/management/products/ProductActions.jsx').default;
  const nodes = h.render(List, {});
  nodes.find(node => node.type === Actions).props.onEdit();
  assert.deepEqual(routes, ['/edit-product/product%20%26%20one']);
});

test('clicking a color swatch switches the storefront main photo and selected SKU', () => {
  const red = { id: 'red', sku: 'RED-M', isDefault: true, optionValues: { Color: '#DC2626', Size: 'M' }, imageUrl: 'https://example.test/red.jpg', saleAmountPaise: 100, stockQuantity: 2 };
  const maroon = { ...red, id: 'maroon', sku: 'MAROON-M', isDefault: false, optionValues: { Color: '#800020', Size: 'M' }, imageUrl: 'https://example.test/maroon.jpg' };
  const product = { id: 'product', title: 'Lehenga', images: [{ url: '/chart.jpg' }], optionDefinitions: [{ name: 'Color', values: ['#DC2626', '#800020'] }], variants: [red, maroon] };
  const h = harness();
  const Details = h.load('src/modules/ecommerce/ShopProductPage.jsx').ShopProductDetails;
  let nodes = h.render(Details, { product });
  assert.equal(nodes.find(node => node.type === 'Image' && node.props.fill).props.src, red.imageUrl);
  nodes.find(node => node.props?.['aria-label'] === 'Color: #800020').props.onClick();
  nodes = h.render(Details, { product });
  assert.equal(nodes.find(node => node.type === 'Image' && node.props.fill).props.src, maroon.imageUrl);
  assert.equal(nodes.find(node => node.props?.['aria-label'] === 'Color: #800020').props['aria-pressed'], true);
  assert.ok(nodes.some(node => node.props?.className === 'sku' && node.props.children.join('') === 'SKU: MAROON-M'));
});

test('the creation color palette emits a hex code when a preset is selected', () => {
  const h = harness();
  const Picker = h.load('src/modules/ecommerce/management/products/ProductColorPicker.jsx').default;
  let selected;
  const nodes = h.render(Picker, { multiple: true, hexValues: true, values: [], onChange: values => { selected = values; } });
  nodes.find(node => node.type === 'button' && node.props['aria-label'] === '#DC2626').props.onClick();
  assert.deepEqual(selected, ['#DC2626']);
});

test('clicking the values input opens its color picker', () => {
  const h = harness();
  const Picker = h.load('src/modules/ecommerce/management/products/ProductColorPicker.jsx').default;
  const props = { label: 'Values (comma separated)', multiple: true, hexValues: true, values: [], onChange() {} };
  let nodes = h.render(Picker, props);
  assert.equal(nodes.find(node => node.type === 'Popover').props.open, false);
  const anchor = {};
  nodes.find(node => node.type === 'TextField' && node.props.label === props.label).props.onClick({ currentTarget: anchor });
  nodes = h.render(Picker, props);
  assert.equal(nodes.find(node => node.type === 'Popover').props.open, true);
  assert.equal(nodes.find(node => node.type === 'Popover').props.anchorEl, anchor);
});

test('selected colors render as removable chips with matching swatches', () => {
  const h = harness();
  const Picker = h.load('src/modules/ecommerce/management/products/ProductColorPicker.jsx').default;
  let changed;
  const nodes = h.render(Picker, { multiple: true, values: ['#DC2626', '#800020'], onChange: values => { changed = values; } });
  const input = nodes.find(node => node.type === 'TextField');
  assert.equal(input.props.value, '');
  const chips = input.props.slotProps.input.startAdornment.props.children;
  assert.deepEqual(chips.map(chip => chip.props.label), ['#DC2626', '#800020']);
  assert.equal(chips[0].props.avatar.props.sx.bgcolor, '#DC2626 !important');
  let stopped = false;
  chips[0].props.onDelete({ stopPropagation() { stopped = true; } });
  assert.equal(stopped, true);
  assert.deepEqual(changed, ['#800020']);
});

test('blank option values open the color picker and selecting colors names the option Color', () => {
  const form = { categoryId: '', subcategoryId: '', specifications: {}, optionDefinitions: [{ name: '', values: [''] }], variants: [] };
  const h = harness([form, []]);
  const Form = h.load('src/modules/ecommerce/management/products/EcommerceProductForm.jsx').default;
  const picker = h.render(Form, {}).find(node => node.type === 'ProductColorPicker');
  assert.equal(picker.props.label, 'Values (comma separated)');
  picker.props.onChange(['#800020']);
  const nodes = h.render(Form, {});
  assert.equal(nodes.find(node => node.type === 'TextField' && node.props.label === 'Option name').props.value, 'Color');
  assert.deepEqual(nodes.find(node => node.type === 'ProductColorPicker').props.values, ['#800020']);
});
