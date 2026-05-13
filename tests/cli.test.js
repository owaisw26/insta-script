'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../src/cli');

test('parses username and default scraper options', () => {
  assert.deepEqual(parseArgs(['--username', '@ExampleUser']), {
    username: 'ExampleUser',
    headless: false,
    maxScrolls: 250,
    noNewLimit: 8,
    timeoutMs: 300000
  });
});

test('parses numeric and path options', () => {
  assert.deepEqual(parseArgs([
    '--username=me',
    '--profile-dir',
    '.tmp/profile',
    '--report-dir=out',
    '--max-scrolls',
    '12',
    '--no-new-limit=3',
    '--timeout-ms',
    '4000',
    '--headless=true'
  ]), {
    username: 'me',
    profileDir: '.tmp/profile',
    reportDir: 'out',
    maxScrolls: 12,
    noNewLimit: 3,
    timeoutMs: 4000,
    headless: true
  });
});

test('requires username unless help is requested', () => {
  assert.throws(() => parseArgs([]), /--username is required/);
  assert.equal(parseArgs(['--help']).help, true);
});
