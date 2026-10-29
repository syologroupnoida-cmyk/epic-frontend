import test from 'node:test';
import assert from 'node:assert/strict';
import { vendorMenuHref } from '../src/util/vendorMenuNavigation.mjs';

const categories = [
  { id: 'photo', name: 'Photography Services', subcategories: [{ id: 'video', name: 'Wedding Videography' }] },
  { id: 'cake', name: 'Wedding Cakes' },
  { id: 'venue', name: 'Party Places', offeringKind: 'VENUE_PROPERTY' },
];
test('vendor menu selects subcategory and parent when available', () => {
  const href = new URL(vendorMenuHref({ title: 'Wedding Videography', slug: 'wedding-videography' }, categories), 'https://example.com');
  assert.equal(href.pathname, '/vendors');
  assert.equal(href.searchParams.get('serviceCategoryId'), 'photo');
  assert.equal(href.searchParams.get('serviceSubcategoryId'), 'video');
});
test('vendor menu aliases use catalog category IDs without an unrelated text search', () => {
  const href = new URL(vendorMenuHref({ title: 'Wedding Photographers', slug: 'wedding-photographers' }, categories), 'https://example.com');
  assert.equal(href.searchParams.get('serviceCategoryId'), 'photo');
  assert.equal(href.searchParams.has('search'), false);
});
test('uncached and unknown menu entries use a search filter and do not select venue categories', () => {
  assert.equal(new URL(vendorMenuHref({ title: 'Wedding Cakes', slug: 'wedding-cakes' }), 'https://example.com').searchParams.get('search'), 'Wedding Cakes');
  assert.equal(new URL(vendorMenuHref({ title: 'Party Places', slug: 'party-places' }, categories), 'https://example.com').searchParams.get('search'), 'Party Places');
  assert.equal(new URL(vendorMenuHref({ slug: 'unknown' }, categories), 'https://example.com').searchParams.get('serviceCategoryId'), null);
});
