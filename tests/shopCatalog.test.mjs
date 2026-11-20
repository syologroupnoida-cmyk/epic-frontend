import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { fetchShopCategories, fetchShopSubcategories, fetchShopProducts, fetchShopProduct, shopProductParams, shopPriceToPaise, shopProductPrice, shopProductImages, shopStock, chooseShopVariant, ShopApi } from '../src/util/shopCatalog.mjs';

test('shop price boundaries use integer paise and preserve unavailable data', () => {
  assert.equal(shopPriceToPaise('12990.25'), 1299025);
  assert.equal(shopPriceToPaise('0'), 0);
  assert.equal(shopPriceToPaise(''), '');
  for (const value of ['-1', '1.001', 'abc']) assert.throws(() => shopPriceToPaise(value));
  assert.throws(() => shopProductParams({ minPrice: 100, maxPrice: 99 }));
  assert.deepEqual(shopProductParams({ categorySlug: 'bridal-wear', subcategoryId: 'sub & one', minPrice: 0, maxPrice: 200000 }), { page: 1, limit: 20, categorySlug: 'bridal-wear', subcategoryId: 'sub & one', minPrice: 0, maxPrice: 200000 });
  assert.equal(shopStock({ stockQuantity: 0 }), 0); assert.equal(shopStock({}), null);
  assert.equal(shopProductPrice({}).sale, null);
  assert.deepEqual(shopProductImages({ title: 'Product', images: [{ url: 'javascript:bad' }] }), []);
  assert.equal(ShopApi.defaults.withCredentials, false);
});

test('hex color selection chooses the matching variant photo before the shared gallery', () => {
  const red = { id: 'red', optionValues: { Color: '#DC2626', Size: 'M' }, imageUrl: 'https://example.test/red.jpg' };
  const maroon = { id: 'maroon', optionValues: { Color: '#800020', Size: 'M' }, imageUrl: 'https://example.test/maroon.jpg' };
  const product = { title: 'Lehenga', images: [{ url: 'https://example.test/chart.jpg', altText: 'Size chart' }], variants: [red, maroon] };
  assert.equal(shopProductImages(product, red)[0].url, red.imageUrl);
  const next = chooseShopVariant(product.variants, red, 'Color', '#800020');
  assert.equal(next.id, 'maroon');
  assert.deepEqual(shopProductImages(product, next).map(image => image.url), [maroon.imageUrl, 'https://example.test/chart.jpg']);
  assert.equal(shopProductImages(product, { ...maroon, imageUrl: 'javascript:bad' })[0].url, product.images[0].url);
});

test('variant selection preserves other options or chooses the matching available combination', () => {
  const variants = [{ optionValues: { Color: 'Red', Size: 'M' } }, { optionValues: { Color: 'Maroon', Size: 'M' } }, { optionValues: { Color: 'Red', Size: 'L' } }];
  assert.equal(chooseShopVariant(variants, variants[0], 'Color', 'Maroon'), variants[1]);
  assert.equal(chooseShopVariant(variants, variants[1], 'Size', 'L'), variants[2]);
  assert.equal(chooseShopVariant(variants, variants[0], 'Size', 'XL'), null);
});

const baseURL = process.env.SHOP_SIMULATION_URL;
test('HTTP public catalog paginates, filters category/subcategory/price and opens slug details', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, proxy: false, timeout: 3000 });
  assert.equal((await fetchShopProducts(api)).items.length, 20);
  assert.equal((await fetchShopProducts(api, { page: 2 })).items.length, 5);
  const categories = await fetchShopCategories(api); assert.equal(categories.length, 2);
  const subs = await fetchShopSubcategories(api, categories[0].id); assert.equal(subs.length, 2);
  const filtered = await fetchShopProducts(api, { categorySlug: categories[0].slug, subcategoryId: subs[0].id, minPrice: 50000, maxPrice: 200000 });
  assert.equal(filtered.total, 9); assert.equal(filtered.hasNext, false);
  assert.ok(filtered.items.every((row) => row.subcategoryId === subs[0].id && row.variants[0].saleAmountPaise <= 200000));
  const groom = await fetchShopSubcategories(api, categories[1].id); assert.equal(groom.length, 1); assert.notEqual(groom[0].categoryId, subs[0].categoryId);
  const product = await fetchShopProduct(api, 'royal-bridal-lehenga'); assert.equal(product.variants[0].saleAmountPaise, 1299000); assert.equal(product.specifications.blouseIncluded, true);
  assert.equal((await fetchShopProducts(api)).total, 25);
  assert.equal((await fetchShopProducts(api, { minPrice: 99999999 })).items.length, 0);
  await assert.rejects(fetchShopProduct(api, 'missing & slug'), (error) => error.response.status === 404);
  api.defaults.headers['x-test-shop'] = 'invalid'; await assert.rejects(fetchShopProducts(api), /invalid product list/);
  api.defaults.headers['x-test-shop'] = 'unavailable'; await assert.rejects(fetchShopProducts(api), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-shop'];
  const controller = new AbortController(); controller.abort(); await assert.rejects(fetchShopProducts(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
});


test('public availableQuantity enables stock controls and preserves sold-out zero ahead of fallback fields', () => {
  assert.equal(shopStock({ availableQuantity: 4, inStock: true }), 4);
  assert.equal(shopStock({ availableQuantity: '4' }), 4);
  assert.equal(shopStock({ availableQuantity: 0, stockQuantity: 10, inStock: false }), 0);
  assert.equal(shopStock({ inventory: { availableQuantity: 4 } }), 4);
  assert.equal(shopStock({ availableQuantity: -1 }), null);
});
