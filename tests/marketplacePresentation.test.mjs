import test from 'node:test';
import assert from 'node:assert/strict';
import { marketplaceRating, presentMarketplaceItems } from '../src/util/marketplacePresentation.mjs';

const items = [
  { id: 'unknown', startingPrice: null, rating: null },
  { id: 'free', startingPrice: 0, averageRating: 4.8 },
  { id: 'mid', startingPrice: 10000, rating: 4.2 },
  { id: 'high', startingPrice: 25000, rating: 4.9 },
];
test('price and rating filters preserve zero and exclude missing values when required', () => {
  assert.equal(marketplaceRating(items[0]), null);
  assert.deepEqual(presentMarketplaceItems(items).map(item => item.id), ['unknown', 'free', 'mid', 'high']);
  assert.deepEqual(presentMarketplaceItems(items, { maxPrice: 10000 }).map(item => item.id), ['free', 'mid']);
  assert.deepEqual(presentMarketplaceItems(items, { minPrice: 5000, maxPrice: 20000, minRating: 4 }).map(item => item.id), ['mid']);
  assert.deepEqual(presentMarketplaceItems(items, { minRating: 4.5 }).map(item => item.id), ['free', 'high']);
});
test('sorting keeps unknown prices last and does not mutate API records', () => {
  assert.deepEqual(presentMarketplaceItems(items, { sort: 'price-low' }).map(item => item.id), ['free', 'mid', 'high', 'unknown']);
  assert.deepEqual(presentMarketplaceItems(items, { sort: 'price-high' }).map(item => item.id), ['high', 'mid', 'free', 'unknown']);
  assert.deepEqual(presentMarketplaceItems(items, { sort: 'rating' }).map(item => item.id), ['high', 'free', 'mid', 'unknown']);
  assert.equal(items[0].id, 'unknown');
});
