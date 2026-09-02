import assert from 'node:assert/strict';
import test from 'node:test';
import { diversityContribution, exposureNormalizedQuality } from '../recommendation-quality.js';

test('exposure-normalized quality stays bounded and discounts overexposure', () => {
  const baseline = exposureNormalizedQuality({ interactions: 20, saves: 10, comments: 5, shares: 5, impressions: 100, exposureCount: 0, durationMs: 30000 });
  const exposed = exposureNormalizedQuality({ interactions: 20, saves: 10, comments: 5, shares: 5, impressions: 100, exposureCount: 100, durationMs: 30000 });
  assert.ok(baseline >= 0 && baseline <= 1);
  assert.ok(exposed >= 0 && exposed <= 1);
  assert.ok(exposed < baseline);
});

test('diversity contribution penalizes repeated creator/topic/format', () => {
  const selected = [{ creatorId: 'a', topic: 'science', format: 'video' }];
  assert.equal(diversityContribution({ creatorId: 'b', topic: 'music', format: 'image' }, selected), 1);
  assert.equal(diversityContribution({ creatorId: 'a', topic: 'science', format: 'video' }, selected), 0);
});
