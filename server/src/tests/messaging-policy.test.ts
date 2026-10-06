import assert from 'node:assert/strict';
import test from 'node:test';
import { decideMessageRequest } from '../messaging-policy.js';

test('everyone accepts a new request regardless of the follow relationship', () => {
  assert.equal(decideMessageRequest('everyone', false), 'accepted');
  assert.equal(decideMessageRequest('everyone', true), 'accepted');
});

test('followers keeps non-followers in the request inbox', () => {
  assert.equal(decideMessageRequest('followers', false), 'pending');
  assert.equal(decideMessageRequest('followers', true), 'accepted');
});

test('nobody blocks new direct conversations', () => {
  assert.equal(decideMessageRequest('nobody', false), 'blocked');
  assert.equal(decideMessageRequest('nobody', true), 'blocked');
});
