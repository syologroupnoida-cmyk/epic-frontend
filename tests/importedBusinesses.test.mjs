import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { businessText, fetchBusinessImportBatches, fetchImportedBusiness, fetchImportedBusinesses, updateImportedBusiness } from '../src/util/importedBusinesses.mjs';

const baseURL = process.env.IMPORTED_BUSINESSES_SIMULATION_URL;
const client = () => axios.create({ baseURL, headers: { Authorization: 'Bearer imported-admin-test-token' }, timeout: 3000, proxy: false });

test('invalid IDs and updates are rejected before any request', async () => {
  const api = { get: () => assert.fail('Unexpected GET'), patch: () => assert.fail('Unexpected PATCH') };
  await assert.rejects(fetchImportedBusiness(api, ''), /business ID/);
  await assert.rejects(updateImportedBusiness(api, 'business-1', { status: '', salesNote: 'note' }), /status/);
  await assert.rejects(updateImportedBusiness(api, 'business-1', { status: 'CONTACTED', salesNote: null }), /note/);
  assert.equal(businessText(0), '0'); assert.equal(businessText(false), 'false');
});

test('authenticated HTTP filters, paginates, reads by encoded ID and updates only the supplied fields', { skip: !baseURL }, async () => {
  const api = client();
  const first = await fetchImportedBusinesses(api, { status: 'NEW' });
  const second = await fetchImportedBusinesses(api, { status: 'NEW', page: 2 });
  assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  assert.equal(second.items.length, 5); assert.equal(second.hasNext, false);
  assert.equal(new Set([...first.items, ...second.items].map((row) => row.id)).size, 25);
  const id = first.items[0].id;
  assert.equal(id, 'business & one');
  assert.equal((await fetchImportedBusiness(api, id)).reviewCount, 0);
  assert.match(await updateImportedBusiness(api, id, { status: 'CONTACTED', salesNote: ' Sales team called the business. ', ignored: 'must not be sent' }), /updated/);
  const updated = await fetchImportedBusiness(api, id);
  assert.equal(updated.status, 'CONTACTED'); assert.equal(updated.salesNote, 'Sales team called the business.');
  assert.ok(!(await fetchImportedBusinesses(api, { status: 'NEW' })).items.some((row) => row.id === id));
  assert.equal((await fetchImportedBusinesses(api, { status: 'CONTACTED' })).total, 1);
  assert.equal((await fetchImportedBusinesses(api)).total, 25);
  await updateImportedBusiness(api, id, { status: 'NEW', salesNote: '' });
  assert.equal((await fetchImportedBusiness(api, id)).salesNote, '');
  assert.equal((await fetchImportedBusinesses(api, { status: 'CONTACTED' })).total, 0);
});

test('batch list has its own pagination and never sends business-only filters', { skip: !baseURL }, async () => {
  const first = await fetchBusinessImportBatches(client(), { status: 'NEW' });
  assert.equal(first.items.length, 20); assert.equal(first.total, 23); assert.equal(first.hasNext, true);
  const second = await fetchBusinessImportBatches(client(), { page: 2 });
  assert.equal(second.items.length, 3); assert.equal(second.hasNext, false);
  assert.equal(first.items[0].failedCount, 0);
});

test('search is trimmed and applied before pagination for businesses and batches', { skip: !baseURL }, async () => {
  const api = client();
  const business = await fetchImportedBusinesses(api, { status: 'NEW', search: ' Imported Business 25 ' });
  assert.equal(business.total, 1); assert.equal(business.items[0].businessName, 'Imported Business 25'); assert.equal(business.hasNext, false);
  const batch = await fetchBusinessImportBatches(api, { search: ' import-23.csv ' });
  assert.equal(batch.total, 1); assert.equal(batch.items[0].fileName, 'import-23.csv');
  const empty = await fetchImportedBusinesses(api, { search: 'no-such-business' });
  assert.deepEqual(empty.items, []); assert.equal(empty.total, 0);
  assert.equal((await fetchImportedBusinesses(api, { search: '   ' })).total, 25);
  assert.equal((await fetchBusinessImportBatches(api, { search: '' })).total, 23);
});

test('HTTP failures, rejected envelopes, invalid data and cancellation remain failures', { skip: !baseURL }, async () => {
  const api = client();
  await assert.rejects(fetchImportedBusiness(api, 'missing'), (error) => error.response.status === 404);
  await assert.rejects(fetchImportedBusiness(api, 'denied'), (error) => error.response.status === 403);
  await assert.rejects(fetchImportedBusinesses(api, { status: 'UNAVAILABLE' }), (error) => error.response.status === 503);
  await assert.rejects(fetchImportedBusinesses(api, { status: 'INVALID' }), /invalid business list/);
  await assert.rejects(fetchImportedBusiness(api, 'invalid'), /unavailable/);
  await assert.rejects(updateImportedBusiness(api, 'rejected', { status: 'CONTACTED', salesNote: 'note' }), /rejected/);
  await assert.rejects(updateImportedBusiness(api, 'unavailable', { status: 'CONTACTED', salesNote: 'note' }), (error) => error.response.status === 503);
  await assert.rejects(fetchImportedBusinesses(axios.create({ baseURL, proxy: false })), (error) => error.response.status === 401);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchImportedBusinesses(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  await assert.rejects(fetchBusinessImportBatches(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
});
