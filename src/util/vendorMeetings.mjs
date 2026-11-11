const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
export const salesMeetingId = (row) => String(row?.salesMeetingId || row?.id || row?._id || '');
export const meetingError = (error) => error?.response?.data?.message || error?.message || 'Unable to load meetings. Please try again.';
export const meetingLabel = (value) => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
export function filterMeetingRows(rows, search) {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return rows;
  return rows.filter((row) => {
    const vendor = row.vendor || {};
    const profile = row.vendorProfile || vendor.vendorProfile || vendor.profile || vendor;
    const text = [row.status, row.vendorNote, row.vendorMessage, row.businessName, profile.businessName, vendor.name, vendor.email, vendor.phone, vendor.user?.name, vendor.user?.email, profile.businessEmail, profile.businessPhone, ...['requestedStartAt', 'requestedEndAt', 'scheduledStartAt', 'scheduledEndAt', 'createdAt'].flatMap((key) => [row[key], row[key] ? meetingDate(row[key]) : ''])].filter(Boolean).join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
export function meetingDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hourCycle: 'h23', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function meetingLink(meeting) {
  const value = meeting?.joinUrl || meeting?.meetingUrl || meeting?.meetingLink || meeting?.videoCallUrl;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function indiaDateTime(value = Date.now()) {
  return new Date(Number(value) + 330 * 60000).toISOString().slice(0, 16);
}
export function defaultMeetingTimes(now = Date.now()) {
  const start = Math.ceil((now + 15 * 60000) / (15 * 60000)) * 15 * 60000;
  return { start: indiaDateTime(start).slice(11), end: indiaDateTime(start + 30 * 60000).slice(11) };
}
export function meetingTimeDisabled(date, time, view, now = Date.now(), after) {
  const candidate = view === 'hours' ? `${time.slice(0, 2)}:59` : time;
  const timestamp = Date.parse(`${date}T${candidate}:00+05:30`);
  const afterTime = after ? Date.parse(`${after}:00+05:30`) : NaN;
  const lowerBound = Number.isFinite(afterTime) ? Math.max(now, afterTime) : now;
  return !Number.isFinite(timestamp) || timestamp <= lowerBound;
}
export function selectMeetingDates(current, date, part) {
  if (part === 'start' || !current.start || date < current.start) return { dates: { start: date, end: '' }, nextPart: 'end' };
  return { dates: { start: current.start, end: date }, nextPart: 'start' };
}
function validLocalDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(`${value}:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value;
}
export function validateMeetingRequest(values, now = Date.now()) {
  const errors = {};
  const start = values.requestedStartAt, end = values.requestedEndAt;
  if (!validLocalDateTime(start)) errors.requestedStartAt = 'Choose a valid start date and time.';
  else if (Date.parse(`${start}:00+05:30`) <= now) errors.requestedStartAt = 'Choose a future start date and time.';
  if (!validLocalDateTime(end)) errors.requestedEndAt = 'Choose a valid end date and time.';
  else if (validLocalDateTime(start) && Date.parse(`${end}:00+05:30`) <= Date.parse(`${start}:00+05:30`)) errors.requestedEndAt = 'End time must be after the start time.';
  if (typeof values.vendorNote !== 'string' || !values.vendorNote.trim()) errors.vendorNote = 'Enter a meeting note.';
  return errors;
}
export function meetingRequestPayload(values, now = Date.now()) {
  const errors = validateMeetingRequest(values, now);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return { requestedStartAt: `${values.requestedStartAt}:00+05:30`, requestedEndAt: `${values.requestedEndAt}:00+05:30`, vendorNote: values.vendorNote.trim() };
}
function unwrap(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The meeting request failed.');
  return body && Object.hasOwn(body, 'data') ? body.data : body;
}
export function meetingSuccessMessage(body) {
  return [body?.message, body?.data?.message].find((message) => typeof message === 'string' && message.trim()) || 'Your meeting request has been sent.';
}
export async function requestSalesMeeting(api, values, signal) {
  const response = await api.post('/vendor/sales-meetings', meetingRequestPayload(values), { signal });
  const data = unwrap(response);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('epic-vendor-meetings-change'));
  return { data, message: meetingSuccessMessage(response.data) };
}
export async function fetchSalesMeetings(api, { page = 1, limit = 20, signal } = {}) {
  const response = await api.get('/vendor/sales-meetings', { params: { page, limit }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.salesMeetings ?? data?.meetings ?? data?.items ?? data?.results;
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid meeting list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? data ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems ?? data?.total;
  const total = count != null && Number.isFinite(Number(count)) && Number(count) >= 0 ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : typeof meta.hasNext === 'boolean' ? meta.hasNext : total >= 0 ? page * limit < total : meta.totalPages ? page < Number(meta.totalPages) : items.length === limit;
  return { items, total, hasNext };
}
export async function fetchSalesMeeting(api, id, signal) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('A meeting ID is required.');
  const data = unwrap(await api.get(`/vendor/sales-meetings/${encodeURIComponent(id)}`, { signal }));
  const meeting = data?.salesMeeting ?? data?.meeting ?? data;
  if (!record(meeting) || !Object.keys(meeting).length) throw new Error('Meeting details are unavailable.');
  return meeting;
}
