const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
const whole = (value) => ['string', 'number'].includes(typeof value) && String(value).trim() !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
export const inventoryVariantId = (row) => String(row?.variantId || row?.ecommerceVariantId || row?.variant?.ecommerceVariantId || row?.variant?.id || (row?.sku ? row.id : '') || '');
export const inventorySku = (row) => row?.sku || row?.variant?.sku || 'Unavailable';
export const inventoryProductTitle = (row) => row?.product?.title || row?.variant?.product?.title || row?.productTitle || row?.title || 'Unavailable';
export const inventoryOptions = (row) => Object.entries(row?.optionValues || row?.variant?.optionValues || {}).map(([name, value]) => `${name}: ${value}`).join(' / ') || '—';
export function inventoryNumber(value) { return whole(value) ? Number(value).toLocaleString('en-IN') : '—'; }
export const inventoryAvailable = (row) => row?.availableStock ?? row?.availableQuantity ?? row?.stockQuantity ?? row?.inventory?.availableStock ?? row?.inventory?.availableQuantity ?? row?.inventory?.stockQuantity;
export const inventoryReserved = (row) => row?.reservedStock ?? row?.reservedQuantity ?? row?.inventory?.reservedStock ?? row?.inventory?.reservedQuantity;
export const inventoryThreshold = (row) => row?.lowStockThreshold ?? row?.inventory?.lowStockThreshold ?? row?.variant?.lowStockThreshold ?? row?.variant?.inventory?.lowStockThreshold;
export function inventoryDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function pagination(page, limit) {
  if (!whole(page) || Number(page) < 1 || ![20, 50, 100].includes(Number(limit))) throw new Error('Invalid inventory pagination.');
  return { page: Number(page), limit: Number(limit) };
}
async function fetchList(api, path, params, keys, signal) {
  const response = await api.get(path, { params, signal });
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The inventory request failed.');
  const data = record(body) && Object.hasOwn(body, 'data') ? body.data : body;
  const items = Array.isArray(data) ? data : keys.map((key) => data?.[key]).find(Array.isArray);
  if (!Array.isArray(items) || items.some((row) => !record(row))) throw new Error('The server returned an invalid inventory list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? body?.pagination ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems;
  const total = whole(count) ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : typeof meta.hasNext === 'boolean' ? meta.hasNext : total >= 0 ? params.page * params.limit < total : meta.totalPages ? params.page < Number(meta.totalPages) : items.length === params.limit;
  return { items, total, hasNext };
}
export function fetchEcommerceInventory(api, { page = 1, limit = 20, lowStockOnly = false, signal } = {}) {
  return fetchList(api, '/admin/ecommerce/inventory', { ...pagination(page, limit), ...(lowStockOnly ? { lowStockOnly: true } : {}) }, ['inventory', 'inventories', 'variants', 'items', 'results'], signal);
}
export function fetchEcommerceInventoryMovements(api, { variantId, page = 1, limit = 20, signal } = {}) {
  if (typeof variantId !== 'string' || !variantId.trim()) throw new Error('Choose a variant to view its movement history.');
  return fetchList(api, '/admin/ecommerce/inventory-movements', { variantId, ...pagination(page, limit) }, ['movements', 'inventoryMovements', 'items', 'results'], signal);
}

export function inventorySettingsPayload(values) {
  if (!whole(values.lowStockThreshold)) throw new Error('Enter a non-negative whole number for the low-stock threshold.');
  return { lowStockThreshold: Number(values.lowStockThreshold) };
}

export async function updateEcommerceInventorySettings(api, variantId, values, signal) {
  if (typeof variantId !== 'string' || !variantId.trim()) throw new Error('A valid variant ID is required.');
  const response = await api.patch(`/admin/ecommerce/variants/${encodeURIComponent(variantId)}/inventory-settings`, inventorySettingsPayload(values), { signal });
  if (response?.data?.success === false) throw new Error(response.data.message || 'The threshold could not be saved.');
  return response?.data?.data ?? response?.data;
}
