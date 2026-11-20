import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { adjustEcommerceStock, attachEcommerceProductImage, createEcommerceProduct, createEcommerceVariant, ecommerceLiveVariantPayload, ecommerceProductId, ecommerceProductImagePayload, ecommerceProductPayload, ecommerceVariantId, fetchEcommerceProduct, fetchEcommerceProducts, publishEcommerceProduct, removeEcommerceProductImage, uploadEcommerceProductImage, ecommerceVariantUpdatePayload, updateEcommerceVariant } from '../src/util/ecommerceProducts.mjs';

test('saved image removal scopes and encodes product and image IDs without sending a body', async () => {
  const calls = [];
  const api = { delete: async (...args) => { calls.push(args); return { status: 204 }; } };
  await removeEcommerceProductImage(api, 'product & one', { ecommerceProductImageId: 'image/one' });
  assert.deepEqual(calls, [['/admin/ecommerce/products/product%20%26%20one/images/image%2Fone', { signal: undefined }]]);
  const failure = Object.assign(new Error('Removal rejected.'), { response: { status: 409 } });
  await assert.rejects(removeEcommerceProductImage({ delete: async () => { throw failure; } }, 'one', { id: 'image' }), error => error === failure);
});

test('images with only upload references resolve their saved image ID before deletion', async () => {
  const removed = [];
  const api = {
    get: async () => ({ data: { data: { product: { id: 'product', title: 'Product', images: [{ imageId: 'saved-image', url: 'https://example.test/image.jpg', publicId: 'products/image' }] } } } }),
    delete: async path => { removed.push(path); return { status: 200, data: { success: true } }; },
  };
  await removeEcommerceProductImage(api, 'product', { publicId: 'products/image' });
  assert.deepEqual(removed, ['/admin/ecommerce/products/product/images/saved-image']);
  await assert.rejects(removeEcommerceProductImage(api, 'product', { url: 'https://example.test/other.jpg' }), /no image ID/);
  assert.equal(removed.length, 1);
  await assert.rejects(removeEcommerceProductImage(api, 'product', null), /saved product image/);
});

const values = { categoryId: 'category & one', subcategoryId: 'subcategory & one', title: 'Royal Bridal Lehenga', description: 'A detailed product description for the royal bridal lehenga.', brandName: 'Epic Collection', gstPercentage: 5, specifications: { fabric: 'Silk', blouseIncluded: true }, optionDefinitions: [{ name: 'Color', values: ['Red', 'Maroon'] }, { name: 'Size', values: ['M', 'L'] }], images: [], variants: [{ sku: 'LEH-RED-M', optionValues: { Color: 'Red', Size: 'M' }, mrpAmountPaise: 1599000, saleAmountPaise: 1299000, initialStock: 5, isDefault: true }] };
test('product payload preserves the supplied schema, booleans, paise and numeric stock', () => {
  assert.deepEqual(ecommerceProductPayload(values), values);
  const input = structuredClone(values); input.gstPercentage = '5'; input.variants[0].initialStock = '5'; input.variants[0].mrpAmountPaise = '1599000'; input.ignored = true;
  assert.deepEqual(ecommerceProductPayload(input), values);
});

