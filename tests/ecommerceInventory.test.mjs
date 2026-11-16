import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { fetchEcommerceInventory, fetchEcommerceInventoryMovements, inventoryAvailable, inventoryDate, inventoryNumber, inventoryProductTitle, inventoryReserved, inventoryThreshold, inventorySettingsPayload, updateEcommerceInventorySettings, inventoryVariantId } from '../src/util/ecommerceInventory.mjs';

test('inventory presentation preserves zero, resolves nested variants and does not invent unknown stock', () => {
  const row = { variantId: 'variant & one', variant: { sku: 'LEH-RED-M', product: { title: 'Royal Lehenga' } }, inventory: { availableStock: 0, reservedQuantity: 2 } };
  assert.equal(inventoryVariantId(row), 'variant & one'); assert.equal(inventoryProductTitle(row), 'Royal Lehenga');
  assert.equal(inventoryNumber(inventoryAvailable(row)), '0'); assert.equal(inventoryNumber(inventoryReserved(row)), '2');
  assert.equal(inventoryNumber(inventoryAvailable({})), '—'); assert.equal(inventoryVariantId({ id: 'inventory-record-only' }), '');
  assert.equal(inventoryDate('invalid-date'), '—');
  const noRequest = { get: () => assert.fail('Invalid inputs must not request.') };
  assert.throws(() => fetchEcommerceInventoryMovements(noRequest, { variantId: '' }), /variant/);
  assert.throws(() => fetchEcommerceInventory(noRequest, { page: 0 }), /pagination/);
});

test('inventory response parsing supports returned wrappers and rejects malformed rows', async () => {
  for (const data of [{ inventory: [{ variantId: 'one' }], pagination: { total: 21 } }, { variants: [{ id: 'one', sku: 'SKU' }], pagination: { hasNextPage: true } }]) {
    const result = await fetchEcommerceInventory({ get: async () => ({ data: { success: true, data } }) });
    assert.equal(result.items.length, 1); assert.equal(result.hasNext, true);
  }
  await assert.rejects(fetchEcommerceInventory({ get: async () => ({ data: { success: true, data: { inventory: [null] } } }) }), /invalid inventory list/);
});

const baseURL = process.env.ECOMMERCE_INVENTORY_SIMULATION_URL;
test('HTTP inventory and low-stock pagination use the supplied queries; movement history is variant-scoped', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-product-test-token' } });
  const first = await fetchEcommerceInventory(api); assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  const second = await fetchEcommerceInventory(api, { page: 2 }); assert.equal(second.items.length, 5); assert.equal(second.hasNext, false);
  const low = await fetchEcommerceInventory(api, { lowStockOnly: true }); assert.equal(low.total, 5); assert.ok(low.items.every((row) => row.availableStock === 0));
  const variantId = inventoryVariantId(first.items[0]);
  const movements = await fetchEcommerceInventoryMovements(api, { variantId }); assert.equal(movements.items.length, 20); assert.equal(movements.total, 25);
  assert.ok(movements.items.every((row) => row.variantId === variantId)); assert.equal(movements.items[0].stockBefore, 0);
  assert.equal((await fetchEcommerceInventoryMovements(api, { variantId, page: 2 })).items.length, 5);
  assert.equal((await fetchEcommerceInventoryMovements(api, { variantId: inventoryVariantId(first.items[1]) })).items.length, 0);
  for (const [id, status] of [['missing', 404], ['denied', 403]]) await assert.rejects(fetchEcommerceInventoryMovements(api, { variantId: id }), (error) => error.response.status === status);
  api.defaults.headers['x-test-inventory'] = 'invalid'; await assert.rejects(fetchEcommerceInventory(api), /invalid inventory list/);
  api.defaults.headers['x-test-inventory'] = 'rejected'; await assert.rejects(fetchEcommerceInventory(api), /request rejected/);
  api.defaults.headers['x-test-inventory'] = 'unavailable'; await assert.rejects(fetchEcommerceInventory(api), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-inventory'];
  await assert.rejects(fetchEcommerceInventory(axios.create({ baseURL, proxy: false })), (error) => error.response.status === 401);
  const controller = new AbortController(); controller.abort(); await assert.rejects(fetchEcommerceInventory(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
});


test('threshold payload preserves zero, excludes other fields and rejects invalid values', async () => {
  assert.deepEqual(inventorySettingsPayload({ lowStockThreshold: '3', quantity: 100 }), { lowStockThreshold: 3 });
  assert.deepEqual(inventorySettingsPayload({ lowStockThreshold: 0 }), { lowStockThreshold: 0 });
  assert.equal(inventoryThreshold({ variant: { lowStockThreshold: 0 } }), 0);
  for (const value of ['', ' ', null, true, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => inventorySettingsPayload({ lowStockThreshold: value }));
  await assert.rejects(updateEcommerceInventorySettings({ patch: () => assert.fail('Must not request') }, '', { lowStockThreshold: 3 }), /variant ID/);
});

test('HTTP saves only the selected variant threshold and refreshes low-stock membership', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, proxy: false, timeout: 3000, headers: { Authorization: 'Bearer ecommerce-product-test-token' } });
  const rows = (await fetchEcommerceInventory(api)).items;
  const variantId = inventoryVariantId(rows[1]);
  await updateEcommerceInventorySettings(api, variantId, { lowStockThreshold: '20', isActive: false, quantity: 0 });
  const updated = (await fetchEcommerceInventory(api)).items.find((row) => inventoryVariantId(row) === variantId);
  assert.equal(updated.lowStockThreshold, 20); assert.equal(updated.availableStock, 10);
  assert.equal((await fetchEcommerceInventory(api)).items[0].lowStockThreshold, 3);
  assert.ok((await fetchEcommerceInventory(api, { lowStockOnly: true })).items.some((row) => inventoryVariantId(row) === variantId));
  api.defaults.headers['x-test-inventory'] = 'unavailable';
  await assert.rejects(updateEcommerceInventorySettings(api, variantId, { lowStockThreshold: 0 }), (error) => error.response.status === 503);
  delete api.defaults.headers['x-test-inventory'];
  assert.equal((await fetchEcommerceInventory(api)).items[1].lowStockThreshold, 20);
  await updateEcommerceInventorySettings(api, variantId, { lowStockThreshold: 0 });
  assert.equal((await fetchEcommerceInventory(api)).items[1].lowStockThreshold, 0);
  assert.ok(!(await fetchEcommerceInventory(api, { lowStockOnly: true })).items.some((row) => inventoryVariantId(row) === variantId));
  await assert.rejects(updateEcommerceInventorySettings(api, 'missing', { lowStockThreshold: 3 }), (error) => error.response.status === 404);
});
