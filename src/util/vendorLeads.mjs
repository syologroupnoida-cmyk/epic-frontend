export const leadId = (row) => String(row?.leadId || row?.lead?.leadId || row?.lead?.id || row?.lead?._id || row?.id || row?._id || row?.sharedLeadId || '');
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);

function responseData(response) {
  const payload = response?.data;
  if (payload?.success === false) throw new Error(payload.message || 'Unable to load leads.');
  return payload?.data ?? payload;
}

export async function fetchVendorLeads(api, { page = 1, limit = 20, signal, shared = false, search = '' } = {}) {
  const response = await api.get(shared ? '/vendor/leads/shared' : '/vendor/leads', { params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) }, signal });
  const data = responseData(response);
  const items = Array.isArray(data) ? data : data?.sharedLeads ?? data?.leads ?? data?.items ?? data?.results ?? data?.content;
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid lead list.');
  const pagination = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? data ?? {};
  const totalValue = pagination.total ?? pagination.totalCount ?? pagination.totalItems ?? pagination.totalElements ?? data?.total ?? data?.totalCount ?? data?.totalItems ?? data?.totalElements;
  const total = totalValue !== null && totalValue !== undefined && Number.isFinite(Number(totalValue)) && Number(totalValue) >= 0 ? Number(totalValue) : -1;
  const totalPages = Number(pagination.totalPages || 0);
  const hasNext = typeof pagination.hasNextPage === 'boolean' ? pagination.hasNextPage : typeof pagination.hasNext === 'boolean' ? pagination.hasNext : total >= 0 ? page * limit < total : totalPages > 0 ? page < totalPages : items.length === limit;
  return { items, total, hasNext };
}

export async function fetchVendorLead(api, id, signal) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('A lead ID is required.');
  const data = responseData(await api.get(`/vendor/leads/${encodeURIComponent(id)}`, { signal }));
  if (!record(data) || !Object.keys(data).length) throw new Error('Lead details are unavailable.');
  return Object.keys(data).length === 1 && record(data.lead) ? data.lead : data;
}

export const sharedLeadId = (row) => String(row?.sharedLeadId || row?.id || row?._id || row?.leadId || '');

export function isLeadPurchased(row) {
  return Boolean(row?.isPurchased === true || row?.purchased === true || row?.purchasedAt || row?.purchaseStatus === 'PURCHASED' || row?.status === 'PURCHASED');
}

export function sharedLeadPrice(row) {
  const amount = row?.purchasePrice ?? row?.leadPrice ?? row?.price;
  return amount !== undefined && amount !== null && amount !== '' && Number.isFinite(Number(amount)) ? Number(amount).toLocaleString('en-IN', { style: 'currency', currency: /^[A-Z]{3}$/.test(row?.currency || '') ? row.currency : 'INR', maximumFractionDigits: 2 }) : '';
}

export async function purchaseSharedLead(api, id) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('A shared lead ID is required.');
  const response = await api.post(`/vendor/leads/${encodeURIComponent(id)}/purchase`);
  const data = responseData(response);
  return { data, message: response.data?.message || 'Lead purchased successfully.' };
}

export function leadSummary(row) {
  const lead = row.lead || row;
  const customer = lead.customer || {};
  const name = (value) => typeof value === 'string' ? value : value?.title || value?.name || '';
  return {
    id: leadId(row),
    customerName: lead.customerName || customer.name || 'Not provided',
    customerPhone: lead.customerPhone || customer.phone || '',
    customerEmail: lead.customerEmail || customer.email || '',
    subject: name(lead.listing || lead.serviceListing || lead.venueProperty || lead.property || lead.serviceSubcategory || lead.service) || lead.listingTitle || lead.venuePropertyTitle || lead.serviceName || lead.leadType || lead.source || 'General enquiry',
    eventDate: lead.eventDate,
    guestCount: lead.guestCount,
    status: row.status || lead.status || '',
    createdAt: lead.createdAt || row.createdAt,
  };
}

export function leadDate(value, time = false) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}), timeZone: 'Asia/Kolkata' });
}

export function leadError(error, fallback = 'Unable to load leads. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}
