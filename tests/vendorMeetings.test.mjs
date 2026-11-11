import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { defaultMeetingTimes, fetchSalesMeeting, fetchSalesMeetings, indiaDateTime, meetingDate, meetingLink, meetingRequestPayload, meetingSuccessMessage, meetingTimeDisabled, requestSalesMeeting, selectMeetingDates, validateMeetingRequest } from '../src/util/vendorMeetings.mjs';

const baseURL = process.env.VENDOR_MEETINGS_SIMULATION_URL;
const api = () => axios.create({ baseURL, headers: { Authorization: 'Bearer vendor-meeting-test-token' }, timeout: 3000, proxy: false });
const values = { requestedStartAt: '2027-02-10T10:00', requestedEndAt: '2027-02-10T10:30', vendorNote: ' Please explain subscription plans and lead pricing. ' };
const now = Date.parse('2026-11-06T00:00:00Z');
const future = () => ({ requestedStartAt: indiaDateTime(Date.now() + 86400000), requestedEndAt: indiaDateTime(Date.now() + 88200000), vendorNote: 'Discuss plans' });

test('afternoon requests default to future India times and disable past dropdown choices', () => {
  const afternoon = Date.parse('2026-11-06T10:12:30Z'); // 15:42:30 in India.
  const times = defaultMeetingTimes(afternoon);
  assert.deepEqual(times, { start: '16:00', end: '16:30' });
  assert.deepEqual(validateMeetingRequest({ requestedStartAt: `2026-11-06T${times.start}`, requestedEndAt: `2026-11-06T${times.end}`, vendorNote: 'Discuss plans' }, afternoon), {});
  assert.equal(meetingTimeDisabled('2026-11-06', '10:00', 'hours', afternoon), true);
  assert.equal(meetingTimeDisabled('2026-11-06', '15:00', 'hours', afternoon), false);
  assert.equal(meetingTimeDisabled('2026-11-06', '15:42', 'minutes', afternoon), true);
  assert.equal(meetingTimeDisabled('2026-11-06', '15:43', 'minutes', afternoon), false);
  assert.equal(meetingTimeDisabled('2026-11-07', '10:00', 'minutes', afternoon), false);
  assert.equal(meetingTimeDisabled('2026-11-06', '16:00', 'minutes', afternoon, '2026-11-06T16:00'), true);
  assert.equal(meetingTimeDisabled('2026-11-06', '16:01', 'minutes', afternoon, '2026-11-06T16:00'), false);
  assert.equal(meetingTimeDisabled('2026-11-07', '00:01', 'minutes', afternoon, '2026-11-06T23:45'), false);
});

test('success message preserves actual API text from the response envelope', () => {
  assert.equal(meetingSuccessMessage({ message: 'Sales meeting created successfully.', data: { message: 'Nested message' } }), 'Sales meeting created successfully.');
  assert.equal(meetingSuccessMessage({ data: { message: 'Your requested slot has been received.' } }), 'Your requested slot has been received.');
  assert.equal(meetingSuccessMessage({ message: '  ', data: { message: 'Meeting requested.' } }), 'Meeting requested.');
  assert.equal(meetingSuccessMessage({ message: { invalid: true } }), 'Your meeting request has been sent.');
});

test('meeting notes are required and whitespace-only notes are never submitted', async () => {
  for (const vendorNote of ['', '   \n\t', null, undefined]) {
    assert.equal(validateMeetingRequest({ ...values, vendorNote }, now).vendorNote, 'Enter a meeting note.');
    await assert.rejects(requestSalesMeeting({ post: () => assert.fail('An empty note must not be submitted') }, { ...future(), vendorNote }), /meeting note/);
  }
  assert.equal(meetingRequestPayload({ ...values, vendorNote: '  Explain lead pricing.  ' }, now).vendorNote, 'Explain lead pricing.');
});

test('one calendar selects range endpoints, supports same-day meetings and resets reversed ranges', () => {
  const start = selectMeetingDates({ start: '', end: '' }, '2027-02-10', 'start');
  assert.deepEqual(start, { dates: { start: '2027-02-10', end: '' }, nextPart: 'end' });
  assert.deepEqual(selectMeetingDates(start.dates, '2027-02-12', 'end'), { dates: { start: '2027-02-10', end: '2027-02-12' }, nextPart: 'start' });
  assert.equal(selectMeetingDates(start.dates, '2027-02-10', 'end').dates.end, '2027-02-10');
  assert.deepEqual(selectMeetingDates(start.dates, '2027-02-09', 'end'), { dates: { start: '2027-02-09', end: '' }, nextPart: 'end' });
  assert.deepEqual(selectMeetingDates({ start: '2027-02-10', end: '2027-02-12' }, '2027-03-01', 'start'), { dates: { start: '2027-03-01', end: '' }, nextPart: 'end' });
});

