import test from 'node:test';
import assert from 'node:assert/strict';
import { marketplaceVenueDetailUrl, marketplaceVenuesUrl, normalizeMarketplaceVenues, venueHref } from '../src/util/marketplaceVenues.mjs';
import { API_BASE_URL } from '../src/util/apiBaseUrl.mjs';

test('venue queries use the venue endpoint with supported optional filters', () => {
  const url = new URL(marketplaceVenuesUrl({ search: ' Palace ', cityId: 'city/1', serviceSubcategoryId: 'banquet-1' }), 'https://example.com');
  assert.equal(url.pathname, new URL(`${API_BASE_URL}/marketplace/venue-properties`).pathname);
  assert.deepEqual(Object.fromEntries(url.searchParams), { page: '1', limit: '20', search: 'Palace', cityId: 'city/1', serviceSubcategoryId: 'banquet-1' });
  assert.equal(marketplaceVenuesUrl(), `${API_BASE_URL}/marketplace/venue-properties?page=1&limit=20`);
  assert.equal(marketplaceVenueDetailUrl('palace/one'), `${API_BASE_URL}/marketplace/venue-properties/palace%2Fone`);
  assert.equal(venueHref({ slug: 'palace/one' }), '/venues/palace%2Fone');
  assert.equal(venueHref({ venuePropertySlug: 'palace' }), '/venues/palace');
  assert.equal(venueHref({ id: '1' }), '');
});

test('venue pagination handles documented collections, empty pages, and malformed data', () => {
  const items = Array.from({ length: 20 }, (_, id) => ({ id }));
  assert.equal(normalizeMarketplaceVenues({ venueProperties: items, pagination: { total: 21 } }).hasNextPage, true);
  assert.equal(normalizeMarketplaceVenues({ venueProperties: items, pagination: { total: 20 } }).hasNextPage, false);
  assert.equal(normalizeMarketplaceVenues({ properties: [], pagination: { total: 0 } }).total, 0);
  assert.equal(normalizeMarketplaceVenues({ venueProperties: items.slice(0, 2), pagination: { hasNextPage: true } }).hasNextPage, false);
  assert.deepEqual(normalizeMarketplaceVenues(items).items, items);
  assert.throws(() => normalizeMarketplaceVenues({}), /read wedding venues/);
});
