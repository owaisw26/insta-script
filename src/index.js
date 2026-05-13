#!/usr/bin/env node
'use strict';

const path = require('node:path');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const { findNonFollowers } = require('./compare');
const { parseArgs, usage } = require('./cli');
const { writeNonFollowersReport } = require('./report');

async function waitForEnter(message) {
  const rl = readline.createInterface({ input, output });
  try {
    await rl.question(message);
  } finally {
    rl.close();
  }
}

function printResults({ following, followers, nonFollowers, reportPath }) {
  console.log('');
  console.log(`Following: ${following.length}`);
  console.log(`Followers: ${followers.length}`);
  console.log(`Not following back: ${nonFollowers.length}`);
  console.log('');

  if (nonFollowers.length === 0) {
    console.log('No non-followback accounts found.');
  } else {
    for (const username of nonFollowers) {
      console.log(username);
    }
  }

  console.log('');
  console.log(`Saved CSV: ${reportPath}`);
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (options.help) {
    console.log(usage());
    return;
  }

  console.log(`Starting Instagram non-followback scrape for @${options.username}`);
  console.log('A Chromium browser window should open. Keep this terminal open while it runs.');

  const scraperOptions = {
    ...options,
    profileDir: path.resolve(options.profileDir || '.auth/instagram'),
    onLoginRequired: async () => {
      console.log('Instagram login is required in the opened browser.');
      console.log('Log in manually, complete any checkpoint prompts, then return here.');
      await waitForEnter('Press Enter after the profile page is visible...');
    },
    onListNotFound: async (listName) => {
      console.log('');
      console.log(`Instagram did not show the ${listName} link on the profile page.`);
      console.log(`In the browser, log in if needed and go to: https://www.instagram.com/${options.username}/`);
      console.log('Wait until the profile header shows posts, followers, and following.');
      console.log(`If you already clicked ${listName} and the list is open, that is OK too.`);
      await waitForEnter(`Come back to this terminal and press Enter to continue...`);
    },
    onStatus: (message) => {
      console.log(message);
    },
    onProgress: (label, count) => {
      process.stdout.write(`\rCollected ${count} ${label}...`);
    },
    onError: async (error) => {
      process.stdout.write('\n');
      console.error(`Stopped while scraping: ${error.message}`);
      if (!options.headless) {
        await waitForEnter('The browser will stay open for inspection. Press Enter to close it...');
      }
    }
  };

  const { scrapeInstagramLists } = require('./instagramScraper');
  const { followers, following } = await scrapeInstagramLists(scraperOptions);
  process.stdout.write('\n');

  const nonFollowers = findNonFollowers(following, followers);
  const reportPath = await writeNonFollowersReport(nonFollowers, {
    reportDir: options.reportDir ? path.resolve(options.reportDir) : undefined
  });

  printResults({ followers, following, nonFollowers, reportPath });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('');
    console.error(error.message);
    console.error('');
    console.error(usage());
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  printResults
};
