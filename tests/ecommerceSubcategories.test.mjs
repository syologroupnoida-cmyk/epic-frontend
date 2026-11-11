import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createEcommerceSubcategory, ecommerceSubcategoryPayload, fetchEcommerceSubcategories, filterEcommerceSubcategories, validateEcommerceSubcategory } from '../src/util/ecommerceSubcategories.mjs';
import { fetchAllEcommerceCategories } from '../src/util/ecommerceCategories.mjs';

const baseURL = process.env.ECOMMERCE_CATEGORIES_SIMULATION_URL;
const api = () => axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-category-test-token' } });
const values = { categoryId: ' category & one ', name: ' Bridal Saree ', specificationTemplate: { fields: [
  { key: 'fabric', label: 'Fabric', type: 'SELECT', required: true, options: [' Silk ', 'Velvet'] },
  { key: 'blouseIncluded', label: 'Blouse Included', type: 'BOOLEAN', required: true },
] } };

test('subcategory payload keeps the exact supplied nested schema and excludes UI or unrelated fields', () => {
  const result = ecommerceSubcategoryPayload({ ...values, ignored: true, specificationTemplate: { ignored: true, fields: values.specificationTemplate.fields.map((field) => ({ ...field, id: 42, ...(field.type === 'BOOLEAN' ? { options: ['must be omitted'] } : {}) })) } });
  assert.deepEqual(result, { categoryId: 'category & one', name: 'Bridal Saree', specificationTemplate: { fields: [
    { key: 'fabric', label: 'Fabric', type: 'SELECT', required: true, options: ['Silk', 'Velvet'] },
    { key: 'blouseIncluded', label: 'Blouse Included', type: 'BOOLEAN', required: true },
  ] } });
  assert.ok(validateEcommerceSubcategory({ ...values, categoryId: '' }).categoryId);
  assert.ok(validateEcommerceSubcategory({ ...values, name: ' ' }).name);
  const invalid = [
    [{ key: '', label: 'Fabric', type: 'SELECT', required: true, options: ['Silk'] }],
    [{ key: 'fabric', label: 'Fabric', type: 'SELECT', required: true, options: [] }],
    [{ key: 'fabric', label: 'Fabric', type: 'SELECT', required: true, options: ['Silk', ' silk '] }],
    [{ key: 'fabric', label: '', type: 'BOOLEAN', required: true }],
    [{ key: 'fabric', label: 'Fabric', type: 'BOOLEAN', required: 'true' }],
    [{ key: 'fabric', label: 'Fabric', type: 'TEXT', required: true }],
    [values.specificationTemplate.fields[0], { ...values.specificationTemplate.fields[1], key: 'fabric' }],
  ];
  for (const fields of invalid) assert.ok(validateEcommerceSubcategory({ ...values, specificationTemplate: { fields } }).specificationTemplate);
});

test('category options follow all pages, remove duplicates and reject pagination that makes no progress', async () => {
  const pages = [];
  const all = await fetchAllEcommerceCategories({ get: async (_, { params }) => {
    pages.push(params.page);
    return { data: { data: { categories: params.page === 1 ? [{ id: 'one', name: 'First' }] : [{ id: 'one', name: 'First' }, { id: 'two', name: 'Second' }], pagination: { hasNextPage: params.page === 1 } } } };
  } });
  assert.deepEqual(pages, [1, 2]); assert.equal(all.length, 2);
  await assert.rejects(fetchAllEcommerceCategories({ get: async () => ({ data: { data: { categories: [{ id: 'one' }], pagination: { hasNextPage: true } } } }) }), /all category options/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchAllEcommerceCategories({ get: () => assert.fail('Cancelled options should not be sent') }, { signal: controller.signal }), /cancelled/);
});

test('all-subcategory requests omit categoryId and search matches parent names and specification labels', async () => {
  const calls = [];
  const client = { get: async (path, config) => { calls.push({ path, config }); return { data: { data: { subcategories: [] } } }; } };
  await fetchEcommerceSubcategories(client);
  await fetchEcommerceSubcategories(client, { categoryId: 'parent & one' });
  assert.equal(calls[0].path, '/admin/ecommerce/subcategories');
  assert.equal(calls[0].config.params, undefined);
  assert.deepEqual(calls[1].config.params, { categoryId: 'parent & one' });
  const rows = [{ name: 'Bridal Saree', categoryId: 'one', specificationTemplate: { fields: [{ label: 'Fabric' }] } }, { name: 'Gift Box', specificationTemplate: { fields: [null] } }];
  assert.deepEqual(filterEcommerceSubcategories(rows, 'fashion fabric', [{ id: 'one', name: 'Fashion' }]), [rows[0]]);
  await assert.rejects(fetchEcommerceSubcategories({ get: async () => ({ data: { data: {} } }) }), /invalid subcategory list/);
});

test('HTTP shows all parents by default, filters by parent and creates a typed subcategory', { skip: !baseURL }, async () => {
  const client = api();
  await client.post('/__reset', {}, { baseURL: baseURL.replace(/\/api\/v1$/, '') });
  const all = await fetchEcommerceSubcategories(client);
  assert.equal(all.items.length, 2);
  assert.equal(new Set(all.items.map((row) => row.categoryId)).size, 2);
  assert.equal((await fetchAllEcommerceCategories(client)).length, 25);
  const filtered = await fetchEcommerceSubcategories(client, { categoryId: 'category & one' });
  assert.equal(filtered.items.length, 1); assert.equal(filtered.items[0].name, 'Bridal Lehenga');
  const created = await createEcommerceSubcategory(client, { ...values, unrelated: 'ignored' });
  assert.equal(created.message, 'Subcategory created.');
  assert.deepEqual(created.subcategory.specificationTemplate, ecommerceSubcategoryPayload(values).specificationTemplate);
  const refreshed = await fetchEcommerceSubcategories(client, { categoryId: 'category & one' });
  assert.equal(refreshed.items.length, 2);
  assert.ok(refreshed.items.every((row) => row.categoryId === 'category & one'));
  assert.equal((await fetchEcommerceSubcategories(client, { categoryId: 'missing' })).items.length, 0);
  await assert.rejects(createEcommerceSubcategory(client, values), (error) => error.response.status === 409);
});

test('HTTP preserves auth, failure, malformed-envelope and cancellation errors', { skip: !baseURL }, async () => {
  const client = api();
  await assert.rejects(fetchEcommerceSubcategories(axios.create({ baseURL, proxy: false })), (error) => error.response.status === 401);
  await assert.rejects(fetchEcommerceSubcategories(client, { categoryId: 'denied' }), (error) => error.response.status === 403);
  await assert.rejects(fetchEcommerceSubcategories(client, { categoryId: 'unavailable' }), (error) => error.response.status === 503);
  client.defaults.headers['x-test-response'] = 'invalid';
  await assert.rejects(fetchEcommerceSubcategories(client), /invalid subcategory list/);
  delete client.defaults.headers['x-test-response'];
  await assert.rejects(createEcommerceSubcategory(client, { ...values, name: 'Unavailable' }), (error) => error.response.status === 503);
  await assert.rejects(createEcommerceSubcategory(client, { ...values, name: 'Rejected' }), /request rejected/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchEcommerceSubcategories(client, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
});
