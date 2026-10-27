import { marketplaceListingsUrl, normalizeMarketplaceListings } from './marketplaceListings.mjs';

export function marketplaceVenuesUrl(filters = {}) {
  return marketplaceListingsUrl(filters).replace('/marketplace/listings?', '/marketplace/venue-properties?');
}

export function venueHref(property) {
  const slug = property.slug || property.venuePropertySlug || property.propertySlug;
  return slug ? `/venues/${encodeURIComponent(slug)}` : '';
}

export function normalizeMarketplaceVenues(data, page = 1, limit = 20) {
  const items = Array.isArray(data) ? data : data?.venueProperties || data?.properties || data?.items || data?.results;
  if (!Array.isArray(items)) throw new Error('Unable to read wedding venues.');
  return normalizeMarketplaceListings({ ...data, listings: items }, page, limit);
}

export async function requestVenues(url, signal) {
  const response = await fetch(url, { signal, cache: 'no-store' });
  let body;
  try { body = await response.json(); }
  catch { throw new Error('Unable to load wedding venues. Please try again.'); }
  if (!response.ok || body?.success === false) throw new Error(body?.message || 'Unable to load wedding venues. Please try again.');
  return body?.data ?? body;
}
