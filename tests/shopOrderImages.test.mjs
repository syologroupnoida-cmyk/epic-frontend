import test from 'node:test';
import assert from 'node:assert/strict';
import { shopOrderItemImages, shopOrderItemProduct } from '../src/util/shopOrderImages.mjs';

test('order thumbnails find nested uploaded assets and do not lose snapshot images to empty products', () => {
  const item = { product: {}, productSnapshot: { slug: 'silk-set', ecommerceProductImages: [{ sortOrder: 2, image: { secure_url: 'https://images.example/second.jpg' } }, { sortOrder: 1, image: { url: '/images/first.jpg' } }] } };
  assert.deepEqual(shopOrderItemImages(item), ['/images/first.jpg', 'https://images.example/second.jpg']);
  assert.equal(shopOrderItemProduct(item).slug, 'silk-set');
});

test('order thumbnails retain backup photos and reject unsafe image URLs', () => {
  assert.deepEqual(shopOrderItemImages({ image: 'javascript:bad', imageUrl: '/primary.jpg', productVariant: { images: [{ secure_url: 'https://images.example/variant.jpg' }] }, product: { images: ['/primary.jpg', '//invalid.example/image.jpg'], thumbnailUrl: '/backup.jpg' } }), ['/primary.jpg', 'https://images.example/variant.jpg', '/backup.jpg']);
});

test('variant snapshots supply the catalog slug and image', () => {
  const item = { variantSnapshot: { product: { ecommerceProductSlug: 'silk-set', productImages: [{ imageUrl: '/silk.jpg' }] } } };
  assert.equal(shopOrderItemProduct(item).slug, 'silk-set');
  assert.deepEqual(shopOrderItemImages(item), ['/silk.jpg']);
});
