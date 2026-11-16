const endpoint = '/admin/ecommerce/products';
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
const integer = (value) => ['string', 'number'].includes(typeof value) && String(value).trim() !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
const requiredId = (id) => { if (typeof id !== 'string' || !id.trim()) throw new Error('A valid ID is required.'); return encodeURIComponent(id); };
export const ecommerceProductId = (row) => String(row?.ecommerceProductId || row?.id || row?._id || '');
export const ecommerceVariantId = (row) => String(row?.ecommerceVariantId || row?.id || row?._id || '');
export const ecommerceProductError = (error) => error?.response?.data?.message || error?.message || 'Unable to complete the product request. Please try again.';
function unwrap(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The product request failed.');
  return record(body) && Object.hasOwn(body, 'data') ? body.data : body;
}
export function ecommerceProductUpdatePayload(values) {
  for (const key of ['categoryId', 'subcategoryId', 'title', 'description', 'brandName']) {
    if (typeof values[key] !== 'string' || !values[key].trim()) throw new Error(`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
  }
  if (!['string', 'number'].includes(typeof values.gstPercentage) || String(values.gstPercentage).trim() === '' || !Number.isFinite(Number(values.gstPercentage)) || Number(values.gstPercentage) < 0 || Number(values.gstPercentage) > 100) throw new Error('GST must be between 0 and 100.');
  if (!record(values.specifications)) throw new Error('Enter valid specifications.');
  if (!Array.isArray(values.optionDefinitions)) throw new Error('Enter valid options.');
  const names = new Set();
  const optionDefinitions = values.optionDefinitions.map((option) => {
    const name = option.name?.trim();
    if (!name || names.has(name.toLowerCase()) || !Array.isArray(option.values) || !option.values.length || option.values.some((value) => typeof value !== 'string' || !value.trim())) throw new Error('Each option needs a unique name and at least one value.');
    names.add(name.toLowerCase());
    const options = option.values.map((value) => value.trim());
    if (new Set(options).size !== options.length) throw new Error('Remove duplicate option values.');
    return { name, values: options };
  });
  const specifications = Object.fromEntries(Object.entries(values.specifications).filter(([, value]) => value !== '' && value !== undefined));
  return { categoryId: values.categoryId.trim(), subcategoryId: values.subcategoryId.trim(), title: values.title.trim(), description: values.description.trim(), brandName: values.brandName.trim(), gstPercentage: Number(values.gstPercentage), specifications, optionDefinitions };
}
export function ecommerceProductPayload(values) {
  const details = ecommerceProductUpdatePayload(values);
  const { optionDefinitions } = details;
  if (!Array.isArray(values.images)) throw new Error('Enter valid images.');
  if (!Array.isArray(values.variants) || !values.variants.length) throw new Error('Add at least one variant.');
  const skus = new Set(); const combinations = new Set();
  const variants = values.variants.map((variant) => {
    const sku = variant.sku?.trim();
    if (!sku || skus.has(sku.toLowerCase())) throw new Error('Each variant needs a unique SKU.');
    skus.add(sku.toLowerCase());
    if (!record(variant.optionValues) || Object.keys(variant.optionValues).length !== optionDefinitions.length || optionDefinitions.some((option) => !option.values.includes(variant.optionValues[option.name]))) throw new Error('Choose a valid value for every variant option.');
    const combination = JSON.stringify(optionDefinitions.map((option) => variant.optionValues[option.name]));
    if (combinations.has(combination)) throw new Error('Each variant must have a unique option combination.');
    combinations.add(combination);
    if (![variant.mrpAmountPaise, variant.saleAmountPaise, variant.initialStock].every(integer)) throw new Error('Prices in paise and initial stock must be non-negative whole numbers.');
    if (Number(variant.saleAmountPaise) > Number(variant.mrpAmountPaise)) throw new Error('Sale price cannot exceed MRP.');
    if (typeof variant.isDefault !== 'boolean') throw new Error('Select a default variant.');
    return { sku, optionValues: variant.optionValues, mrpAmountPaise: Number(variant.mrpAmountPaise), saleAmountPaise: Number(variant.saleAmountPaise), initialStock: Number(variant.initialStock), isDefault: variant.isDefault };
  });
  if (variants.filter((variant) => variant.isDefault).length !== 1) throw new Error('Choose exactly one default variant.');
  return { ...details, images: values.images, variants };
}
export async function createEcommerceProduct(api, values, signal) {
  const data = unwrap(await api.post(endpoint, ecommerceProductPayload(values), { signal }));
  return data?.ecommerceProduct ?? data?.product ?? data;
}
export async function fetchEcommerceProducts(api, { page = 1, limit = 20, status = 'DRAFT', signal } = {}) {
  const response = await api.get(endpoint, { params: { page, limit, ...(status ? { status } : {}) }, signal });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.products ?? data?.ecommerceProducts ?? data?.items ?? data?.results;
  if (!Array.isArray(items) || items.some((item) => !record(item) || !ecommerceProductId(item))) throw new Error('The server returned an invalid product list.');
  const meta = data?.pagination ?? data?.meta?.pagination ?? data?.meta ?? response.data?.pagination ?? data ?? {};
  const count = meta.total ?? meta.totalCount ?? meta.totalItems;
  const total = count != null && integer(count) ? Number(count) : -1;
  const hasNext = typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : typeof meta.hasNext === 'boolean' ? meta.hasNext : total >= 0 ? page * limit < total : meta.totalPages ? page < Number(meta.totalPages) : items.length === limit;
  return { items, total, hasNext };
}
export async function fetchEcommerceProduct(api, id, signal) {
  const data = unwrap(await api.get(`${endpoint}/${requiredId(id)}`, { signal }));
  const product = data?.ecommerceProduct ?? data?.product ?? data;
  if (!record(product) || typeof product.title !== 'string' || !ecommerceProductId(product)) throw new Error('Product details are unavailable.');
  return product;
}
export async function publishEcommerceProduct(api, id, signal) {
  return unwrap(await api.post(`${endpoint}/${requiredId(id)}/publish`, {}, { signal }));
}
export async function adjustEcommerceStock(api, id, values, signal) {
  if (!integer(values.quantity) || Number(values.quantity) < 1) throw new Error('Enter a positive whole quantity.');
  if (values.type !== 'STOCK_RECEIVED') throw new Error('Choose a supported adjustment type.');
  if (typeof values.note !== 'string' || !values.note.trim()) throw new Error('Enter a stock adjustment note.');
  return unwrap(await api.post(`/admin/ecommerce/variants/${requiredId(id)}/inventory-adjustments`, { quantity: Number(values.quantity), type: values.type, note: values.note.trim() }, { signal }));
}

export async function uploadEcommerceProductImage(api, file, signal) {
  if (!(file instanceof Blob) || !file.size || !file.type.startsWith('image/')) throw new Error('Choose a valid image file.');
  const form = new FormData();
  form.append('purpose', 'ecommerce-product-media');
  form.append('file', file);
  const data = unwrap(await api.post('/uploads/image', form, { signal, headers: { 'Content-Type': undefined } }));
  const uploaded = data?.cloudinary ?? data?.image ?? data?.file ?? data?.upload ?? data;
  const url = uploaded?.secure_url || uploaded?.secureUrl || uploaded?.url || data?.url;
  const publicId = uploaded?.public_id || uploaded?.publicId || data?.public_id || data?.publicId;
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || typeof publicId !== 'string' || !publicId.trim()) throw new Error('Upload response did not include a valid image URL and public ID.');
  return { url, publicId };
}

export function ecommerceProductImagePayload(values) {
  if (typeof values.url !== 'string' || !/^https?:\/\//i.test(values.url)) throw new Error('A valid uploaded image URL is required.');
  if (typeof values.publicId !== 'string' || !values.publicId.trim()) throw new Error('The uploaded image public ID is required.');
  if (typeof values.altText !== 'string' || !values.altText.trim()) throw new Error('Enter an image description.');
  if (!integer(values.sortOrder)) throw new Error('Image sort order must be a non-negative whole number.');
  return { url: values.url, publicId: values.publicId.trim(), altText: values.altText.trim(), sortOrder: Number(values.sortOrder) };
}

export async function attachEcommerceProductImage(api, id, values, signal) {
  return unwrap(await api.post(`${endpoint}/${requiredId(id)}/images`, ecommerceProductImagePayload(values), { signal }));
}

export function ecommerceLiveVariantPayload(values, optionDefinitions = [], existingVariants = []) {
  const sku = typeof values.sku === 'string' ? values.sku.trim() : '';
  if (!sku) throw new Error('Enter a variant SKU.');
  if (existingVariants.some((variant) => variant.sku?.trim().toLowerCase() === sku.toLowerCase())) throw new Error('A variant with this SKU already exists.');
  if (!record(values.optionValues) || Object.keys(values.optionValues).length !== optionDefinitions.length || optionDefinitions.some((option) => !option.values.includes(values.optionValues[option.name]))) throw new Error('Choose a valid value for every variant option.');
  if (existingVariants.some((variant) => Object.keys(variant.optionValues || {}).length === optionDefinitions.length && optionDefinitions.every((option) => variant.optionValues?.[option.name] === values.optionValues[option.name]))) throw new Error('This option combination already has a variant.');
  if (![values.mrpAmountPaise, values.saleAmountPaise, values.initialStock].every(integer)) throw new Error('Prices in paise and initial stock must be non-negative whole numbers.');
  if (Number(values.saleAmountPaise) > Number(values.mrpAmountPaise)) throw new Error('Sale price cannot exceed MRP.');
  return { sku, optionValues: values.optionValues, mrpAmountPaise: Number(values.mrpAmountPaise), saleAmountPaise: Number(values.saleAmountPaise), initialStock: Number(values.initialStock) };
}

export async function createEcommerceVariant(api, id, values, { optionDefinitions = [], existingVariants = [], signal } = {}) {
  const payload = ecommerceLiveVariantPayload(values, optionDefinitions, existingVariants);
  const data = unwrap(await api.post(`${endpoint}/${requiredId(id)}/variants`, payload, { signal }));
  return data?.variant ?? data?.ecommerceVariant ?? data;
}

export function ecommerceVariantUpdatePayload(values) {
  if (!integer(values.saleAmountPaise)) throw new Error('Sale price must be a non-negative whole paise amount.');
  if (typeof values.isActive !== 'boolean') throw new Error('Choose whether the variant is active.');
  return { saleAmountPaise: Number(values.saleAmountPaise), isActive: values.isActive };
}

export async function updateEcommerceVariant(api, id, values, signal) {
  const data = unwrap(await api.patch(`/admin/ecommerce/variants/${requiredId(id)}`, ecommerceVariantUpdatePayload(values), { signal }));
  return data?.variant ?? data?.ecommerceVariant ?? data;
}

export async function updateEcommerceProduct(api, id, values, signal) {
  const data = unwrap(await api.patch(`${endpoint}/${requiredId(id)}`, ecommerceProductUpdatePayload(values), { signal }));
  return data?.ecommerceProduct ?? data?.product ?? data;
}
export async function archiveEcommerceProduct(api, id, signal) {
  return unwrap(await api.post(`${endpoint}/${requiredId(id)}/archive`, {}, { signal }));
}
