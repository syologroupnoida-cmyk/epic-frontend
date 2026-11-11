import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTNER_DRAFT_KEY, readPartnerSignupDraft, savePartnerSignupDraft } from '../src/util/partnerRegistration.mjs';

const values = { businessName: ' Wedding Studio ', categoryId: 'photo', categoryName: 'Photography', cityId: 'delhi', cityName: 'Delhi', phone: '9876543210', email: 'vendor@example.com' };
function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
}
test('partner signup carries trimmed business and contact details without unrelated fields', () => {
  const session = storage();
  savePartnerSignupDraft({ ...values, password: 'must-not-be-saved' }, session, 1000);
  assert.deepEqual(readPartnerSignupDraft(session, 1100), { ...values, businessName: 'Wedding Studio' });
  assert.ok(!session.getItem(PARTNER_DRAFT_KEY).includes('password'));
});
test('expired and future-dated signup drafts are ignored', () => {
  const session = storage();
  savePartnerSignupDraft(values, session, 1000);
  assert.equal(readPartnerSignupDraft(session, 1000 + 24 * 60 * 60 * 1000 + 1), null);
  assert.equal(readPartnerSignupDraft(session, 999), null);
});
test('malformed or unavailable session storage does not break signup', () => {
  const session = storage();
  session.setItem(PARTNER_DRAFT_KEY, 'invalid json');
  assert.equal(readPartnerSignupDraft(session), null);
  session.setItem(PARTNER_DRAFT_KEY, JSON.stringify({ createdAt: 1000, businessName: [] }));
  assert.equal(readPartnerSignupDraft(session, 1100), null);
  assert.equal(readPartnerSignupDraft({ getItem() { throw new Error('Storage unavailable'); } }), null);
});
