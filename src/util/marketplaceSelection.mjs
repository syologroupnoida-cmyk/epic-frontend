import { marketplaceListingsUrl, normalizeMarketplaceListings, requestMarketplace } from './marketplaceListings.mjs';
import { marketplaceVenuesUrl, normalizeMarketplaceVenues, requestVenues } from './marketplaceVenues.mjs';

// The public API accepts one subcategory per request. Merge full result sets
// for checkbox selections so totals and pagination stay correct across matches.
export async function loadMarketplaceSelection({ venue = false, subcategoryIds = [], search = '', cityId = '', page = 1, limit = 20 }, signal) {
  const ids = [...new Set(subcategoryIds.filter(Boolean))].sort();
  const url = venue ? marketplaceVenuesUrl : marketplaceListingsUrl;
  const request = venue ? requestVenues : requestMarketplace;
  const normalize = venue ? normalizeMarketplaceVenues : normalizeMarketplaceListings;
  const fetchPage = async (id, currentPage) => normalize(await request(url({ page: currentPage, limit, search, cityId, serviceSubcategoryId: id || '' }), signal), currentPage, limit);
  if (ids.length < 2) return { ...await fetchPage(ids[0], page), combined: false };
  const records = new Map();
  for (let offset = 0; offset < ids.length; offset += 4) {
    const groups = await Promise.all(ids.slice(offset, offset + 4).map(async (id) => {
      const items = [];
      const seen = new Set();
      for (let currentPage = 1; ; currentPage++) {
        signal?.throwIfAborted();
        const result = await fetchPage(id, currentPage);
        let added = 0;
        for (const item of result.items) {
          const key = item.id || item._id || item.slug || JSON.stringify(item);
          if (!seen.has(key)) { seen.add(key); items.push(item); added++; }
        }
        if (!result.hasNextPage) break;
        if (!added) throw new Error('Unable to load the next results page. Please try again.');
      }
      return items;
    }));
    for (const item of groups.flat()) records.set(item.id || item._id || item.slug || JSON.stringify(item), item);
  }
  const items = [...records.values()].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  return { items, total: items.length, combined: true };
}
