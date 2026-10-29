import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicCategoryStore } from '../src/util/publicCategoryStore.mjs';

const items = [{ id: 'photo', name: 'Photography' }];

test('footer remount and Strict Mode replay share one load without clearing the successful data', async () => {
  let calls = 0;
  let resolve;
  const store = createPublicCategoryStore(() => {
    calls++;
    return new Promise((done) => { resolve = done; });
  });
  const leaveFirstPage = store.subscribe(() => {});
  leaveFirstPage();
  const leaveNextPage = store.subscribe(() => {});
  const pending = store.reload();
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve(items);
  await pending;
  assert.deepEqual(store.getSnapshot(), { items, loading: false, error: '' });
  leaveNextPage();
  const leaveThirdPage = store.subscribe(() => {});
  assert.strictEqual(store.getSnapshot().items, items);
  assert.equal(calls, 1);
  assert.deepEqual(store.getServerSnapshot().items, []);
  leaveThirdPage();
});

test('footer keeps existing links during refresh errors and supports retry', async () => {
  let time = 0;
  let calls = 0;
  const store = createPublicCategoryStore(async () => {
    if (++calls === 2) throw new Error('Network unavailable');
    return calls === 1 ? items : [...items, { id: 'decor', name: 'Decor' }];
  }, { now: () => time, maxAge: 100 });
  let leave = store.subscribe(() => {});
  await store.reload();
  leave();
  time = 101;
  leave = store.subscribe(() => {});
  assert.strictEqual(store.getSnapshot().items, items);
  await store.reload();
  assert.equal(store.getSnapshot().error, 'Network unavailable');
  assert.strictEqual(store.getSnapshot().items, items);
  await store.reload();
  assert.equal(store.getSnapshot().items.length, 2);
  assert.equal(store.getSnapshot().error, '');
  assert.equal(calls, 3);
  leave();
});

test('first-load errors can recover without a page reload', async () => {
  let fail = true;
  const store = createPublicCategoryStore(async () => {
    if (fail) throw new Error('Try again');
    return items;
  });
  await store.reload();
  assert.equal(store.getSnapshot().loading, false);
  assert.equal(store.getSnapshot().error, 'Try again');
  fail = false;
  await store.reload();
  assert.strictEqual(store.getSnapshot().items, items);
});
