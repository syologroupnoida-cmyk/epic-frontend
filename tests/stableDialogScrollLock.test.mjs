import test from 'node:test';
import assert from 'node:assert/strict';
import { lockViewportScroll } from '../src/util/stableDialogScrollLock.mjs';

test('dialog keeps existing scrollbar space without changing right padding and restores styles', () => {
  const root = { clientWidth: 1265, style: { overflowY: 'auto', scrollbarGutter: '', paddingRight: '8px' } };
  const restore = lockViewportScroll(root, 1280);
  assert.equal(root.style.overflowY, 'hidden');
  assert.equal(root.style.scrollbarGutter, 'stable');
  assert.equal(root.style.paddingRight, '8px');
  restore();
  assert.deepEqual(root.style, { overflowY: 'auto', scrollbarGutter: '', paddingRight: '8px' });
});

test('dialog avoids creating a gutter on overlay-scrollbar screens and preserves existing gutters', () => {
  const overlay = { clientWidth: 1280, style: { overflowY: '', scrollbarGutter: '' } };
  const restore = lockViewportScroll(overlay, 1280);
  assert.equal(overlay.style.scrollbarGutter, '');
  restore();
  assert.equal(overlay.style.overflowY, '');
  const stable = { clientWidth: 1250, style: { overflowY: 'scroll', scrollbarGutter: 'stable both-edges' } };
  const restoreStable = lockViewportScroll(stable, 1280);
  assert.equal(stable.style.scrollbarGutter, 'stable both-edges');
  restoreStable();
  assert.equal(stable.style.overflowY, 'scroll');
});
