'use strict';

const path = require('node:path');
const { chromium } = require('playwright');
const { normalizeUsername } = require('./compare');

const INSTAGRAM_BASE_URL = 'https://www.instagram.com';
const RESERVED_PATHS = new Set([
  'about',
  'accounts',
  'api',
  'challenge',
  'developer',
  'direct',
  'directory',
  'explore',
  'legal',
  'p',
  'privacy',
  'reel',
  'reels',
  'stories',
  'terms',
  'web'
]);

function randomDelay(minMs = 700, maxMs = 1500) {
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

async function isLoginVisible(page) {
  const usernameInput = page.locator('input[name="username"]').first();

  try {
    return page.url().includes('/accounts/login') || await usernameInput.isVisible({ timeout: 1500 });
  } catch {
    return page.url().includes('/accounts/login');
  }
}

async function ensureLoggedIn(page, onLoginRequired) {
  if (!await isLoginVisible(page)) {
    return;
  }

  await onLoginRequired();
}

async function openProfile(page, username) {
  await page.goto(`${INSTAGRAM_BASE_URL}/${encodeURIComponent(username)}/`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

async function openList(page, username, listName) {
  const profileUsername = normalizeUsername(username);
  const escapedUsername = profileUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const textPattern = new RegExp(`\\b${listName}\\b`, 'i');
  const linkPattern = new RegExp(`/${escapedUsername}/${listName}/?$`, 'i');
  const linkWithQueryPattern = new RegExp(`/${escapedUsername}/${listName}/?(?:[?#].*)?$`, 'i');

  const clickAttempts = [
    async () => page.locator(`a[href*="/${profileUsername}/${listName}"]`).first().click({ timeout: 5000 }),
    async () => page.getByRole('link', { name: textPattern }).first().click({ timeout: 5000 }),
    async () => page.locator('header').getByText(textPattern).first().click({ timeout: 5000 }),
    async () => page.getByText(textPattern).first().click({ timeout: 5000 }),
    async () => page.evaluate(({ linkSource, linkWithQuerySource, list }) => {
      const linkRegex = new RegExp(linkSource, 'i');
      const linkWithQueryRegex = new RegExp(linkWithQuerySource, 'i');
      const elements = Array.from(document.querySelectorAll('a, button, span, div'));
      const target = elements.find((element) => {
        const href = element.getAttribute('href') || '';
        const text = element.textContent || '';

        return linkRegex.test(href)
          || linkWithQueryRegex.test(href)
          || new RegExp(`\\b${list}\\b`, 'i').test(text);
      });

      if (!target) {
        return false;
      }

      target.click();
      return true;
    }, {
      linkSource: linkPattern.source,
      linkWithQuerySource: linkWithQueryPattern.source,
      list: listName
    }).then((clicked) => {
      if (!clicked) {
        throw new Error('fallback click target not found');
      }
    })
  ];

  let lastError;
  for (const clickList of clickAttempts) {
    try {
      await clickList();
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error(`Could not find the ${listName} link on @${profileUsername}'s profile. Make sure you are logged in and the profile page is visible.`);
  }

  const dialog = page.locator('div[role="dialog"]').first();
  try {
    await dialog.waitFor({ state: 'visible', timeout: 30000 });
  } catch (error) {
    throw new Error(`Clicked the ${listName} link, but Instagram did not open the ${listName} dialog.`);
  }

  await page.waitForTimeout(randomDelay(900, 1600));
}

async function openListWithManualRetry(page, username, listName, options) {
  try {
    await openList(page, username, listName);
  } catch (error) {
    await options.onListNotFound?.(listName, page);
    if (await page.locator('div[role="dialog"]').first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await page.waitForTimeout(randomDelay(900, 1600));
      return;
    }

    await openList(page, username, listName);
  }
}

async function collectUsernames(page, ownUsername) {
  const excludedUsername = normalizeUsername(ownUsername);

  return page.evaluate(({ baseUrl, reservedPaths, excluded }) => {
    const root = document.querySelector('div[role="dialog"]') || document.body;
    const reserved = new Set(reservedPaths);
    const usernames = [];
    const seen = new Set();

    for (const anchor of root.querySelectorAll('a[href]')) {
      let url;
      try {
        url = new URL(anchor.href, baseUrl);
      } catch {
        continue;
      }

      if (!url.hostname.endsWith('instagram.com')) {
        continue;
      }

      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length !== 1) {
        continue;
      }

      const username = pathParts[0].replace(/^@+/, '').trim().toLowerCase();
      if (!username || username === excluded || reserved.has(username)) {
        continue;
      }

      if (!seen.has(username)) {
        seen.add(username);
        usernames.push(username);
      }
    }

    return usernames;
  }, {
    baseUrl: INSTAGRAM_BASE_URL,
    reservedPaths: Array.from(RESERVED_PATHS),
    excluded: excludedUsername
  });
}

async function scrollList(page) {
  return page.evaluate(() => {
    const root = document.querySelector('div[role="dialog"]') || document.body;
    const candidates = Array.from(root.querySelectorAll('div'))
      .filter((element) => element.scrollHeight > element.clientHeight + 40)
      .sort((a, b) => b.scrollHeight - a.scrollHeight);

    const scroller = candidates[0] || document.scrollingElement || document.documentElement;
    const before = scroller.scrollTop;
    scroller.scrollBy(0, Math.max(scroller.clientHeight * 0.85, 400));

    return {
      before,
      after: scroller.scrollTop,
      height: scroller.scrollHeight,
      clientHeight: scroller.clientHeight
    };
  });
}

async function scrapeOpenList(page, username, label, options) {
  const usernames = new Set();
  let scrolls = 0;
  let attemptsWithoutNew = 0;
  const startedAt = Date.now();

  options.onStatus?.(`Scraping ${label} list`);

  while (
    scrolls < options.maxScrolls
    && attemptsWithoutNew < options.noNewLimit
    && Date.now() - startedAt < options.timeoutMs
  ) {
    const beforeCount = usernames.size;
    const visibleUsernames = await collectUsernames(page, username);

    for (const visibleUsername of visibleUsernames) {
      usernames.add(visibleUsername);
    }

    if (usernames.size === beforeCount) {
      attemptsWithoutNew += 1;
    } else {
      attemptsWithoutNew = 0;
      options.onProgress?.(label, usernames.size);
    }

    await scrollList(page);
    scrolls += 1;
    if (scrolls % 10 === 0) {
      options.onProgress?.(label, usernames.size);
    }
    await page.waitForTimeout(randomDelay());
  }

  return Array.from(usernames);
}

async function scrapeInstagramLists(options) {
  const profileDir = path.resolve(options.profileDir || '.auth/instagram');
  options.onStatus?.(`Opening Chromium with profile: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: options.headless,
    viewport: { width: 1280, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    options.onStatus?.(`Opening Instagram profile @${options.username}`);
    await openProfile(page, options.username);
    await ensureLoggedIn(page, async () => {
      await options.onLoginRequired?.(page);
      options.onStatus?.(`Reopening Instagram profile @${options.username}`);
      await openProfile(page, options.username);
    });

    options.onStatus?.('Opening following list');
    await openListWithManualRetry(page, options.username, 'following', options);
    const following = await scrapeOpenList(page, options.username, 'following', options);

    options.onStatus?.(`Collected ${following.length} following accounts`);
    await page.keyboard.press('Escape').catch(() => {});
    options.onStatus?.(`Reopening Instagram profile @${options.username}`);
    await openProfile(page, options.username);
    options.onStatus?.('Opening followers list');
    await openListWithManualRetry(page, options.username, 'followers', options);
    const followers = await scrapeOpenList(page, options.username, 'followers', options);

    options.onStatus?.(`Collected ${followers.length} follower accounts`);
    return { followers, following };
  } catch (error) {
    await options.onError?.(error, page);
    throw error;
  } finally {
    await context.close();
  }
}

module.exports = {
  collectUsernames,
  scrapeInstagramLists
};
