import test from 'node:test';
import assert from 'node:assert/strict';
import { products, categories, filterProducts, formatPrice } from '../src/modules/ecommerce/data/catalog.mjs';

test('shop combines category, price, rating and stock filters', () => {
  const result = filterProducts(products, { selectedCategories: ['invites'], maxPrice: 2200, rating: 4.5, availability: ['in-stock'] });
  assert.deepEqual(result.map((item) => item.id), ['invites-1']);
  assert.equal(filterProducts(products, { selectedCategories: ['groom'], search: 'necklace' }).length, 0);
  assert.equal(filterProducts(products, { search: '  WEDDING INVITES  ' })[0].id, 'invites-1');
});

test('wishlist filtering and price sorting preserve the original catalog', () => {
  const originalIds = products.map((item) => item.id);
  const result = filterProducts(products, { wishlistOnly: true, wishlist: ['bride-1', 'invites-1'], sort: 'price-low' });
  assert.deepEqual(result.map((item) => item.id), ['invites-1', 'bride-1']);
  assert.equal(filterProducts(products, { wishlistOnly: true }).length, 0);
  assert.deepEqual(products.map((item) => item.id), originalIds);
  const descending = filterProducts(products, { sort: 'price-high' });
  assert.ok(descending.every((item, index) => index === 0 || descending[index - 1].price >= item.price));
});

test('all sample products reference a category and valid rupee prices', () => {
  assert.equal(new Set(products.map((item) => item.id)).size, products.length);
  assert.ok(products.every((item) => categories.some((category) => category.id === item.category) && item.price < item.originalPrice));
  assert.equal(formatPrice(49999), '₹49,999');
});
