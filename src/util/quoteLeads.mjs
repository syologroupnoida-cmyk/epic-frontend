import { postMarketplaceLead, validateVendorEnquiry } from './vendorEnquiries.mjs';

export function validateQuoteLead(form) {
  const errors = validateVendorEnquiry(form);
  if (typeof form.cityId !== 'string' || !form.cityId.trim()) errors.cityId = 'Choose your event city.';
  if (typeof form.serviceSubcategoryId !== 'string' || !form.serviceSubcategoryId.trim()) errors.serviceSubcategoryId = 'Choose a service.';
  for (const key of ['budgetMin', 'budgetMax']) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(form[key] ?? '')) || !Number.isFinite(Number(form[key]))) errors[key] = 'Enter a valid budget amount.';
  }
  if (!errors.budgetMin && !errors.budgetMax && Number(form.budgetMax) < Number(form.budgetMin)) errors.budgetMax = 'Maximum budget must be at least the minimum budget.';
  return errors;
}

export async function sendQuoteLead(form, options) {
  if (Object.keys(validateQuoteLead(form)).length) throw new Error('Please check your quote request details.');
  return postMarketplaceLead('/marketplace/leads/get-quotes', {
    customerName: form.customerName.trim(),
    customerPhone: form.customerPhone,
    customerEmail: form.customerEmail.trim(),
    cityId: form.cityId.trim(),
    serviceSubcategoryId: form.serviceSubcategoryId.trim(),
    eventDate: form.eventDate,
    guestCount: Number(form.guestCount),
    budgetMin: Number(form.budgetMin),
    budgetMax: Number(form.budgetMax),
    message: form.message.trim(),
  }, options);
}
