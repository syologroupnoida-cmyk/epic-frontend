export const businessStatuses = ['NEW', 'CONTACTED'];
export const importedBusinessId = (row) => String(row?.importedBusinessId || row?.id || row?._id || '');
export const importBatchId = (row) => String(row?.importBatchId || row?.batchId || row?.id || row?._id || '');
export const businessLabel = (value) => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
export const businessError = (error) => error?.response?.data?.message || error?.message || 'Unable to complete the request. Please try again.';
export const businessText = (value) => value == null || value === '' ? '—' : typeof value === 'object' ? (typeof value.name === 'string' ? value.name : typeof value.title === 'string' ? value.title : JSON.stringify(value)) : String(value);
export const businessWebsite = (value) => typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
export function businessDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
function unwrap(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The business request failed.');
  return body && Object.hasOwn(body, 'data') ? body.data : body;
}

async function fetchList(api, resource, keys, { page = 1, limit = 20, status = '', search = '', signal } = {}) {
  const response = await api.get(`/admin/${resource}`, { params: { page, limit, ...(status ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : keys.map((key) => data?.[key]).find(Array.isArray);
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid business list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? data ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems ?? data?.total;
  const total = count != null && Number.isFinite(Number(count)) && Number(count) >= 0 ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : typeof meta.hasNext === 'boolean' ? meta.hasNext : total >= 0 ? page * limit < total : meta.totalPages ? page < Number(meta.totalPages) : items.length === limit;
  return { items, total, hasNext };
}

export function fetchImportedBusinesses(api, options) {
  return fetchList(api, 'imported-businesses', ['importedBusinesses', 'businesses', 'items', 'results'], options);
}

export function fetchBusinessImportBatches(api, { page = 1, limit = 20, search = '', signal } = {}) {
  return fetchList(api, 'business-import-batches', ['businessImportBatches', 'importBatches', 'batches', 'items', 'results'], { page, limit, search, signal });
}

function detailPath(id) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('A business ID is required.');
  return `/admin/imported-businesses/${encodeURIComponent(id)}`;
}

export async function fetchImportedBusiness(api, id, signal) {
  const data = unwrap(await api.get(detailPath(id), { signal }));
  const business = data?.importedBusiness ?? data?.business ?? data;
  if (!record(business) || !Object.keys(business).length) throw new Error('Business details are unavailable.');
  return business;
}

export async function updateImportedBusiness(api, id, values, signal) {
  const path = detailPath(id);
  if (typeof values?.status !== 'string' || !values.status.trim() || typeof values.salesNote !== 'string') throw new Error('Select a status and enter a valid sales note.');
  const response = await api.patch(path, { status: values.status.trim(), salesNote: values.salesNote.trim() }, { signal });
  unwrap(response);
  return response.data?.message || 'Business updated successfully.';
}
