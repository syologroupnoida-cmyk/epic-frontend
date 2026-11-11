import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createEcommerceCategory, ecommerceCategoryError, ecommerceCategoryId, ecommerceCategoryPayload, fetchEcommerceCategories, fetchEcommerceCategory, validateEcommerceCategory } from '../src/util/ecommerceCategories.mjs';
import { isShopPanelSlug, shopDashboardMenu, shopPanelPath, shopSlugFromSegments, shopPanelSlugs } from '../src/util/shopDashboardRoutes.mjs';

const baseURL = process.env.ECOMMERCE_CATEGORIES_SIMULATION_URL;
const api = () => axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-category-test-token' } });
const values = { name: ' Bridal Wear ', description: ' Wedding clothing and bridal fashion. ', sortOrder: '1' };

test('category creation sends exactly the supplied fields with a numeric sort order', () => {
  assert.deepEqual(ecommerceCategoryPayload({ ...values, isActive: true, id: 'ignored' }), { name: 'Bridal Wear', description: 'Wedding clothing and bridal fashion.', sortOrder: 1 });
  assert.deepEqual(ecommerceCategoryPayload({ ...values, description: '', sortOrder: 0 }), { name: 'Bridal Wear', description: '', sortOrder: 0 });
  for (const sortOrder of ['', ' ', null, undefined, -1, 1.5, 'abc', true, Infinity]) assert.ok(validateEcommerceCategory({ ...values, sortOrder }).sortOrder);
  assert.ok(validateEcommerceCategory({ ...values, name: ' ' }).name);
  assert.throws(() => ecommerceCategoryPayload({ ...values, sortOrder: -1 }));
});

test('shop navigation has its own sections and category routes', () => {
  assert.equal(shopPanelSlugs['Add Category'], 'shop-add-category');
  assert.equal(shopPanelSlugs['Category List'], 'shop-categories');
  assert.equal(isShopPanelSlug('shop-management'), true);
  assert.equal(isShopPanelSlug('shop-categories'), true);
  assert.equal(isShopPanelSlug('vendor-businesses'), false);
  assert.deepEqual(shopDashboardMenu.map((item) => item.label), ['Shop Overview', 'Categories', 'Shop Products', 'Shop Orders']);
  assert.deepEqual(shopDashboardMenu[1].sub, ['Add Category', 'Category List', 'Add Subcategory', 'Subcategory List']);
});

test('category client normalizes supported envelopes and never converts malformed data to an empty list', async () => {
  const row = { ecommerceCategoryId: 'one', name: 'Category', sortOrder: 0 };
  const wrapped = await fetchEcommerceCategories({ get: async () => ({ data: { data: { items: [row], meta: { pagination: { totalCount: 21 } } } } }) });
  assert.deepEqual(wrapped, { items: [row], total: 21, hasNext: true });
  const raw = await fetchEcommerceCategories({ get: async () => ({ data: [row] }) });
  assert.equal(raw.total, -1);
  assert.equal(raw.hasNext, false);
  assert.equal(ecommerceCategoryId(row), 'one');
  await assert.rejects(fetchEcommerceCategories({ get: async () => ({ data: { data: {} } }) }), /invalid category list/);
  await assert.rejects(fetchEcommerceCategory({ get: async () => ({ data: { data: null } }) }, 'one'), /unavailable/);
  await assert.rejects(fetchEcommerceCategory({ get: () => assert.fail('Invalid IDs must not be sent') }, ''), /category ID/);
});

test('HTTP paginates, creates with exact fields and reads the new category by ID', { skip: !baseURL }, async () => {
  const client = api();
  await client.post('/__reset', {}, { baseURL: baseURL.replace(/\/api\/v1$/, '') });
  const first = await fetchEcommerceCategories(client);
  assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  assert.equal((await fetchEcommerceCategories(client, { page: 2 })).items.length, 5);
  assert.equal((await fetchEcommerceCategories(client, { page: 99 })).items.length, 0);
  const id = ecommerceCategoryId(first.items[0]);
  assert.equal(id, 'category & one');
  assert.equal((await fetchEcommerceCategory(client, id)).name, 'Wedding Category 1');
  const created = await createEcommerceCategory(client, { ...values, unexpected: 'must be removed' });
  assert.equal(created.message, 'Category created.');
  const saved = await fetchEcommerceCategory(client, ecommerceCategoryId(created.category));
  assert.equal(saved.name, 'Bridal Wear'); assert.equal(saved.description, values.description.trim()); assert.equal(saved.sortOrder, 1);
  const refreshed = await fetchEcommerceCategories(client);
  assert.equal(refreshed.total, 26);
  assert.ok(refreshed.items.some((row) => row.name === 'Bridal Wear'));
  await assert.rejects(createEcommerceCategory(client, values), (error) => error.response.status === 409 && ecommerceCategoryError(error) === 'This category already exists.');
});

test('HTTP preserves auth and service errors, rejects bad envelopes and supports cancellation', { skip: !baseURL }, async () => {
  const client = api();
  await assert.rejects(fetchEcommerceCategories(axios.create({ baseURL, proxy: false })), (error) => error.response.status === 401);
  for (const [id, status] of [['denied', 403], ['missing', 404], ['unavailable', 503]]) await assert.rejects(fetchEcommerceCategory(client, id), (error) => error.response.status === status);
  await assert.rejects(fetchEcommerceCategory(client, 'invalid'), /unavailable/);
  client.defaults.headers['x-test-response'] = 'invalid';
  await assert.rejects(fetchEcommerceCategories(client), /invalid category list/);
  delete client.defaults.headers['x-test-response'];
  await assert.rejects(createEcommerceCategory(client, { ...values, name: 'Unavailable' }), (error) => error.response.status === 503);
  await assert.rejects(createEcommerceCategory(client, { ...values, name: 'Rejected' }), /request rejected/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchEcommerceCategories(client, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  await assert.rejects(createEcommerceCategory(client, values, controller.signal), (error) => error.code === 'ERR_CANCELED');
});

test('canonical shop routes resolve every panel and reject unknown or nested routes', () => {
  assert.equal(shopPanelPath('Shop Overview'), '/dashboard/shop');
  assert.equal(shopPanelPath('Category List'), '/categories');
  assert.equal(shopPanelPath('Add Subcategory'), '/add-subcategory');
  assert.equal(shopSlugFromSegments(), 'shop-management');
  assert.equal(shopSlugFromSegments(['categories']), 'shop-categories');
  for (const panel of Object.keys(shopPanelSlugs)) {
    const path = shopPanelPath(panel);
    const tail = (path === '/dashboard/shop' ? [] : path.split('/').filter(Boolean));
    assert.equal(shopSlugFromSegments(tail), shopPanelSlugs[panel]);
  }
  assert.equal(shopSlugFromSegments(['unknown']), null);
  assert.equal(shopSlugFromSegments(['categories', 'unknown']), null);
  assert.equal(shopPanelPath('Unknown panel'), null);
});
