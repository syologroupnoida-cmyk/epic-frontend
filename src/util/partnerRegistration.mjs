export const PARTNER_DRAFT_KEY = 'epic_partner_signup_draft';
const draftLifetime = 24 * 60 * 60 * 1000;
const fields = ['businessName', 'categoryId', 'categoryName', 'cityId', 'cityName', 'phone', 'email'];

export function savePartnerSignupDraft(values, storage, now = Date.now()) {
  const draft = Object.fromEntries(fields.map((field) => [field, String(values[field] || '').trim().slice(0, 250)]));
  storage.setItem(PARTNER_DRAFT_KEY, JSON.stringify({ ...draft, createdAt: now }));
  return draft;
}

export function readPartnerSignupDraft(storage, now = Date.now()) {
  try {
    const draft = JSON.parse(storage.getItem(PARTNER_DRAFT_KEY));
    if (!draft || !Number.isFinite(draft.createdAt) || now - draft.createdAt > draftLifetime || draft.createdAt > now) return null;
    if (fields.some((field) => typeof draft[field] !== 'string')) return null;
    return Object.fromEntries(fields.map((field) => [field, draft[field].slice(0, 250)]));
  } catch { return null; }
}
