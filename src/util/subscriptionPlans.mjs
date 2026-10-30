export const SUBSCRIPTION_PLANS_PATH = '/admin/subscription-plans';
export const subscriptionPlanThemes = {
  PURPLE: ['#7944b8', '#f5f0fb'],
  BLUE: ['#2456a6', '#eff5ff'],
  GOLD: ['#946417', '#fff8e8'],
  GREEN: ['#187354', '#ecf8f2'],
  BURGUNDY: ['#b61f4b', '#fff1f5'],
};
export function subscriptionPlanColors(theme) {
  const color = String(theme || '').trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(color) ? [color, `${color}14`] : subscriptionPlanThemes[color] || subscriptionPlanThemes.BURGUNDY;
}
export const subscriptionPlanId = (plan) => String(plan?.id || plan?.subscriptionPlanId || plan?._id || '');
export const subscriptionPlanError = (error) => error?.response?.data?.message || error?.message || 'Unable to complete the subscription plan request.';

export const planTextFields = ['code', 'kind', 'displayName', 'shortDescription', 'badgeText', 'theme', 'ctaText'];
export const planMoneyFields = ['monthlyPrice', 'directLeadPrice'];
export const planIntegerFields = ['maxActiveServiceListings', 'maxActiveVenueProperties', 'maxDirectLeadPurchasesPerMonth', 'maxSharedLeadPurchasesPerMonth', 'maxMediaPerListing', 'featuredListingSlots', 'sortOrder'];
export const planBooleanFields = ['isFeatured', 'isActive', 'isDefault', 'isPurchasable'];
const allFields = [...planTextFields, ...planMoneyFields, ...planIntegerFields, 'benefits', ...planBooleanFields];
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);

export function normalizeSubscriptionPlan(entry) {
  if (!record(entry) || (Object.hasOwn(entry, 'plan') && !record(entry.plan))) throw new Error('The server returned invalid subscription plan details.');
  const plan = record(entry.plan) ? entry.plan : entry;
  const limits = record(plan.limits) ? plan.limits : {};
  return {
    ...plan,
    ...Object.fromEntries(planIntegerFields.filter((key) => key !== 'sortOrder' && plan[key] === undefined && limits[key] !== undefined).map((key) => [key, limits[key]])),
    ...(typeof entry.isCurrentPlan === 'boolean' ? { isCurrentPlan: entry.isCurrentPlan } : {}),
    ...(typeof entry.cardAction === 'string' ? { cardAction: entry.cardAction } : {}),
  };
}

export function planFormValues(plan = {}) {
  plan = normalizeSubscriptionPlan(plan);
  const defaults = {
    code: '', kind: 'PAID', displayName: '', shortDescription: '', monthlyPrice: '', directLeadPrice: 0,
    maxActiveServiceListings: 0, maxActiveVenueProperties: 0, maxDirectLeadPurchasesPerMonth: 0,
    maxSharedLeadPurchasesPerMonth: 0, maxMediaPerListing: 0, featuredListingSlots: 0,
    benefits: [], badgeText: '', theme: 'PURPLE', ctaText: 'Choose plan', sortOrder: 0,
    isFeatured: false, isActive: true, isDefault: false, isPurchasable: true,
  };
  return Object.fromEntries(allFields.map((key) => [key, key === 'benefits' ? (Array.isArray(plan.benefits) ? plan.benefits.filter((item) => typeof item === 'string').slice() : []) : plan[key] !== undefined ? plan[key] : defaults[key]]));
}

export function validateSubscriptionPlan(form, original) {
  const errors = {};
  for (const key of ['code', 'kind', 'displayName', 'theme', 'ctaText']) {
    if (typeof form[key] !== 'string' || !form[key].trim()) errors[key] = 'This field is required.';
  }
  for (const key of [...planMoneyFields, ...planIntegerFields]) {
    const value = form[key];
    // Preserve nullable limits returned by the API when editing another field.
    if (value === null && original?.[key] === null) continue;
    if (value === null || String(value ?? '').trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || typeof value === 'boolean') errors[key] = 'Enter a number of zero or more.';
    else if (planIntegerFields.includes(key) && !Number.isSafeInteger(Number(value))) errors[key] = 'Enter a whole number of zero or more.';
    else if (planMoneyFields.includes(key) && !/^\d+(?:\.\d{1,2})?$/.test(String(value))) errors[key] = 'Use up to two decimal places.';
  }
  if (!Array.isArray(form.benefits) || form.benefits.some((item) => typeof item !== 'string')) errors.benefits = 'Benefits must be a list of text items.';
  return errors;
}

export function subscriptionPlanPayload(form) {
  return Object.fromEntries(allFields.map((key) => [key,
    planMoneyFields.includes(key) || planIntegerFields.includes(key) ? form[key] === null ? null : Number(form[key])
      : planBooleanFields.includes(key) ? Boolean(form[key])
        : key === 'benefits' ? form.benefits.map((item) => item.trim()).filter(Boolean)
          : String(form[key] ?? '').trim(),
  ]));
}

export function subscriptionPlanChanges(form, original) {
  const next = subscriptionPlanPayload(form);
  const previous = subscriptionPlanPayload(planFormValues(original));
  return Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(previous[key])));
}

function unwrap(response) {
  const payload = response?.data;
  if (payload?.success === false) throw new Error(payload.message || 'Unable to save the subscription plan.');
  return payload?.data ?? payload;
}

export async function fetchSubscriptionPlans(api, { isActive, signal } = {}) {
  const response = await api.get(SUBSCRIPTION_PLANS_PATH, { params: typeof isActive === 'boolean' ? { isActive } : {}, signal });
  const data = unwrap(response);
  const plans = Array.isArray(data) ? data : data?.subscriptionPlans ?? data?.plans ?? data?.items ?? data?.results ?? data?.content;
  if (!Array.isArray(plans) || plans.some((plan) => !record(plan))) throw new Error('The server returned an invalid subscription plan list.');
  return plans.map(normalizeSubscriptionPlan).sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
}

export async function saveSubscriptionPlan(api, form, original = null, signal) {
  const errors = validateSubscriptionPlan(form, original);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const id = subscriptionPlanId(original);
  if (original && !id) throw new Error('The subscription plan ID is missing.');
  const payload = original ? subscriptionPlanChanges(form, original) : subscriptionPlanPayload(form);
  if (original && !Object.keys(payload).length) return { changed: false, message: 'No changes to save.' };
  const response = original ? await api.patch(`${SUBSCRIPTION_PLANS_PATH}/${encodeURIComponent(id)}`, payload, { signal }) : await api.post(SUBSCRIPTION_PLANS_PATH, payload, { signal });
  return { changed: true, data: unwrap(response), message: response.data?.message || (original ? 'Subscription plan updated successfully.' : 'Subscription plan created successfully.') };
}

export async function setSubscriptionPlanActive(api, id, active, signal) {
  if (!id?.trim()) throw new Error('The subscription plan ID is missing.');
  const action = active ? 'activate' : 'deactivate';
  const response = await api.post(`${SUBSCRIPTION_PLANS_PATH}/${encodeURIComponent(id)}/${action}`, {}, { signal });
  return { data: unwrap(response), message: response.data?.message || `Subscription plan ${active ? 'activated' : 'deactivated'} successfully.` };
}

export function subscriptionFieldErrors(error) {
  const fields = error?.response?.data?.errors;
  const pairs = Array.isArray(fields) ? fields.map((item) => [item.field, item.message]) : record(fields) ? Object.entries(fields) : [];
  return Object.fromEntries(pairs.filter(([key, value]) => allFields.includes(key) && typeof value === 'string'));
}
