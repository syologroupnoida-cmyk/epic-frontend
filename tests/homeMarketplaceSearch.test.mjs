import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMarketplaceSelection } from '../src/util/marketplaceSelection.mjs';

test('home service and property search sends the term and category filter to the correct API', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    calls.push(url);
    return { ok: true, json: async () => ({ data: {
      [url.pathname.endsWith('venue-properties') ? 'venueProperties' : 'listings']: [{ id: 'match', title: 'Search match' }],
      pagination: { total: 1 },
    } }) };
  };
  for (const venue of [false, true]) {
    const data = await loadMarketplaceSelection({ venue, search: venue ? 'Palace' : 'Candid', subcategoryIds: ['selected-type'], page: 1, limit: 20 });
    const url = calls.at(-1);
    assert.ok(url.pathname.endsWith(venue ? '/marketplace/venue-properties' : '/marketplace/listings'));
    assert.equal(url.searchParams.get('search'), venue ? 'Palace' : 'Candid');
    assert.equal(url.searchParams.get('serviceSubcategoryId'), 'selected-type');
    assert.equal(url.searchParams.get('page'), '1');
    assert.equal(data.items[0].id, 'match');
  }
  await loadMarketplaceSelection({ search: '', page: 1 });
  assert.equal(calls.at(-1).searchParams.has('search'), false);
});
