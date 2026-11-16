import axios from 'axios';
import { API_BASE_URL } from './apiBaseUrl.mjs';

// Public browsing must not use the authenticated admin client or refresh session tokens.
export const ShopApi = axios.create({ baseURL: API_BASE_URL, timeout: 20000, withCredentials: false, headers: { Accept: 'application/json' } });
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
const whole = (value) => ['number', 'string'].includes(typeof value) && String(value).trim() !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
export const shopCategoryId = (row) => String(row?.id || row?.ecommerceCategoryId || '');
export const shopSubcategoryId = (row) => String(row?.id || row?.ecommerceSubcategoryId || '');
export const shopProductId = (row) => String(row?.id || row?.ecommerceProductId || '');
export const shopProductSlug = (row) => row?.slug || row?.ecommerceProductSlug || '';
export const shopError = (error) => error?.response?.data?.message || error?.message || 'Unable to load the shop. Please try again.';
export const shopMoney = (paise) => whole(paise) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: Number(paise) % 100 ? 2 : 0 }).format(Number(paise) / 100) : 'Price unavailable';
export function shopImageUrl(image) {
  const url = typeof image === 'string' ? image : image?.url || image?.imageUrl || image?.secureUrl || image?.src;
  return typeof url === 'string' && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) ? url : null;
}
export function shopProductImages(product, variant) {
  const images = variant?.images?.length ? variant.images : product.images;
  const rows = Array.isArray(images) ? [...images].sort((a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0)) : [];
  if (!rows.length && product.imageUrl) rows.push(product.imageUrl);
  return rows.map((row) => ({ url: shopImageUrl(row), alt: row?.altText || product.title })).filter((row) => row.url);
}
export const defaultShopVariant = (product) => product.defaultVariant || product.variants?.find((row) => row.isDefault) || product.variants?.[0] || null;
export function shopStock(variant) {
  const value = variant?.availableQuantity ?? variant?.availableStock ?? variant?.stockQuantity ?? variant?.inventory?.availableQuantity ?? variant?.inventory?.availableStock ?? variant?.inventory?.quantityAvailable ?? variant?.stock;
  return whole(value) ? Number(value) : null;
}
export function shopProductPrice(product, variant = defaultShopVariant(product)) {
  const sale = variant?.saleAmountPaise ?? product.saleAmountPaise ?? product.minSaleAmountPaise;
  const mrp = variant?.mrpAmountPaise ?? product.mrpAmountPaise;
  return { sale: whole(sale) ? Number(sale) : null, mrp: whole(mrp) ? Number(mrp) : null, discount: whole(sale) && whole(mrp) && Number(mrp) > Number(sale) ? Math.round((1 - Number(sale) / Number(mrp)) * 100) : 0 };
}
function unwrap(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The shop request failed.');
  return record(body) && Object.hasOwn(body, 'data') ? body.data : body;
}
function list(response, keys) {
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : keys.map((key) => data?.[key]).find(Array.isArray);
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid shop list.');
  return { items, data, meta: data?.pagination ?? data?.meta?.pagination ?? response.data?.pagination ?? {} };
}
export function shopProductParams({ categorySlug = '', subcategoryId = '', minPrice = '', maxPrice = '', page = 1, limit = 20 } = {}) {
  if (!whole(page) || Number(page) < 1 || !whole(limit) || Number(limit) < 1 || Number(limit) > 100) throw new Error('Invalid shop pagination.');
  const params = { page: Number(page), limit: Number(limit) };
  if (categorySlug) { if (typeof categorySlug !== 'string') throw new Error('Choose a valid category.'); params.categorySlug = categorySlug; }
  if (subcategoryId) { if (typeof subcategoryId !== 'string') throw new Error('Choose a valid subcategory.'); params.subcategoryId = subcategoryId; }
  for (const [key, value] of [['minPrice', minPrice], ['maxPrice', maxPrice]]) if (value !== '' && value != null) { if (!whole(value)) throw new Error('Prices must be non-negative whole paise amounts.'); params[key] = Number(value); }
  if (params.minPrice != null && params.maxPrice != null && params.minPrice > params.maxPrice) throw new Error('Minimum price cannot exceed maximum price.');
  return params;
}
export function shopPriceToPaise(value) {
  if (value === '') return '';
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) throw new Error('Enter a valid price with up to two decimal places.');
  const [rupees, decimals = ''] = String(value).split('.');
  const result = Number(rupees) * 100 + Number(decimals.padEnd(2, '0'));
  if (!Number.isSafeInteger(result)) throw new Error('Enter a smaller price.');
  return result;
}
export async function fetchShopProducts(api, { signal, ...filters } = {}) {
  const params = shopProductParams(filters);
  const response = await api.get('/shop/products', { params, signal });
  const { items, meta } = list(response, ['products', 'items', 'results']);
  if (items.some((row) => !shopProductId(row) || !shopProductSlug(row) || typeof row.title !== 'string')) throw new Error('The server returned an invalid product list.');
  const total = whole(meta.total) ? Number(meta.total) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : total >= 0 ? params.page * params.limit < total : items.length === params.limit;
  return { items, total, hasNext };
}
export async function fetchShopCategories(api, { signal } = {}) {
  const items = []; const seen = new Set();
  for (let page = 1; ; page += 1) {
    const response = await api.get('/shop/categories', { params: { page, limit: 100 }, signal });
    const result = list(response, ['categories', 'items']);
    let added = 0;
    for (const row of result.items) { const id = shopCategoryId(row); if (!id || !row.slug || typeof row.name !== 'string') throw new Error('The server returned an invalid category.'); if (!seen.has(id)) { items.push(row); seen.add(id); added += 1; } }
    const hasNext = typeof result.meta.hasNextPage === 'boolean' ? result.meta.hasNextPage : result.meta.totalPages ? page < Number(result.meta.totalPages) : result.items.length === 100;
    if (!hasNext) return items;
    if (!added) throw new Error('Unable to load all shop categories.');
  }
}
export async function fetchShopSubcategories(api, categoryId, { signal } = {}) {
  if (typeof categoryId !== 'string' || !categoryId.trim()) throw new Error('A category ID is required.');
  const response = await api.get('/shop/subcategories', { params: { categoryId }, signal });
  const { items } = list(response, ['subcategories', 'items']);
  if (items.some((row) => !shopSubcategoryId(row) || typeof row.name !== 'string')) throw new Error('The server returned an invalid subcategory list.');
  return items.filter((row) => !row.categoryId || row.categoryId === categoryId);
}
export async function fetchShopProduct(api, slug, { signal } = {}) {
  if (typeof slug !== 'string' || !slug.trim()) throw new Error('A product slug is required.');
  const data = unwrap(await api.get(`/shop/products/${encodeURIComponent(slug)}`, { signal }));
  const product = data?.product ?? data?.ecommerceProduct ?? data;
  if (!record(product) || typeof product.title !== 'string' || !shopProductSlug(product)) throw new Error('Product details are unavailable.');
  return product;
}
export function shopOptionDefinitions(product) {
  if (Array.isArray(product.optionDefinitions) && product.optionDefinitions.length) return product.optionDefinitions;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  return [...new Set(variants.flatMap((row) => Object.keys(row.optionValues || {})))].map((name) => ({ name, values: [...new Set(variants.map((row) => row.optionValues?.[name]).filter(Boolean))] }));
}
export function chooseShopVariant(variants, current, name, value) {
  return variants.find((row) => row.optionValues?.[name] === value && Object.entries(current?.optionValues || {}).every(([key, item]) => key === name || row.optionValues?.[key] === item)) || variants.find((row) => row.optionValues?.[name] === value) || null;
}
