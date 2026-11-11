import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { adminMeetingInputDate, adminMeetingScheduleDefaults, adminMeetingUpdatePayload, fetchAdminSalesMeeting, fetchAdminSalesMeetings, updateAdminSalesMeeting, validateAdminMeetingUpdate } from '../src/util/adminSalesMeetings.mjs';
import { indiaDateTime } from '../src/util/vendorMeetings.mjs';

const baseURL = process.env.ADMIN_MEETINGS_SIMULATION_URL;
const api = () => axios.create({ baseURL, headers: { Authorization: 'Bearer admin-sales-meeting-test-token' }, timeout: 3000, proxy: false });
const confirmation = { status: 'CONFIRMED', scheduledStartAt: '2027-02-10T10:00', scheduledEndAt: '2027-02-10T10:30', vendorMessage: ' Our sales specialist will explain plans and lead pricing. ', adminNote: ' Internal assignment: sales team A. ' };
const rejection = { status: 'REJECTED', vendorMessage: ' This requested time is unavailable. Please submit another preferred time. ', adminNote: ' Internal note only. ' };
const now = Date.parse('2026-11-06T00:00:00Z');
const future = () => ({ ...confirmation, scheduledStartAt: indiaDateTime(Date.now() + 86400000), scheduledEndAt: indiaDateTime(Date.now() + 88200000) });

test('confirmation starts near current India time with a submission margin and valid end', () => {
  const current = Date.parse('2026-11-06T17:17:00+05:30');
  const expired = adminMeetingScheduleDefaults({ requestedStartAt: '2026-11-06T16:30:00+05:30', requestedEndAt: '2026-11-12T17:00:00+05:30' }, current);
  assert.deepEqual(expired, { scheduledStartAt: '2026-11-06T17:19', scheduledEndAt: '2026-11-12T17:00' });
  assert.deepEqual(validateAdminMeetingUpdate({ ...confirmation, ...expired }, current), {});
  assert.deepEqual(adminMeetingScheduleDefaults({}, Date.parse('2026-11-06T23:59:30+05:30')), { scheduledStartAt: '2026-11-07T00:02', scheduledEndAt: '2026-11-07T00:32' });
  assert.deepEqual(adminMeetingScheduleDefaults({ requestedStartAt: `${confirmation.scheduledStartAt}:00+05:30`, requestedEndAt: `${confirmation.scheduledEndAt}:00+05:30` }, current), { scheduledStartAt: '2026-11-06T17:19', scheduledEndAt: confirmation.scheduledEndAt });
  assert.deepEqual(adminMeetingUpdatePayload({ ...confirmation, ...expired }, current), { status: 'CONFIRMED', scheduledStartAt: '2026-11-06T17:19:00+05:30', scheduledEndAt: '2026-11-12T17:00:00+05:30', vendorMessage: confirmation.vendorMessage.trim(), adminNote: confirmation.adminNote.trim() });
  assert.ok(validateAdminMeetingUpdate({ ...confirmation, ...expired }, Date.parse('2026-11-06T17:46:00+05:30')).scheduledStartAt);
  const rolledOver = adminMeetingScheduleDefaults({ scheduledStartAt: '2026-11-06T23:45:00+05:30', scheduledEndAt: '2026-11-07T00:00:00+05:30' }, Date.parse('2026-11-06T23:50:00+05:30'));
  assert.deepEqual(rolledOver, { scheduledStartAt: '2026-11-06T23:52', scheduledEndAt: '2026-11-07T00:00' });
});

test('confirmation and rejection use the exact supplied fields and preserve India time', () => {
  assert.deepEqual(adminMeetingUpdatePayload({ ...confirmation, ignored: true }, now), { status: 'CONFIRMED', scheduledStartAt: '2027-02-10T10:00:00+05:30', scheduledEndAt: '2027-02-10T10:30:00+05:30', vendorMessage: confirmation.vendorMessage.trim(), adminNote: confirmation.adminNote.trim() });
  assert.deepEqual(adminMeetingUpdatePayload({ ...rejection, scheduledStartAt: 'bad', scheduledEndAt: 'bad', ignored: true }, now), { status: 'REJECTED', vendorMessage: rejection.vendorMessage.trim(), adminNote: rejection.adminNote.trim() });
  assert.equal(adminMeetingInputDate('2027-02-10T04:30:00Z'), '2027-02-10T10:00');
  assert.equal(adminMeetingInputDate(null), '');
});