test('request dates use explicit India offset and exactly the supplied payload fields', () => {
  assert.deepEqual(meetingRequestPayload({ ...values, ignored: true }, now), {
    requestedStartAt: '2027-02-10T10:00:00+05:30', requestedEndAt: '2027-02-10T10:30:00+05:30', vendorNote: 'Please explain subscription plans and lead pricing.',
  });
  assert.equal(Date.parse(meetingRequestPayload(values, now).requestedStartAt), Date.parse('2027-02-10T04:30:00Z'));
  assert.equal(indiaDateTime(Date.parse('2027-02-09T20:00:00Z')), '2027-02-10T01:30');
  assert.deepEqual(validateMeetingRequest({ ...values, requestedStartAt: '2027-02-10T23:45', requestedEndAt: '2027-02-11T00:15' }, now), {});
  assert.match(meetingDate('2027-02-10T04:30:00Z'), /10:00/);
});

test('invalid dates, past starts and reversed or empty ranges are blocked', async () => {
  for (const start of ['', '2027-02-30T10:00', '2027-13-01T10:00', '2027-02-10T25:00', '2026-01-01T10:00']) assert.ok(validateMeetingRequest({ ...values, requestedStartAt: start }, now).requestedStartAt);
  for (const end of ['', values.requestedStartAt, '2027-02-09T10:00', '2027-02-30T10:00']) assert.ok(validateMeetingRequest({ ...values, requestedEndAt: end }, now).requestedEndAt);
  await assert.rejects(requestSalesMeeting({ post: () => assert.fail('Invalid ranges must not be sent') }, { ...values, requestedEndAt: '' }), /end date/);
  await assert.rejects(fetchSalesMeeting({ get: () => assert.fail('Invalid ID must not be sent') }, ''), /meeting ID/);
});

test('only valid secure meeting links are shown', () => {
  assert.equal(meetingLink({ meetingUrl: 'https://meet.example.test/room' }), 'https://meet.example.test/room');
  for (const meetingUrl of ['javascript:alert(1)', 'http://example.test', 'https://name:password@example.test', '/room', 'not-a-url']) assert.equal(meetingLink({ meetingUrl }), '');
  assert.equal(meetingLink({}), '');
});

test('meeting displays always use 24-hour India time including midnight', () => {
  assert.match(meetingDate('2027-02-10T10:00:00Z'), /15:30/);
  assert.match(meetingDate('2027-02-09T18:30:00Z'), /00:00/);
  assert.doesNotMatch(meetingDate('2027-02-10T10:00:00Z'), /\b(?:am|pm)\b/i);
});

test('authenticated HTTP paginates, reads encoded IDs and creates a retrievable meeting', { skip: !baseURL }, async () => {
  const client = api();
  const first = await fetchSalesMeetings(client);
  const second = await fetchSalesMeetings(client, { page: 2 });
  assert.equal(first.items.length, 20); assert.equal(first.total, 25); assert.equal(first.hasNext, true);
  assert.equal(second.items.length, 5); assert.equal(second.hasNext, false);
  assert.equal(first.items[0].id, 'meeting & one');
  assert.equal((await fetchSalesMeeting(client, 'meeting & one')).meetingUrl, 'https://meet.example.test/sales-1');
  const requested = future();
  const created = await requestSalesMeeting(client, { ...requested, ignored: 'not sent' });
  assert.match(created.message, /sent/);
  const detail = await fetchSalesMeeting(client, created.data.salesMeeting.id);
  assert.equal(detail.vendorNote, requested.vendorNote); assert.equal(detail.requestedStartAt, `${requested.requestedStartAt}:00+05:30`);
  assert.equal((await fetchSalesMeetings(client)).total, 26);
  assert.equal((await fetchSalesMeetings(client, { page: 99 })).items.length, 0);
});

test('HTTP rejects conflict, service failures, invalid details, missing records and cancellation', { skip: !baseURL }, async () => {
  const client = api();
  await assert.rejects(requestSalesMeeting(client, { ...future(), vendorNote: 'conflict' }), (error) => error.response.status === 409);
  await assert.rejects(requestSalesMeeting(client, { ...future(), vendorNote: 'unavailable' }), (error) => error.response.status === 503);
  await assert.rejects(requestSalesMeeting(client, { ...future(), vendorNote: 'rejected' }), /rejected/);
  await assert.rejects(fetchSalesMeeting(client, 'denied'), (error) => error.response.status === 403);
  await assert.rejects(fetchSalesMeeting(client, 'missing'), (error) => error.response.status === 404);
  await assert.rejects(fetchSalesMeeting(client, 'unavailable'), (error) => error.response.status === 503);
  await assert.rejects(fetchSalesMeeting(client, 'invalid'), /unavailable/);
  await assert.rejects(fetchSalesMeetings(axios.create({ baseURL, proxy: false })), (error) => error.response.status === 401);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchSalesMeetings(client, { signal: controller.signal }), (error) => error.code === 'ERR_CANCELED');
  await assert.rejects(requestSalesMeeting(client, future(), controller.signal), (error) => error.code === 'ERR_CANCELED');
});
