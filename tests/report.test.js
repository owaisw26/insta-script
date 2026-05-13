'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { buildCsv, writeNonFollowersReport } = require('../src/report');
const { findNonFollowers } = require('../src/compare');

test('builds a one-column username CSV', () => {
  assert.equal(buildCsv(['alice', 'bob']), 'username\nalice\nbob\n');
});

test('escapes CSV values when needed', () => {
  assert.equal(buildCsv(['alice', 'bob,"quoted"']), 'username\nalice\n"bob,""quoted"""\n');
});

test('writes a mock non-followers report from sample arrays', async () => {
  const reportDir = await fs.mkdtemp(path.join(os.tmpdir(), 'insta-script-report-'));
  const nonFollowers = findNonFollowers(['alice', 'bob', 'charlie'], ['bob']);
  const reportPath = await writeNonFollowersReport(nonFollowers, {
    reportDir,
    date: new Date('2026-05-13T12:34:56')
  });

  assert.equal(path.basename(reportPath), 'non-followers-2026-05-13-12-34-56.csv');
  assert.equal(await fs.readFile(reportPath, 'utf8'), 'username\nalice\ncharlie\n');
});