test('creation sends uploaded gallery images and color variant image URLs in one payload', async () => {
  const input = structuredClone(values);
  input.optionDefinitions[0].values = ['#DC2626', '#800020'];
  input.variants[0].optionValues.Color = '#DC2626';
  input.variants[0].imageUrl = 'https://example.test/red.jpg';
  input.variants.push({ ...input.variants[0], sku: 'LEH-MAROON-M', optionValues: { Color: '#800020', Size: 'M' }, imageUrl: 'https://example.test/maroon.jpg', initialStock: 4, isDefault: false });
  input.images = [{ url: 'https://example.test/chart.jpg', publicId: 'products/chart', altText: 'Lehenga size chart', sortOrder: '1', key: 'local-key', status: 'uploaded' }];
  const payload = ecommerceProductPayload(input);
  assert.deepEqual(payload.images, [{ url: 'https://example.test/chart.jpg', publicId: 'products/chart', altText: 'Lehenga size chart', sortOrder: 1 }]);
  assert.equal(payload.variants[1].imageUrl, 'https://example.test/maroon.jpg');
  assert.equal(payload.variants[1].optionValues.Color, '#800020');
  const calls = [];
  await createEcommerceProduct({ post: async (path, body) => { calls.push({ path, body }); return { data: { data: { product: { id: 'created-product', ...body } } } }; } }, input);
  assert.deepEqual(calls, [{ path: '/admin/ecommerce/products', body: payload }]);
  for (const imageUrl of ['javascript:bad', '/local-image.jpg', 123]) assert.throws(() => ecommerceProductPayload({ ...input, variants: [{ ...input.variants[0], imageUrl }] }), /variant image/);
  assert.throws(() => ecommerceProductPayload({ ...input, images: [{ ...input.images[0], publicId: '' }] }), /public ID/);
});
test('invalid prices, quantities, options, combinations and defaults cannot be submitted', () => {
  for (const quantity of ['', null, true, -1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const input = structuredClone(values); input.variants[0].initialStock = quantity; assert.throws(() => ecommerceProductPayload(input));
  }
  for (const mutate of [
    (input) => { input.categoryId = ''; }, (input) => { input.gstPercentage = 101; },
    (input) => { input.variants[0].saleAmountPaise = 2000000; },
    (input) => { input.variants[0].isDefault = false; },
    (input) => { input.variants[0].optionValues.Color = 'Blue'; },
    (input) => { input.variants.push({ ...input.variants[0], sku: 'other', isDefault: false }); },
    (input) => { input.optionDefinitions.push({ name: 'Color', values: ['Green'] }); },
  ]) { const input = structuredClone(values); mutate(input); assert.throws(() => ecommerceProductPayload(input)); }
});
test('invalid IDs and stock adjustments are rejected before sending a request', async () => {
  const api = { get: () => assert.fail('must not request'), post: () => assert.fail('must not request') };
  await assert.rejects(fetchEcommerceProduct(api, ''), /ID/);
  await assert.rejects(publishEcommerceProduct(api, null), /ID/);
  for (const quantity of [0, -1, 0.5, '', true]) await assert.rejects(adjustEcommerceStock(api, 'id', { quantity, type: 'STOCK_RECEIVED', note: 'Stock received' }), /quantity/);
  await assert.rejects(adjustEcommerceStock(api, 'id', { quantity: 1, type: 'invented', note: 'Stock received' }), /type/);
});
const baseURL = process.env.ECOMMERCE_PRODUCTS_SIMULATION_URL;

test('HTTP creates gallery media and hex color photos together without separate image association', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-product-test-token' } });
  const image = await uploadEcommerceProductImage(api, new File(['synthetic-image'], 'color.jpg', { type: 'image/jpeg' }));
  const input = structuredClone(values);
  input.title = 'Hex color media contract';
  input.images = [{ ...image, altText: 'Color image', sortOrder: 1 }];
  input.optionDefinitions[0].values = ['#800020'];
  input.variants[0].optionValues.Color = '#800020';
  input.variants[0].imageUrl = image.url;
  const created = await createEcommerceProduct(api, input);
  const saved = await fetchEcommerceProduct(api, ecommerceProductId(created));
  assert.deepEqual(saved.images, input.images);
  assert.equal(saved.variants[0].imageUrl, image.url);
  assert.equal(saved.variants[0].optionValues.Color, '#800020');
});
test('image and live variant payloads preserve the supplied schema and reject invalid input', async () => {
  const input = { sku: 'LEH-MAR-L', optionValues: { Color: 'Maroon', Size: 'L' }, mrpAmountPaise: '1649000', saleAmountPaise: '1349000', initialStock: '3', isDefault: true, ignored: true };
  const payload = ecommerceLiveVariantPayload(input, values.optionDefinitions, values.variants);
  assert.deepEqual(payload, { sku: 'LEH-MAR-L', optionValues: { Color: 'Maroon', Size: 'L' }, mrpAmountPaise: 1649000, saleAmountPaise: 1349000, initialStock: 3 });
  assert.throws(() => ecommerceLiveVariantPayload(values.variants[0], values.optionDefinitions, values.variants), /SKU/);
  assert.throws(() => ecommerceLiveVariantPayload({ ...input, sku: 'NEW', optionValues: { Color: 'Blue', Size: 'L' } }, values.optionDefinitions), /valid value/);
  assert.throws(() => ecommerceLiveVariantPayload({ ...input, initialStock: -1 }, values.optionDefinitions), /whole numbers/);
  assert.throws(() => ecommerceLiveVariantPayload({ ...input, saleAmountPaise: 9999999 }, values.optionDefinitions), /exceed/);
  assert.deepEqual(ecommerceProductImagePayload({ url: 'https://example.test/image.png', publicId: 'product/image', altText: ' Side view ', sortOrder: '1', ignored: true }), { url: 'https://example.test/image.png', publicId: 'product/image', altText: 'Side view', sortOrder: 1 });
  assert.throws(() => ecommerceProductImagePayload({ url: 'javascript:bad', publicId: 'id', altText: 'Test', sortOrder: 1 }), /URL/);
  const noRequest = { post: () => assert.fail('Invalid images must not upload') };
  await assert.rejects(uploadEcommerceProductImage(noRequest, new Blob(['text'], { type: 'text/plain' })), /image file/);
  await assert.rejects(attachEcommerceProductImage(noRequest, '', {}), /ID/);
});

