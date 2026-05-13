'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

function toTimestamp(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ];
  const timeParts = [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ];

  return `${parts.join('-')}-${timeParts.join('-')}`;
}

function escapeCsvValue(value) {
  const stringValue = String(value);
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildCsv(usernames) {
  const rows = ['username'];

  for (const username of usernames) {
    rows.push(escapeCsvValue(username));
  }

  return `${rows.join('\n')}\n`;
}

async function writeNonFollowersReport(usernames, options = {}) {
  const reportDir = options.reportDir || path.resolve(process.cwd(), 'reports');
  const now = options.date || new Date();
  const filename = `non-followers-${toTimestamp(now)}.csv`;
  const filePath = path.join(reportDir, filename);

  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(filePath, buildCsv(usernames), 'utf8');

  return filePath;
}

module.exports = {
  buildCsv,
  escapeCsvValue,
  toTimestamp,
  writeNonFollowersReport
};
