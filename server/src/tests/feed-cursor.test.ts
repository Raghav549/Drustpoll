import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeFeedCursor, encodeFeedCursor } from '../feed-cursor.js';

test('feed cursor round-trips deterministically', () => {
  const input = { createdAt: '2026-09-02T10:20:30.000Z', id: 'post-123' };
  assert.deepEqual(decodeFeedCursor(encodeFeedCursor(input)), input);
});

test('feed cursor rejects malformed input', () => {
  assert.throws(() => decodeFeedCursor('not-a-cursor'));
  assert.throws(() => decodeFeedCursor(''));
});
