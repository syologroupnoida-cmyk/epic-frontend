const endpoint = '/admin/ecommerce/categories';
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
export const ecommerceCategoryId = (row) => String(row?.ecommerceCategoryId || row?.id || row?._id || '');
export const ecommerceCategoryError = (error) => error?.response?.data?.message || error?.message || 'Unable to load shop categories. Please try again.';

function unwrap(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The category request failed.');
  return record(body) && Object.hasOwn(body, 'data') ? body.data : body;
}

export function validateEcommerceCategory(values) {
  const errors = {};
  if (typeof values.name !== 'string' || !values.name.trim()) errors.name = 'Enter a category name.';
  if (typeof values.description !== 'string') errors.description = 'Enter a valid description.';
  if ((typeof values.sortOrder === 'string' && !values.sortOrder.trim()) || values.sortOrder == null || !['string', 'number'].includes(typeof values.sortOrder) || !Number.isSafeInteger(Number(values.sortOrder)) || Number(values.sortOrder) < 0) errors.sortOrder = 'Enter a whole number of zero or greater.';
  return errors;
}

export function ecommerceCategoryPayload(values) {
  const errors = validateEcommerceCategory(values);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return { name: values.name.trim(), description: values.description.trim(), sortOrder: Number(values.sortOrder) };
}

export async function createEcommerceCategory(api, values, signal) {
  const response = await api.post(endpoint, ecommerceCategoryPayload(values), { signal });
  const data = unwrap(response);
  return { category: data?.ecommerceCategory ?? data?.category ?? data, message: response.data?.message || 'Category created successfully.' };
}

export async function fetchEcommerceCategories(api, { page = 1, limit = 20, signal } = {}) {
  const response = await api.get(endpoint, { params: { page, limit }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.categories ?? data?.ecommerceCategories ?? data?.items ?? data?.results;
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid category list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? data ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems ?? data?.total;
  const total = count !== undefined && count !== null && count !== '' && Number.isFinite(Number(count)) && Number(count) >= 0 ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : typeof meta.hasNext === 'boolean' ? meta.hasNext : total >= 0 ? page * limit < total : meta.totalPages ? page < Number(meta.totalPages) : items.length === limit;
  return { items, total, hasNext };
}

export async function fetchEcommerceCategory(api, id, signal) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('A category ID is required.');
  const data = unwrap(await api.get(`${endpoint}/${encodeURIComponent(id)}`, { signal }));
  const category = data?.ecommerceCategory ?? data?.category ?? data;
  if (!record(category) || typeof category.name !== 'string' || !category.name.trim()) throw new Error('Category details are unavailable.');
  return category;
}

export async function fetchAllEcommerceCategories(api, { signal } = {}) {
  const items = [];
  const seen = new Set();
  for (let page = 1; ; page += 1) {
    if (signal?.aborted) throw new Error('Category request cancelled.');
    const result = await fetchEcommerceCategories(api, { page, limit: 100, signal });
    let added = 0;
    for (const row of result.items) {
      const id = ecommerceCategoryId(row);
      if (!id || seen.has(id)) continue;
      seen.add(id); items.push(row); added += 1;
    }
    if (!result.hasNext) return items;
    if (!added) throw new Error('Unable to load all category options. Please try again.');
  }
}
