'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  findNonFollowers,
  normalizeUsername,
  uniqueNormalizedUsernames
} = require('../src/compare');

test('finds users followed but not following back', () => {
  const following = ['alice', 'bob', 'charlie'];
  const followers = ['bob'];

  assert.deepEqual(findNonFollowers(following, followers), ['alice', 'charlie']);
});

test('normalizes usernames case-insensitively and strips @ prefix', () => {
  assert.equal(normalizeUsername(' @Alice '), 'alice');

  const following = ['@Alice', 'BOB'];
  const followers = ['alice'];

  assert.deepEqual(findNonFollowers(following, followers), ['bob']);
});

test('deduplicates usernames while preserving first normalized order', () => {
  assert.deepEqual(uniqueNormalizedUsernames(['ALICE', 'alice', '@Bob', 'bob']), ['alice', 'bob']);
  assert.deepEqual(findNonFollowers(['ALICE', 'alice', '@Bob'], ['charlie']), ['alice', 'bob']);
});

test('handles empty follower and following lists', () => {
  assert.deepEqual(findNonFollowers([], []), []);
  assert.deepEqual(findNonFollowers(['alice'], []), ['alice']);
  assert.deepEqual(findNonFollowers([], ['alice']), []);
});
