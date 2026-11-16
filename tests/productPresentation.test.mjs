import test from 'node:test';
import assert from 'node:assert/strict';
import { hslToHex, imageDescriptionFromFilename, isColorOption, productColorHex, productEditorValues, productTableSummary } from '../src/util/productPresentation.mjs';

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
