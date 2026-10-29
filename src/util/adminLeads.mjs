const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);
export const adminLeadId = (row) => String(row?.id || row?._id || row?.leadId || '');
export const isDirectAdminLead = (lead) => String(lead?.leadType || lead?.lead?.leadType || '').toUpperCase() === 'DIRECT';
export function adminLeadActions(lead) {
  if (!lead) return [];
  const status = String(lead.status || '').toUpperCase();
  if (isDirectAdminLead(lead)) return ['REJECTED', 'CLOSED'].includes(status) ? [] : ['close'];
  return ['REJECTED', 'CLOSED'].includes(status) ? ['activate', 'reject'] : ['activate', 'reject', 'close'];
}
export const leadLabel = (value) => String(value || 'Unknown').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
export const adminLeadTabs = [
  { value: 'all', label: 'All', status: '', leadType: '' },
  { value: 'pending', label: 'Pending Review', status: 'PENDING_REVIEW', leadType: '' },
  { value: 'shared', label: 'Shared', status: '', leadType: 'SHARED' },
];

export function adminLeadSummary(row = {}) {
  const requirement = row.requirement || row;
  const city = requirement.city || row.city;
  const name = (value) => typeof value === 'string' ? value : value?.name || value?.title || '';
  return {
    id: adminLeadId(row),
    customerName: row.customer?.name ?? row.customerName ?? '',
    customerPhone: row.customer?.phone ?? row.customerPhone ?? '',
    customerEmail: row.customer?.email ?? row.customerEmail ?? '',
    subject: row.source?.title || name(requirement.subcategory) || name(row.serviceSubcategory) || name(row.listing) || row.listingTitle || row.venuePropertyTitle || row.serviceName || '',
    city: typeof city === 'string' ? city : [city?.name, city?.stateName].filter(Boolean).join(', '),
    eventDate: requirement.eventDate ?? '',
    guestCount: requirement.guestCount ?? '',
    status: row.status || '',
    leadType: row.leadType || '',
    createdAt: row.createdAt || '',
  };
}

function unwrap(response) {
  const payload = response?.data;
  if (payload?.success === false) throw new Error(payload.message || 'Unable to complete the lead request.');
  return payload?.data ?? payload;
}

export async function fetchAdminLeads(api, { page = 1, limit = 20, status = '', leadType = '', search = '', signal } = {}) {
  const response = await api.get('/admin/leads', { params: { page, limit, ...(status ? { status } : {}), ...(leadType ? { leadType } : {}), ...(search.trim() ? { search: search.trim() } : {}) }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.leads ?? data?.items ?? data?.results ?? data?.content;
  if (!Array.isArray(items) || items.some((item) => !isRecord(item))) throw new Error('The server returned an invalid lead list.');
  const pagination = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? response.data?.meta ?? data ?? {};
  const rawTotal = pagination.total ?? pagination.totalCount ?? pagination.totalItems ?? pagination.totalElements ?? data?.total ?? data?.totalCount;
  const total = rawTotal != null && Number.isFinite(Number(rawTotal)) && Number(rawTotal) >= 0 ? Number(rawTotal) : -1;
  const hasNext = typeof pagination.hasNextPage === 'boolean' ? pagination.hasNextPage : typeof pagination.hasNext === 'boolean' ? pagination.hasNext : total >= 0 ? page * limit < total : pagination.totalPages ? page < Number(pagination.totalPages) : items.length === limit;
  return { items, total, hasNext };
}

export async function fetchAdminLead(api, id, signal) {
  if (!id?.trim()) throw new Error('A lead ID is required.');
  const data = unwrap(await api.get(`/admin/leads/${encodeURIComponent(id)}`, { signal }));
  const lead = data?.lead ?? data;
  if (!isRecord(lead) || !Object.keys(lead).length) throw new Error('Lead details are unavailable.');
  return lead;
}

export function validateLeadAction(action, values = {}) {
  if (action === 'activate') {
    const errors = {};
    if (String(values.basePrice ?? '').trim() === '' || !Number.isFinite(Number(values.basePrice)) || Number(values.basePrice) < 0) errors.basePrice = 'Enter a valid price of zero or more.';
    if (String(values.maxBuyerCount ?? '').trim() === '' || !Number.isSafeInteger(Number(values.maxBuyerCount)) || Number(values.maxBuyerCount) < 1) errors.maxBuyerCount = 'Enter a whole number of at least 1.';
    return errors;
  }
  if (['reject', 'close'].includes(action)) return typeof values.reason === 'string' && values.reason.trim() ? {} : { reason: 'A reason is required.' };
  throw new Error('Unsupported lead action.');
}

export async function moderateAdminLead(api, id, action, values, signal) {
  if (!id?.trim()) throw new Error('A lead ID is required.');
  const errors = validateLeadAction(action, values);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const payload = action === 'activate' ? { basePrice: Number(values.basePrice), maxBuyerCount: Number(values.maxBuyerCount) } : { reason: values.reason.trim() };
  const response = await api.post(`/admin/leads/${encodeURIComponent(id)}/${action}`, payload, { signal });
  const data = unwrap(response);
  return { data, message: response.data?.message || `Lead ${action === 'activate' ? 'activated' : action === 'reject' ? 'rejected' : 'closed'} successfully.` };
}
