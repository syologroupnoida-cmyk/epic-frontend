import { indiaDateTime } from './vendorMeetings.mjs';

export const adminMeetingStatuses = ['PENDING', 'CONFIRMED', 'REJECTED'];
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
function unwrap(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The sales meeting request failed.');
  return body && Object.hasOwn(body, 'data') ? body.data : body;
}
function detailPath(id) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('A sales meeting ID is required.');
  return `/admin/sales-meetings/${encodeURIComponent(id)}`;
}
export function adminMeetingInputDate(value) {
  if (!value) return '';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? indiaDateTime(timestamp) : '';
}
export function adminMeetingScheduleDefaults(meeting, now = Date.now()) {
  const endValue = meeting.scheduledEndAt || meeting.requestedEndAt;
  // Keep the initial time close to now, with a margin for filling and sending the form.
  const start = Math.ceil((now + 2 * 60000) / 60000) * 60000;
  const parsedEnd = Date.parse(endValue);
  const end = Number.isFinite(parsedEnd) && parsedEnd > start ? parsedEnd : start + 30 * 60000;
  return { scheduledStartAt: indiaDateTime(start), scheduledEndAt: indiaDateTime(end) };
}
export function salesMeetingVendor(meeting) {
  const vendor = meeting?.vendor || {};
  const profile = meeting?.vendorProfile || vendor.vendorProfile || vendor.profile || vendor;
  return { name: profile.businessName || meeting?.businessName || vendor.name || vendor.user?.name || 'Vendor', email: vendor.email || vendor.user?.email || profile.businessEmail || '', phone: profile.businessPhone || vendor.phone || vendor.user?.phone || '' };
}
export async function fetchAdminSalesMeetings(api, { page = 1, limit = 20, status = 'PENDING', signal } = {}) {
  const response = await api.get('/admin/sales-meetings', { params: { page, limit, ...(status ? { status } : {}) }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.salesMeetings ?? data?.meetings ?? data?.items ?? data?.results;
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid sales meeting list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? data ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems ?? data?.total;
  const total = count != null && Number.isFinite(Number(count)) && Number(count) >= 0 ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : typeof meta.hasNext === 'boolean' ? meta.hasNext : total >= 0 ? page * limit < total : meta.totalPages ? page < Number(meta.totalPages) : items.length === limit;
  return { items, total, hasNext };
}
export async function fetchAdminSalesMeeting(api, id, signal) {
  const data = unwrap(await api.get(detailPath(id), { signal }));
  const meeting = data?.salesMeeting ?? data?.meeting ?? data;
  if (!record(meeting) || !Object.keys(meeting).length) throw new Error('Sales meeting details are unavailable.');
  return meeting;
}
function validDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(`${value}:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value;
}
export function validateAdminMeetingUpdate(values, now = Date.now()) {
  const errors = {};
  if (!['CONFIRMED', 'REJECTED'].includes(values.status)) errors.status = 'Choose Confirm or Reject.';
  if (typeof values.vendorMessage !== 'string') errors.vendorMessage = 'Enter a valid vendor message.';
  if (typeof values.adminNote !== 'string') errors.adminNote = 'Enter a valid admin note.';
  if (values.status === 'CONFIRMED') {
    if (!validDateTime(values.scheduledStartAt)) errors.scheduledStartAt = 'Choose a valid scheduled start date and time.';
    else if (Date.parse(`${values.scheduledStartAt}:00+05:30`) <= now) errors.scheduledStartAt = 'Choose a future scheduled start date and time.';
    if (!validDateTime(values.scheduledEndAt)) errors.scheduledEndAt = 'Choose a valid scheduled end date and time.';
    else if (validDateTime(values.scheduledStartAt) && Date.parse(`${values.scheduledEndAt}:00+05:30`) <= Date.parse(`${values.scheduledStartAt}:00+05:30`)) errors.scheduledEndAt = 'Scheduled end must be after the start.';
  }
  return errors;
}
export function adminMeetingUpdatePayload(values, now = Date.now()) {
  const errors = validateAdminMeetingUpdate(values, now);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return {
    status: values.status,
    ...(values.status === 'CONFIRMED' ? { scheduledStartAt: `${values.scheduledStartAt}:00+05:30`, scheduledEndAt: `${values.scheduledEndAt}:00+05:30` } : {}),
    vendorMessage: values.vendorMessage.trim(), adminNote: values.adminNote.trim(),
  };
}
export async function updateAdminSalesMeeting(api, id, values, signal) {
  const response = await api.patch(detailPath(id), adminMeetingUpdatePayload(values), { signal });
  unwrap(response);
  return [response.data?.message, response.data?.data?.message].find((message) => typeof message === 'string' && message.trim()) || 'Sales meeting updated successfully.';
}
