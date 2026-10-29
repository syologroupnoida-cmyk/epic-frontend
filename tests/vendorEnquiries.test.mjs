import test from 'node:test';
import assert from 'node:assert/strict';
import { enquiryPhoneInput, sendVendorEnquiry, sendServiceEnquiry, sendVenueEnquiry, validateVendorEnquiry, validateServiceEnquiry } from '../src/util/vendorEnquiries.mjs';

const form = { customerName: ' Enquiry Test ', customerPhone: '9876543210', customerEmail: ' test@example.com ', eventDate: '2099-02-10', guestCount: '250', message: ' Wedding planning support. ' };

test('all enquiry popups accept exactly ten phone digits and reject invalid numbers before sending', async () => {
  assert.equal(enquiryPhoneInput('98765abc43210'), '9876543210');
  assert.equal(enquiryPhoneInput('01234567890123'), '0123456789');
  assert.equal(enquiryPhoneInput('letters +()-'), '');
  for (const customerPhone of ['', '123456789', '12345678901', '+919876543210', '98765 43210', '98765abc10', 9876543210]) {
    assert.ok(validateVendorEnquiry({ ...form, customerPhone }).customerPhone);
    assert.ok(validateServiceEnquiry({ ...form, customerPhone }).customerPhone);
    for (const send of [sendVendorEnquiry, sendServiceEnquiry, sendVenueEnquiry]) await assert.rejects(send('test-slug', { ...form, customerPhone }), /check the enquiry details/);
  }
  assert.equal(validateVendorEnquiry({ ...form, customerPhone: '0123456789' }).customerPhone, undefined);
});

test('enquiry validation rejects missing contact information, invalid dates and non-integer guest counts', () => {
  assert.deepEqual(validateVendorEnquiry(form), {});
  const errors = validateVendorEnquiry({ customerName: ' ', customerPhone: '123abc', customerEmail: 'invalid', eventDate: '2027-02-30', guestCount: '2.5', message: ' ' }, '2026-10-28');
  assert.equal(Object.keys(errors).length, 6);
  assert.ok(validateVendorEnquiry({ ...form, eventDate: '2026-10-27' }, '2026-10-28').eventDate);
  assert.equal(validateVendorEnquiry({ ...form, eventDate: '2026-10-28' }, '2026-10-28').eventDate, undefined);
});

const simulation = Boolean(process.env.VENDOR_ENQUIRY_SIMULATION && process.env.NEXT_PUBLIC_API_BASE_URL?.includes('127.0.0.1'));
test('enquiry client posts exact fields to the selected encoded vendor slug over HTTP', { skip: !simulation }, async () => {
  const result = await sendVendorEnquiry('planner & studio', form);
  assert.equal(result.data.vendorSlug, 'planner & studio');
  assert.deepEqual(result.data.received, { customerName: 'Enquiry Test', customerPhone: '9876543210', customerEmail: 'test@example.com', eventDate: '2099-02-10', guestCount: 250, message: 'Wedding planning support.' });
  assert.equal(await sendVendorEnquiry('empty-success', form), null);
});
test('enquiry client preserves API failures and rejects malformed server responses', { skip: !simulation }, async () => {
  await assert.rejects(sendVendorEnquiry('unavailable', form), /temporarily unavailable/);
  await assert.rejects(sendVendorEnquiry('rejected', form), /not accepting enquiries/);
  await assert.rejects(sendVendorEnquiry('invalid-response', form), /unexpected response/);
});
test('enquiry client rejects missing slugs and invalid input before posting', async () => {
  await assert.rejects(sendVendorEnquiry('', form), /not available/);
  await assert.rejects(sendVendorEnquiry('planner', { ...form, guestCount: 0 }), /check the enquiry details/);
});

test('service enquiries require the five supplied fields without requiring an email', async () => {
  const { customerEmail, ...serviceForm } = form;
  assert.ok(customerEmail);
  assert.deepEqual(validateServiceEnquiry(serviceForm), {});
  assert.ok(validateVendorEnquiry(serviceForm).customerEmail);
  assert.ok(validateServiceEnquiry({ ...serviceForm, customerPhone: '' }).customerPhone);
  await assert.rejects(sendServiceEnquiry('', serviceForm), /service is not available/);
  await assert.rejects(sendServiceEnquiry('photo-package', { ...serviceForm, guestCount: 0 }), /check the enquiry details/);
});

test('service enquiries use the listing slug and send exactly five fields, excluding email and UI fields', { skip: !simulation }, async () => {
  const result = await sendServiceEnquiry('photo & film package', { ...form, verification: '7', planning: 'Photography' });
  assert.equal(result.data.listingSlug, 'photo & film package');
  assert.deepEqual(result.data.received, { customerName: 'Enquiry Test', customerPhone: '9876543210', eventDate: '2099-02-10', guestCount: 250, message: 'Wedding planning support.' });
  assert.equal(await sendServiceEnquiry('empty-success', form), null);
  await assert.rejects(sendServiceEnquiry('unavailable', form), /temporarily unavailable/);
  await assert.rejects(sendServiceEnquiry('rejected', form), /not accepting enquiries/);
  await assert.rejects(sendServiceEnquiry('invalid-response', form), /unexpected response/);
});

test('venue enquiries reject missing slugs and invalid contact details before posting', async () => {
  await assert.rejects(sendVenueEnquiry('', form), /venue is not available/);
  await assert.rejects(sendVenueEnquiry('resort', { ...form, customerPhone: '' }), /check the enquiry details/);
});

test('venue enquiries post five fields to the venue property slug and retain server errors', { skip: !simulation }, async () => {
  const result = await sendVenueEnquiry('resort & banquet', { ...form, guestCount: '400', message: ' Is this venue available for our wedding? ', verification: '7' });
  assert.equal(result.data.venuePropertySlug, 'resort & banquet');
  assert.deepEqual(result.data.received, { customerName: 'Enquiry Test', customerPhone: '9876543210', eventDate: '2099-02-10', guestCount: 400, message: 'Is this venue available for our wedding?' });
  assert.equal(await sendVenueEnquiry('empty-success', form), null);
  await assert.rejects(sendVenueEnquiry('unavailable', form), /temporarily unavailable/);
  await assert.rejects(sendVenueEnquiry('rejected', form), /not accepting enquiries/);
});
