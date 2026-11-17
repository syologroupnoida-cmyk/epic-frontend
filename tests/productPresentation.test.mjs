import test from 'node:test';
import assert from 'node:assert/strict';
import { hslToHex, imageDescriptionFromFilename, isColorOption, productColorHex, productEditorImages, productEditorValues, productTableSummary } from '../src/util/productPresentation.mjs';

test('editor restores saved images from URL strings and asset objects without losing image references', () => {
  const images = productEditorImages({ images: [
    'https://example.test/front-view.jpg',
    { id: 'image-one', imageUrl: 'https://example.test/back.jpg', publicId: 'products/back', sortOrder: 4, altText: 'Back' },
    { ecommerceProductImageId: 'image-two', image: { secure_url: 'https://example.test/side.jpg', public_id: 'products/side' } },
    { secureUrl: 'https://example.test/detail.jpg' },
    { url: 'javascript:alert(1)' }, null,
  ] });
  assert.equal(images.length, 4);
  assert.equal(images[0].url, 'https://example.test/front-view.jpg');
  assert.equal(images[0].altText, 'front view');
  assert.equal(images[1].id, 'image-one');
  assert.equal(images[1].sortOrder, 4);
  assert.equal(images[1].altText, 'Back');
  assert.equal(images[2].ecommerceProductImageId, 'image-two');
  assert.equal(images[2].publicId, 'products/side');
  assert.ok(images.every(image => image.attached && image.status === 'attached'));
  assert.equal(productEditorImages({ images: [], productImages: [{ imageUrl: '/saved.jpg' }] })[0].url, '/saved.jpg');
});

test('product list shows prices in rupees, accurate stock and creation date without inventing missing values', () => {
  const row = { createdAt: '2026-11-12T10:00:00Z', variants: [{ saleAmountPaise: 15000, stockQuantity: 0, isDefault: true }, { saleAmountPaise: 20000, stockQuantity: 3 }] };
  const summary = productTableSummary(row);
  assert.ok(summary.price.includes('150.00'));
  assert.equal(summary.stock, 3);
  assert.equal(summary.variantCount, 2);
  assert.equal(summary.created, '12 Nov 2026');
  assert.equal(productTableSummary({ variants: [{ sku: 'no-stock' }] }).stock, '—');
  assert.deepEqual(productTableSummary({}), { price: '—', variantCount: '—', stock: '—', created: '—' });
});

test('product edit values preserve IDs, false specifications, zero GST and option values without mutating loaded data', () => {
  const row = { category: { ecommerceCategoryId: 'cat-one' }, subcategoryId: 'sub-one', title: 'Lehenga', description: 'Silk', brandName: 'Epic', gstPercentage: 0, specifications: { blouseIncluded: false }, optionDefinitions: [{ name: 'Color', values: ['Maroon'] }] };
  const values = productEditorValues(row);
  assert.equal(values.categoryId, 'cat-one');
  assert.equal(values.subcategoryId, 'sub-one');
  assert.equal(values.gstPercentage, 0);
  assert.equal(values.specifications.blouseIncluded, false);
  assert.equal(values.title, row.title);
  values.optionDefinitions[0].values.push('Red');
  assert.deepEqual(row.optionDefinitions[0].values, ['Maroon']);
});

test('filename descriptions and custom colors retain API-compatible string values', () => {
  assert.equal(imageDescriptionFromFilename('royal-lehenga_side_view.JPG'), 'royal lehenga side view');
  assert.equal(imageDescriptionFromFilename(''), 'Product image');
  assert.equal(isColorOption(' Colour '), true);
  assert.equal(isColorOption('Size'), false);
  assert.equal(productColorHex('Maroon'), '#800020');
  assert.equal(productColorHex('#123abc'), '#123abc');
  assert.equal(hslToHex(0, 100, 50), '#ff0000');
  assert.equal(hslToHex(120, 100, 50), '#00ff00');
  assert.equal(hslToHex(240, 100, 50), '#0000ff');
});
