export function listingName(value) {
  return typeof value === 'string' ? value : value?.name || value?.title || value?.businessName || '';
}

export function listingPrice(value) {
  return value == null || value === '' || !Number.isFinite(Number(value)) ? 'Price on request' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
}

export function publicMediaUrl(value) {
  return typeof value === 'string' && /^(https?:\/\/|\/(?!\/))/.test(value) ? value : '';
}

export function serviceInfo(service) {
  const subcategory = service.serviceSubcategory || service.subcategory || service.service || {};
  return {
    name: listingName(subcategory) || service.subcategoryName || service.name || '',
    category: listingName(subcategory.category || subcategory.serviceCategory || service.category || service.serviceCategory) || service.categoryName || '',
  };
}

export function listingHref(listing) {
  const slug = listing.slug || listing.listingSlug;
  return slug ? `/services/${encodeURIComponent(slug)}` : '';
}

export function marketplaceListingsUrl({ page = 1, limit = 20, search = '', cityId = '', serviceSubcategoryId = '' } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  for (const [key, value] of Object.entries({ search, cityId, serviceSubcategoryId })) {
    if (value.trim()) query.set(key, value.trim());
  }
  return `/api/marketplace/listings?${query}`;
}

export async function requestMarketplace(url, signal) {
  const response = await fetch(url, { signal, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok || body?.success === false) throw new Error(body?.message || 'Unable to load services. Please try again.');
  return body?.data ?? body;
}

export function normalizeMarketplaceListings(data, page = 1, limit = 20) {
  const items = Array.isArray(data) ? data : data?.listings || data?.items || data?.results;
  if (!Array.isArray(items)) throw new Error('Unable to read service listings.');
  const pagination = data?.pagination || data?.meta || {};
  const rawTotal = data?.total ?? pagination.total ?? pagination.totalItems;
  const total = rawTotal == null ? null : Number(rawTotal);
  const hasNextPage = items.length < limit ? false : total !== null ? page * limit < total : Boolean(pagination.hasNextPage ?? (page < Number(pagination.totalPages || 0)));
  return { items, total, hasNextPage };
}
