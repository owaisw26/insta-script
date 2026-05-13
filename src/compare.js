'use strict';

function normalizeUsername(username) {
  if (typeof username !== 'string') {
    return '';
  }

  return username.trim().replace(/^@+/, '').toLowerCase();
}

function uniqueNormalizedUsernames(usernames) {
  const seen = new Set();
  const unique = [];

  for (const username of usernames || []) {
    const normalized = normalizeUsername(username);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

function findNonFollowers(following, followers) {
  const followerSet = new Set(uniqueNormalizedUsernames(followers));

  return uniqueNormalizedUsernames(following).filter((username) => !followerSet.has(username));
}

module.exports = {
  findNonFollowers,
  normalizeUsername,
  uniqueNormalizedUsernames
};