test('invalid confirmation schedules and IDs cannot be sent', async () => {
  for (const start of ['', '2027-02-30T10:00', '2026-01-01T10:00']) assert.ok(validateAdminMeetingUpdate({ ...confirmation, scheduledStartAt: start }, now).scheduledStartAt);
  assert.ok(validateAdminMeetingUpdate({ ...confirmation, scheduledEndAt: confirmation.scheduledStartAt }, now).scheduledEndAt);
  assert.ok(validateAdminMeetingUpdate({ ...confirmation, status: 'PENDING' }, now).status);
  await assert.rejects(updateAdminSalesMeeting({ patch: () => assert.fail('Invalid schedule must not be sent') }, 'meeting', { ...confirmation, scheduledEndAt: '' }), /end date/);
  await assert.rejects(updateAdminSalesMeeting({ patch: () => assert.fail('Expired schedule must not be sent') }, 'meeting', { ...confirmation, scheduledStartAt: '2020-01-01T10:00' }), /future/);
  await assert.rejects(fetchAdminSalesMeeting({ get: () => assert.fail('Invalid ID must not be sent') }, ''), /meeting ID/);
});

test('HTTP lists pending meetings, paginates, confirms and rejects with exact PATCH bodies', { skip: !baseURL }, async () => {
  const client = api();
  const first = await fetchAdminSalesMeetings(client);
  const second = await fetchAdminSalesMeetings(client, { page: 2 });
  assert.equal(first.total, 25); assert.equal(first.items.length, 20); assert.equal(first.hasNext, true);
  assert.equal(second.items.length, 5); assert.equal(second.hasNext, false);
  assert.ok(first.items.every((item) => item.status === 'PENDING'));
  const id = first.items[0].id;
  assert.equal(id, 'sales & one');
  assert.equal((await fetchAdminSalesMeeting(client, id)).vendor.businessName, 'Vendor 1');
  const values = future();
  assert.equal(await updateAdminSalesMeeting(client, id, { ...values, ignored: true }), 'Sales meeting confirmed.');
  const saved = await fetchAdminSalesMeeting(client, id);
  assert.equal(saved.status, 'CONFIRMED'); assert.equal(saved.scheduledStartAt, `${values.scheduledStartAt}:00+05:30`); assert.equal(saved.adminNote, values.adminNote.trim());
  assert.ok(!(await fetchAdminSalesMeetings(client)).items.some((item) => item.id === id));
  assert.equal((await fetchAdminSalesMeetings(client, { status: 'CONFIRMED' })).total, 1);
  const rejectedId = first.items[1].id;
  assert.equal(await updateAdminSalesMeeting(client, rejectedId, { ...rejection, scheduledStartAt: values.scheduledStartAt }), 'Sales meeting rejected.');
  const rejected = await fetchAdminSalesMeeting(client, rejectedId);
  assert.equal(rejected.status, 'REJECTED'); assert.equal(rejected.vendorMessage, rejection.vendorMessage.trim()); assert.equal(rejected.adminNote, rejection.adminNote.trim());
  assert.equal(rejected.scheduledStartAt, undefined);
  assert.equal((await fetchAdminSalesMeetings(client, { status: 'REJECTED' })).total, 1);
  assert.equal((await fetchAdminSalesMeetings(client, { status: '' })).total, 25);
  assert.deepEqual((await fetchAdminSalesMeetings(client, { page: 99 })).items, []);
});

test('HTTP permissions, conflicts, malformed responses and failures remain errors', { skip: !baseURL }, async () => {
  const client = api();
  await assert.rejects(fetchAdminSalesMeetings(axios.create({ baseURL, proxy: false })), (error) => error.response.status === 401);
  await assert.rejects(fetchAdminSalesMeeting(client, 'denied'), (error) => error.response.status === 403);
  await assert.rejects(fetchAdminSalesMeeting(client, 'missing'), (error) => error.response.status === 404);
  await assert.rejects(fetchAdminSalesMeeting(client, 'invalid'), /unavailable/);
  await assert.rejects(fetchAdminSalesMeetings(client, { status: 'INVALID' }), /invalid sales meeting list/);
  await assert.rejects(updateAdminSalesMeeting(client, 'sales-3', { ...future(), vendorMessage: 'conflict' }), (error) => error.response.status === 409);
  await assert.rejects(updateAdminSalesMeeting(client, 'sales-3', { ...rejection, vendorMessage: 'unavailable' }), (error) => error.response.status === 503);
  await assert.rejects(updateAdminSalesMeeting(client, 'sales-3', { ...rejection, vendorMessage: 'rejected' }), /rejected/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchAdminSalesMeetings(client, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  await assert.rejects(updateAdminSalesMeeting(client, 'sales-3', future(), controller.signal), (error) => error.code === 'ERR_CANCELED');
});