test('HTTP uploads multipart images, attaches returned media and adds a live variant', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-product-test-token' } });
  await api.post(`${baseURL.replace(/\/api\/v1$/, '')}/__reset`, {});
  const file = new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJXcAAAAASUVORK5CYII=', 'base64')], 'side-view.png', { type: 'image/png' });
  const uploaded = await uploadEcommerceProductImage(api, file);
  assert.ok(uploaded.publicId); assert.ok(uploaded.url.startsWith('https://'));
  const product = await createEcommerceProduct(api, values); const id = ecommerceProductId(product);
  await assert.rejects(attachEcommerceProductImage(api, id, { ...uploaded, altText: 'Unavailable', sortOrder: 1 }), (error) => error.response.status === 503);
  assert.equal((await fetchEcommerceProduct(api, id)).images.length, 0);
  await attachEcommerceProductImage(api, id, { ...uploaded, altText: 'Lehenga side view', sortOrder: '1' });
  const detail = await fetchEcommerceProduct(api, id);
  assert.deepEqual(detail.images, [{ ...uploaded, altText: 'Lehenga side view', sortOrder: 1 }]);
  const variant = { sku: 'LEH-MAR-L', optionValues: { Color: 'Maroon', Size: 'L' }, mrpAmountPaise: 1649000, saleAmountPaise: 1349000, initialStock: 3 };
  const added = await createEcommerceVariant(api, id, variant, { optionDefinitions: values.optionDefinitions, existingVariants: detail.variants });
  assert.equal(added.stockQuantity, 3); assert.equal(added.isDefault, false);
  assert.equal((await fetchEcommerceProduct(api, id)).variants.length, 2);
  await assert.rejects(createEcommerceVariant(api, id, variant, { optionDefinitions: values.optionDefinitions }), (error) => error.response.status === 409);
  await assert.rejects(createEcommerceVariant(api, id, { ...variant, sku: 'Unavailable' }, { optionDefinitions: values.optionDefinitions }), (error) => error.response.status === 503);
  api.defaults.headers['x-test-upload'] = 'invalid'; await assert.rejects(uploadEcommerceProductImage(api, file), /URL and public ID/);
  api.defaults.headers['x-test-upload'] = 'unavailable'; await assert.rejects(uploadEcommerceProductImage(api, file), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-upload'];
  const controller = new AbortController(); controller.abort(); await assert.rejects(uploadEcommerceProductImage(api, file, controller.signal), (error) => error.code === 'ERR_CANCELED');
});

