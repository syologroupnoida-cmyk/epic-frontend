import { API_BASE_URL } from './apiBaseUrl.mjs';

export const enquiryPhoneInput = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 10);
export const enquiryPhoneInputProps = { inputMode: 'numeric', pattern: '[0-9]{10}', minLength: 10, maxLength: 10 };

export function enquiryDateToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function validateEnquiry(form, today, emailRequired) {
  const errors = {};
  if (!form.customerName?.trim()) errors.customerName = 'Enter your full name.';
  if (typeof form.customerPhone !== 'string' || !/^[0-9]{10}$/.test(form.customerPhone)) errors.customerPhone = 'Enter a 10-digit phone number.';
  if (emailRequired && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail?.trim() || '')) errors.customerEmail = 'Enter a valid email address.';
  const date = form.eventDate || '';
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < today) errors.eventDate = 'Choose today or a future event date.';
  if (!/^\d+$/.test(String(form.guestCount || '')) || !Number.isSafeInteger(Number(form.guestCount)) || Number(form.guestCount) < 1) errors.guestCount = 'Enter a guest count of at least 1.';
  if (!form.message?.trim()) errors.message = 'Tell the vendor what you need.';
  return errors;
}

export function validateVendorEnquiry(form, today = enquiryDateToday()) {
  return validateEnquiry(form, today, true);
}

export function validateServiceEnquiry(form, today = enquiryDateToday()) {
  return validateEnquiry(form, today, false);
}

export function sendVendorEnquiry(vendorSlug, form, options) {
  return sendEnquiry('vendors', vendorSlug, form, options);
}

export function sendServiceEnquiry(listingSlug, form, options) {
  return sendEnquiry('listings', listingSlug, form, options);
}

export function sendVenueEnquiry(venuePropertySlug, form, options) {
  return sendEnquiry('venue-properties', venuePropertySlug, form, options);
}

async function sendEnquiry(resource, slug, form, { signal } = {}) {
  const noEmail = resource !== 'vendors';
  const kind = resource === 'venue-properties' ? 'venue' : resource === 'listings' ? 'service' : 'vendor';
  if (!slug?.trim()) throw new Error(`This ${kind} is not available for enquiries.`);
  if (Object.keys(noEmail ? validateServiceEnquiry(form) : validateVendorEnquiry(form)).length) throw new Error('Please check the enquiry details.');
  const payload = {
    customerName: form.customerName.trim(),
    customerPhone: form.customerPhone,
    ...(!noEmail ? { customerEmail: form.customerEmail.trim() } : {}),
    eventDate: form.eventDate,
    guestCount: Number(form.guestCount),
    message: form.message.trim(),
  };
  return postMarketplaceLead(`/marketplace/${resource}/${encodeURIComponent(slug)}/enquiries`, payload, { signal });
}

export function enquirySuccessMessage(response, fallback = 'Your enquiry has been sent successfully.') {
  const message = response?.message || response?.data?.message;
  return typeof message === 'string' && message.trim() ? message.trim() : fallback;
}

export async function postMarketplaceLead(path, payload, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
  });
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : null; } catch { throw new Error('The server returned an unexpected response. Please try again.'); }
  if (!response.ok || data?.success === false) throw new Error(typeof data?.message === 'string' ? data.message : 'Unable to send your enquiry. Please try again.');
  return data;
}
