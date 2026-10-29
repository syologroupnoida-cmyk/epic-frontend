import test from 'node:test';
import assert from 'node:assert/strict';
import { marketplaceListingDetailUrl, marketplaceListingsUrl, normalizeMarketplaceListings, listingHref, serviceInfo, publicMediaUrl, listingPrice } from '../src/util/marketplaceListings.mjs';
import { API_BASE_URL } from '../src/util/apiBaseUrl.mjs';

test('marketplace query sends real filters and omits empty optional IDs', () => {
  const url = new URL(marketplaceListingsUrl({ search: ' Wedding ', cityId: 'city 1', serviceSubcategoryId: 'sub/1' }), 'https://example.com');
  assert.deepEqual(Object.fromEntries(url.searchParams), { page: '1', limit: '20', search: 'Wedding', cityId: 'city 1', serviceSubcategoryId: 'sub/1' });
  assert.equal(marketplaceListingsUrl(), `${API_BASE_URL}/marketplace/listings?page=1&limit=20`);
  assert.equal(marketplaceListingDetailUrl('wedding/package'), `${API_BASE_URL}/marketplace/listings/wedding%2Fpackage`);
  assert.equal(listingHref({ slug: 'wedding/package' }), '/services/wedding%2Fpackage');
  assert.equal(listingHref({ id: '1' }), '');
});

test('marketplace pagination stops at totals or a short page', () => {
  const listings = Array.from({ length: 20 }, (_, id) => ({ id }));
  assert.equal(normalizeMarketplaceListings({ listings, pagination: { total: 20 } }).hasNextPage, false);
  assert.equal(normalizeMarketplaceListings({ listings, pagination: { total: 21 } }).hasNextPage, true);
  assert.equal(normalizeMarketplaceListings({ listings: listings.slice(0, 2), pagination: { hasNextPage: true } }).hasNextPage, false);
  assert.equal(normalizeMarketplaceListings({ listings }).hasNextPage, false);
  assert.throws(() => normalizeMarketplaceListings({}), /read service/);
});

test('public service fields preserve zero prices and normalize nested categories without unsafe media', () => {
  assert.equal(listingPrice(null), 'Price on request');
  assert.notEqual(listingPrice(0), 'Price on request');
  assert.deepEqual(serviceInfo({ service: { name: 'Candid', category: { name: 'Photography' } } }), { name: 'Candid', category: 'Photography' });
  assert.equal(publicMediaUrl('javascript:alert(1)'), '');
  assert.equal(publicMediaUrl('//untrusted.example.com/photo'), '');
  assert.equal(publicMediaUrl('https://images.example.com/photo.jpg'), 'https://images.example.com/photo.jpg');
});