test('HTTP creates, lists, reads, adjusts stock and publishes the same product', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-product-test-token' } });
  await api.post(`${baseURL.replace(/\/api\/v1$/, '')}/__reset`, {});
  const first = await fetchEcommerceProducts(api); assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  assert.equal((await fetchEcommerceProducts(api, { page: 2 })).items.length, 5);
  const created = await createEcommerceProduct(api, values); const id = ecommerceProductId(created);
  assert.ok(id.includes('&'));
  const detail = await fetchEcommerceProduct(api, id); assert.equal(detail.title, values.title); assert.deepEqual(detail.specifications, values.specifications);
  assert.equal((await fetchEcommerceProducts(api)).total, 26);
  await adjustEcommerceStock(api, ecommerceVariantId(detail.variants[0]), { quantity: '10', type: 'STOCK_RECEIVED', note: 'Warehouse stock received.' });
  assert.equal((await fetchEcommerceProduct(api, id)).variants[0].stockQuantity, 15);
  await publishEcommerceProduct(api, id);
  assert.equal((await fetchEcommerceProduct(api, id)).status, 'PUBLISHED');
  assert.equal((await fetchEcommerceProducts(api, { status: 'PUBLISHED' })).items[0].ecommerceProductId, id);
  assert.equal((await fetchEcommerceProducts(api, { status: '' })).total, 26);
  assert.equal((await fetchEcommerceProducts(api)).total, 25);
  await assert.rejects(createEcommerceProduct(api, values), (error) => error.response.status === 409);
  for (const [badId, status] of [['denied', 403], ['missing', 404], ['unavailable', 503]]) await assert.rejects(fetchEcommerceProduct(api, badId), (error) => error.response.status === status);
  await assert.rejects(fetchEcommerceProduct(api, 'invalid'), /unavailable/);
  await assert.rejects(createEcommerceProduct(api, { ...values, title: 'Rejected' }), /request rejected/);
  await assert.rejects(createEcommerceProduct(api, { ...values, title: 'Unavailable' }), (error) => error.response.status === 503);
  api.defaults.headers['x-test-response'] = 'invalid'; await assert.rejects(fetchEcommerceProducts(api), /invalid product list/); delete api.defaults.headers['x-test-response'];
  await assert.rejects(fetchEcommerceProducts(axios.create({ baseURL, proxy: false })), (error) => error.response.status === 401);
  const controller = new AbortController(); controller.abort(); await assert.rejects(fetchEcommerceProducts(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
});


test('variant updates send only sale price and active status to the encoded variant endpoint', async () => {
  const input = { saleAmountPaise: '1249000', isActive: false, sku: 'DO-NOT-SEND', initialStock: 100 };
  assert.deepEqual(ecommerceVariantUpdatePayload(input), { saleAmountPaise: 1249000, isActive: false });
  for (const value of ['', -1, 1.2, null, true]) assert.throws(() => ecommerceVariantUpdatePayload({ ...input, saleAmountPaise: value }));
  assert.throws(() => ecommerceVariantUpdatePayload({ ...input, isActive: 'true' }));
  const api = { patch: async (url, body) => {
    assert.equal(url, '/admin/ecommerce/variants/variant%20%26%20one');
    assert.deepEqual(body, { saleAmountPaise: 1249000, isActive: false });
    return { data: { success: true, data: { variant: { id: 'variant & one', ...body } } } };
  } };
  assert.equal((await updateEcommerceVariant(api, 'variant & one', input)).isActive, false);
});

test('HTTP variant edits persist only supported fields', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, proxy: false, headers: { Authorization: 'Bearer ecommerce-product-test-token' } });
  await api.post(`${baseURL.replace(/\/api\/v1$/, '')}/__reset`, {});
  const before = await fetchEcommerceProduct(api, 'product-1');
  await updateEcommerceVariant(api, ecommerceVariantId(before.variants[0]), { saleAmountPaise: 1249000, isActive: false, sku: 'ignored' });
  const after = (await fetchEcommerceProduct(api, 'product-1')).variants[0];
  assert.equal(after.saleAmountPaise, 1249000); assert.equal(after.isActive, false);
  assert.equal(after.sku, before.variants[0].sku); assert.equal(after.stockQuantity, before.variants[0].stockQuantity);
  await assert.rejects(updateEcommerceVariant(api, 'missing', { saleAmountPaise: 1, isActive: true }), (error) => error.response.status === 404);
});
