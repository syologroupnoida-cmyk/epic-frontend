import test from 'node:test';
import assert from 'node:assert/strict';
import { sendQuoteLead, validateQuoteLead } from '../src/util/quoteLeads.mjs';
import { enquirySuccessMessage } from '../src/util/vendorEnquiries.mjs';
import { getPublicCatalog } from '../src/util/publicCatalog.mjs';
import { loadAllCities } from '../src/util/cities.mjs';
import { loadPublicServiceCategories, loadPublicServiceSubcategories } from '../src/util/serviceCategories.mjs';

const form = { customerName: ' Quote Test ', customerPhone: '9876543210', customerEmail: ' test@example.com ', cityId: 'city-test', serviceSubcategoryId: 'service-photo', eventDate: '2099-02-10', guestCount: '250', budgetMin: '100000', budgetMax: '500000', message: ' Looking for suitable vendors and quotations. ' };
const simulation = Boolean(process.env.VENDOR_ENQUIRY_SIMULATION && process.env.NEXT_PUBLIC_API_BASE_URL?.includes('127.0.0.1'));

test('quote validation requires city/service IDs and a valid ordered numeric budget', async () => {
  assert.deepEqual(validateQuoteLead(form), {});
  const errors = validateQuoteLead({ ...form, cityId: '', serviceSubcategoryId: '', budgetMin: '-1', budgetMax: 'Infinity' });
  for (const field of ['cityId', 'serviceSubcategoryId', 'budgetMin', 'budgetMax']) assert.ok(errors[field]);
  assert.ok(validateQuoteLead({ ...form, budgetMax: '1' }).budgetMax);
  assert.deepEqual(validateQuoteLead({ ...form, budgetMin: 0, budgetMax: 0 }), {});
  await assert.rejects(sendQuoteLead({ ...form, customerEmail: '' }), /check your quote request/);
  for (const customerPhone of ['123456789', '12345678901', '+919876543210', '98765 43210', '98765abc10']) {
    assert.ok(validateQuoteLead({ ...form, customerPhone }).customerPhone);
    await assert.rejects(sendQuoteLead({ ...form, customerPhone }), /check your quote request/);
  }
});

test('success feedback uses the server message and handles empty successes', () => {
  assert.equal(enquirySuccessMessage({ message: ' Saved successfully. ' }), 'Saved successfully.');
  assert.equal(enquirySuccessMessage({ data: { message: 'Request received.' } }), 'Request received.');
  assert.equal(enquirySuccessMessage(null, 'Sent.'), 'Sent.');
});

test('quote requests submit dynamic city/service IDs and exactly the ten API fields over HTTP', { skip: !simulation }, async () => {
  const cities = await loadAllCities(getPublicCatalog);
  const categories = await loadPublicServiceCategories(getPublicCatalog);
  const services = await loadPublicServiceSubcategories(getPublicCatalog, categories[0].id);
  const otherServices = await loadPublicServiceSubcategories(getPublicCatalog, categories[1].id);
  assert.notEqual(services[0].id, otherServices[0].id);
  const result = await sendQuoteLead({ ...form, cityId: cities[0].id, serviceSubcategoryId: services[0].id, categoryId: categories[0].id, cityName: cities[0].name });
  assert.deepEqual(result.data.received, { customerName: 'Quote Test', customerPhone: '9876543210', customerEmail: 'test@example.com', cityId: 'city-test', serviceSubcategoryId: 'service-photo', eventDate: '2099-02-10', guestCount: 250, budgetMin: 100000, budgetMax: 500000, message: 'Looking for suitable vendors and quotations.' });
  assert.equal(enquirySuccessMessage(result), 'Your quote request has been submitted successfully.');
  await assert.rejects(sendQuoteLead({ ...form, cityId: 'unavailable' }), /temporarily unavailable/);
});
