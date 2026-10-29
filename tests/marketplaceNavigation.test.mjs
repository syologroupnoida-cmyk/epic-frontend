import test from 'node:test';
import assert from 'node:assert/strict';
import { homeMarketplaceHref, readMarketplaceFilters } from '../src/util/marketplaceNavigation.mjs';

const categories = [
  { id: 'photo', subcategories: [{ id: 'candid' }, { id: 'film' }] },
  { id: 'decor', subcategories: [{ id: 'floral' }] },
];
const listing = { title: 'Wedding team', services: [
  { serviceSubcategory: { id: 'candid', category: { id: 'photo' } } },
  { serviceSubcategoryId: 'film' },
  { subcategory: { id: 'floral', serviceCategory: { id: 'decor' } } },
] };
const query = (href) => Object.fromEntries(new URL(href, 'https://example.com').searchParams);

test('home service links apply the clicked listing services and their parent categories', () => {
  const href = homeMarketplaceHref(listing, { categories });
  assert.ok(href.startsWith('/services?'));
  assert.deepEqual(readMarketplaceFilters(query(href), categories), {
    categoryIds: ['photo', 'decor'], subcategoryIds: ['candid', 'film', 'floral'], search: '',
  });
});

test('the selected home category keeps unrelated services out of the destination filter', () => {
  const href = homeMarketplaceHref(listing, { selectedId: 'photo', categories });
  assert.deepEqual(readMarketplaceFilters(query(href), categories), {
    categoryIds: ['photo'], subcategoryIds: ['candid', 'film'], search: '',
  });
  assert.deepEqual(readMarketplaceFilters(query(homeMarketplaceHref({ title: 'Team' }, { selectedId: 'photo' }))), {
    categoryIds: ['photo'], subcategoryIds: [], search: '',
  });
});

test('venue links accept nested venue types, direct IDs, and the selected home type', () => {
  const property = { venueTypes: [{ venueType: { id: 'banquet' } }, { serviceSubcategoryId: 'garden' }] };
  assert.equal(homeMarketplaceHref(property, { venue: true }), '/venues?serviceSubcategoryId=banquet%2Cgarden');
  assert.equal(homeMarketplaceHref(property, { venue: true, selectedId: 'garden' }), '/venues?serviceSubcategoryId=garden');
  assert.equal(homeMarketplaceHref({ venueTypeIds: ['palace'] }, { venue: true }), '/venues?serviceSubcategoryId=palace');
});

test('refresh restores filters and missing category IDs are resolved from the catalog', () => {
  const href = homeMarketplaceHref({ services: [{ serviceSubcategoryId: 'candid' }] });
  assert.deepEqual(readMarketplaceFilters(query(href), categories), {
    categoryIds: ['photo'], subcategoryIds: ['candid'], search: '',
  });
  assert.deepEqual(readMarketplaceFilters({ serviceSubcategoryId: ['candid,film', 'candid'], serviceCategoryId: ' photo ' }, categories), {
    categoryIds: ['photo'], subcategoryIds: ['candid', 'film'], search: '',
  });
  assert.deepEqual(readMarketplaceFilters({}), { categoryIds: [], subcategoryIds: [], search: '' });
});

test('cards without category metadata use encoded text search instead of an unfiltered page', () => {
  const href = homeMarketplaceHref({ title: 'Royal Palace & Garden' }, { venue: true });
  assert.equal(href, '/venues?search=Royal+Palace+%26+Garden');
  assert.equal(readMarketplaceFilters(query(href)).search, 'Royal Palace & Garden');
});
