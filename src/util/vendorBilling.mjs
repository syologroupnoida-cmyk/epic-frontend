import { normalizeSubscriptionPlan, subscriptionPlanId } from './subscriptionPlans.mjs';

const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
function unwrap(response) {
  if (response?.data?.success === false) throw new Error(response.data.message || 'Unable to load billing information.');
  return response?.data?.data !== undefined ? response.data.data : response?.data;
}
export const billingError = (error) => error?.response?.data?.message || error?.message || 'Unable to load billing information.';
export function billingMoney(value, currency = 'INR') {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return 'Not available';
  return Number(value).toLocaleString('en-IN', { style: 'currency', currency: /^[A-Z]{3}$/.test(currency) ? currency : 'INR', maximumFractionDigits: 2 });
}
export async function fetchVendorPlanCatalog(api, signal) {
  const data = unwrap(await api.get('/vendor/subscription-plans', { signal }));
  const plans = Array.isArray(data) ? data : data?.plans ?? data?.subscriptionPlans ?? data?.items;
  if (!Array.isArray(plans) || plans.some((plan) => !record(plan))) throw new Error('The server returned an invalid subscription plan list.');
  const currentPlanId = typeof data?.currentPlanId === 'string' ? data.currentPlanId : '';
  return {
    currentPlanId,
    currentPlanSource: data?.currentPlanSource || '',
    hasCurrentPlanInfo: Boolean(currentPlanId) || plans.some((entry) => typeof entry.isCurrentPlan === 'boolean' || entry.cardAction === 'CURRENT_PLAN'),
    plans: plans.map((entry) => {
      const plan = normalizeSubscriptionPlan(entry);
      return currentPlanId ? { ...plan, isCurrentPlan: subscriptionPlanId(plan) === currentPlanId } : plan;
    }).sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
  };
}
export async function fetchVendorPlans(api, signal) {
  return (await fetchVendorPlanCatalog(api, signal)).plans;
}
export async function fetchVendorSubscription(api, signal) {
  const data = unwrap(await api.get('/vendor/subscription', { signal }));
  if (data == null) return null;
  if (!record(data)) throw new Error('The server returned invalid subscription details.');
  return Object.hasOwn(data, 'subscription') ? data.subscription : data.currentSubscription ?? data;
}
export function subscriptionSummary(subscription) {
  const plan = subscription?.plan || subscription?.subscriptionPlan || subscription?.currentPlan || subscription?.planSnapshot || {};
  return {
    planId: String(subscription?.planId || subscription?.subscriptionPlanId || subscriptionPlanId(plan)),
    code: plan.code || subscription?.planCode || '',
    name: plan.displayName || subscription?.planName || subscription?.displayName || 'Current plan',
    status: String(subscription?.status || '').toUpperCase(),
    expiresAt: subscription?.expiresAt || subscription?.currentPeriodEnd || subscription?.endDate,
  };
}
export function isCurrentVendorPlan(plan, subscription) {
  if (typeof plan?.isCurrentPlan === 'boolean') return plan.isCurrentPlan;
  if (plan?.cardAction === 'CURRENT_PLAN') return true;
  if (!subscription) return false;
  const current = subscriptionSummary(subscription);
  if (['EXPIRED', 'CANCELLED', 'CANCELED', 'INACTIVE', 'ENDED'].includes(current.status)) return false;
  const id = subscriptionPlanId(plan);
  return Boolean((id && current.planId && id === current.planId) || (plan.code && current.code && plan.code === current.code));
}
export async function purchaseVendorPlan(api, planId, signal) {
  if (typeof planId !== 'string' || !planId.trim()) throw new Error('A subscription plan ID is required.');
  const response = await api.post('/vendor/subscriptions/test-purchase', { planId }, { signal });
  return { data: unwrap(response), message: response.data?.message || 'Subscription purchased successfully.' };
}
export async function fetchVendorWallet(api, signal) {
  const data = unwrap(await api.get('/vendor/wallet', { signal }));
  const wallet = data?.wallet ?? data;
  const balance = wallet?.balance ?? wallet?.availableBalance;
  if (!record(wallet) || balance == null || balance === '' || !Number.isFinite(Number(balance))) throw new Error('The server returned an invalid wallet balance.');
  return { ...wallet, balance: Number(balance), currency: wallet.currency || 'INR' };
}
export async function fetchWalletTransactions(api, { page = 1, limit = 20, signal } = {}) {
  const response = await api.get('/vendor/wallet/transactions', { params: { page, limit }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.transactions ?? data?.items ?? data?.walletTransactions;
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid wallet transaction list.');
  const pagination = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? {};
  const count = pagination.total ?? pagination.totalCount ?? pagination.totalItems ?? data?.total;
  const total = count != null && Number.isFinite(Number(count)) && Number(count) >= 0 ? Number(count) : -1;
  const hasNext = typeof pagination.hasNextPage === 'boolean' ? pagination.hasNextPage : typeof pagination.hasNext === 'boolean' ? pagination.hasNext : total >= 0 ? page * limit < total : pagination.totalPages ? page < Number(pagination.totalPages) : items.length === limit;
  return { items, total, hasNext };
}
export function walletTransaction(row) {
  const type = String(row.direction || row.type || row.transactionType || '').toUpperCase();
  const direction = type.includes('CREDIT') ? 'CREDIT' : type.includes('DEBIT') ? 'DEBIT' : '';
  return {
    id: row.id || row.transactionId || '',
    type: row.transactionType || row.type || row.direction || 'Not provided',
    description: row.description || row.message || row.reason || '',
    direction,
    amount: row.amount,
    balance: row.balanceAfter ?? row.closingBalance ?? row.balance,
    currency: row.currency || 'INR',
    status: row.status || '',
    reference: row.referenceId || row.reference?.id || (typeof row.reference === 'string' ? row.reference : ''),
    date: row.createdAt || row.transactionDate,
  };
}
