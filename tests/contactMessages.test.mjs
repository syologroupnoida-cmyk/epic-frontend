import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { contactPayload, fetchContactMessages, fetchContactMessage, submitContactEnquiry, updateContactMessage } from '../src/util/contactMessages.mjs';

const baseURL = process.env.CONTACT_SIMULATION_URL;
const values = { name: ' Rahul Sharma ', email: 'rahul@example.test', phone: '9876543210', userType: 'CLIENT', subject: 'Need help with an enquiry', message: 'I need help finding a wedding planning vendor.', website: '', ignored: 'never sent' };

test('contact payload preserves exactly the seven supplied fields', () => {
  const payload = contactPayload(values);
  assert.equal(payload.name, 'Rahul Sharma');
  assert.deepEqual(Object.keys(payload).sort(), ['email', 'message', 'name', 'phone', 'subject', 'userType', 'website']);
  assert.equal(contactPayload({}).userType, 'CLIENT');
});

test('real HTTP submits contact, lists all/new, paginates, retrieves and updates a message', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, headers: { Authorization: 'Bearer contact-admin-token' }, timeout: 3000 });
  assert.match(await submitContactEnquiry(values, { baseURL }), /submitted/);
  const all = await fetchContactMessages(api);
  assert.equal(all.items.length, 20); assert.equal(all.hasNext, true);
  assert.ok(all.items.some((message) => message.status === 'IN_PROGRESS'));
  const page2 = await fetchContactMessages(api, { page: 2 });
  assert.equal(page2.items.length, all.total - 20); assert.equal(page2.hasNext, false);
  const fresh = await fetchContactMessages(api, { status: 'NEW' });
  assert.ok(fresh.items.every((message) => message.status === 'NEW'));
  const id = all.items[0].id;
  assert.equal(id, 'message & one');
  const original = await fetchContactMessage(api, id);
  assert.equal(original.id, id);
  assert.match(await updateContactMessage(api, id, { status: 'IN_PROGRESS', adminNote: ' Called customer; following up. ' }), /updated/);
  const saved = await fetchContactMessage(api, id);
  assert.equal(saved.status, 'IN_PROGRESS'); assert.equal(saved.adminNote, 'Called customer; following up.');
  assert.ok(!(await fetchContactMessages(api, { status: 'NEW' })).items.some((message) => message.id === id));
  await updateContactMessage(api, id, { status: 'NEW', adminNote: '' });
  assert.equal((await fetchContactMessage(api, id)).adminNote, '');
  await updateContactMessage(api, id, { status: original.status, adminNote: original.adminNote });
});

test('real HTTP propagates backend failures, permission errors and cancellation', { skip: !baseURL }, async () => {
  const api = axios.create({ baseURL, headers: { Authorization: 'Bearer contact-admin-token' }, timeout: 3000 });
  await assert.rejects(submitContactEnquiry({ ...values, subject: 'simulate-failure' }, { baseURL }), /unavailable/);
  await assert.rejects(fetchContactMessage(api, 'missing'), (error) => error.response.status === 404);
  await assert.rejects(updateContactMessage(api, 'denied', { status: 'IN_PROGRESS', adminNote: 'Test' }), /denied/);
  await assert.rejects(updateContactMessage(api, 'unavailable', { status: 'IN_PROGRESS', adminNote: 'Test' }), (error) => error.response.status === 503);
  await assert.rejects(fetchContactMessages(axios.create({ baseURL })), (error) => error.response.status === 401);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchContactMessages(api, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
});
