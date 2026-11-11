import { API_BASE_URL } from './apiBaseUrl.mjs';

export const contactStatuses = ['NEW', 'IN_PROGRESS'];
export const contactMessageId = (message) => String(message?.id || message?._id || message?.contactMessageId || '');
export const contactLabel = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
export const contactError = (error) => error?.response?.data?.message || error?.message || 'Unable to complete the request. Please try again.';

export function contactPayload(values) {
  return Object.fromEntries(['name', 'email', 'phone', 'userType', 'subject', 'message', 'website'].map((key) => [key, String(values[key] ?? (key === 'userType' ? 'CLIENT' : '')).trim()]));
}

export async function submitContactEnquiry(values, { signal, baseURL = API_BASE_URL, fetcher = fetch } = {}) {
  const response = await fetcher(`${baseURL}/contact-us`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactPayload(values)), signal });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success === false) throw new Error(result?.message || 'Unable to submit your enquiry. Please try again.');
  return result?.message || 'Thank you. Your enquiry has been submitted.';
}

function unwrap(response) {
  const payload = response?.data;
  if (payload?.success === false) throw new Error(payload.message || 'Unable to complete the contact message request.');
  return payload?.data ?? payload;
}

export async function fetchContactMessages(api, { page = 1, limit = 20, status = '', signal } = {}) {
  const response = await api.get('/admin/contact-messages', { params: { page, limit, ...(status ? { status } : {}) }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.contactMessages ?? data?.messages ?? data?.items ?? data?.results;
  if (!Array.isArray(items) || items.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) throw new Error('The server returned an invalid contact message list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? response.data?.meta ?? data ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems ?? data?.total;
  const total = count != null && Number.isFinite(Number(count)) && Number(count) >= 0 ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : typeof meta.hasNext === 'boolean' ? meta.hasNext : total >= 0 ? page * limit < total : meta.totalPages ? page < Number(meta.totalPages) : items.length === limit;
  return { items, total, hasNext };
}

export async function fetchContactMessage(api, id, signal) {
  if (!id?.trim()) throw new Error('A contact message is required.');
  const data = unwrap(await api.get(`/admin/contact-messages/${encodeURIComponent(id)}`, { signal }));
  const message = data?.contactMessage ?? (data?.message && typeof data.message === 'object' ? data.message : data);
  if (!message || typeof message !== 'object' || Array.isArray(message) || !Object.keys(message).length) throw new Error('Contact message details are unavailable.');
  return message;
}

export async function updateContactMessage(api, id, values, signal) {
  if (!id?.trim()) throw new Error('A contact message is required.');
  if (!values.status || typeof values.adminNote !== 'string') throw new Error('Select a status and enter a valid note.');
  const response = await api.patch(`/admin/contact-messages/${encodeURIComponent(id)}`, { status: values.status, adminNote: values.adminNote.trim() }, { signal });
  unwrap(response);
  return response.data?.message || 'Contact message updated successfully.';
}
