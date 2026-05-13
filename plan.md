 # Instagram Non-Followback CLI Plan

  ## Summary

  Build a local Node.js CLI that opens Instagram in a visible Playwright browser, lets you log in
  manually, scrapes your following and followers lists, compares them, then prints and saves the
  users who do not follow you back.

  The repo is currently empty except for README.md, so this will be a from-scratch CLI app in /
  Users/owaiswangde/insta-script/insta-script.

  ## Key Changes

  - Create a Node project with Playwright:
      - package.json
      - CLI entrypoint, likely src/index.js
      - scraper/comparison helpers under src/
      - .gitignore for local browser profiles, reports, and dependencies
  - CLI command:
      - npm run nonfollowers -- --username your_instagram_username
      - Opens Chromium visibly.
      - Reuses a local Playwright profile so you do not need to log in every run.
      - Pauses if login is needed, then continues after you confirm login in the browser.
  - Scraping behavior:
      - Visit your Instagram profile.
      - Open the following list and scroll until all visible usernames are collected.
      - Open the followers list and scroll until all visible usernames are collected.
      - Normalize usernames case-insensitively.
      - Compute: following - followers.
  - Output:
      - Print counts: following count, followers count, non-followback count.
      - Print usernames in the terminal.
      - Write a timestamped CSV report, for example reports/non-followers-2026-05-13.csv.
  - Safety/privacy:
      - Do not store your Instagram password.
      - Store only local browser session data in an ignored directory, for example .auth/.
      - Add clear README instructions and a warning that browser automation can break if Instagram
        changes its UI or rate-limits the session.

  ## Implementation Details

  - Use playwright with persistent Chromium context:
      - chromium.launchPersistentContext(".auth/instagram", { headless: false })
  - Use resilient selectors where possible:
      - Prefer links/user anchors that point to username profiles.
      - Avoid hard-coding brittle CSS class names.
  - Add scroll loop safeguards:
      - Stop after no new usernames appear for several scroll attempts.
      - Add small random delays between scrolls.
      - Include a configurable timeout/max scroll option.
  - CSV format:
      - Header: username
      - One non-followback username per row.
  - README will include:
      - Install command: npm install
      - First run command
      - Login/session behavior
      - Where CSV reports are saved
  ## Test Plan

  - Unit test pure comparison logic:
      - users followed but not following back
      - case normalization
      - duplicate usernames
      - empty followers/following lists
  - Add a mock scraper test using sample username arrays so comparison/report writing can be tested
    without Instagram.
  - Manual acceptance test:
      - Run the CLI.
      - Log into Instagram in the opened browser.
      - Confirm it collects both lists.
      - Confirm terminal output and CSV contain the same non-followback users.
      - Re-run to verify the saved session works without logging in again.

  ## Assumptions

  - v1 is a CLI script, not a web app.
  - v1 uses browser automation, per your choice, rather than Instagram data export.
  - Login is manual in the browser; the app never asks for or stores your password.
  - The target account is your own Instagram account, passed as --username.
  - The result means: accounts you follow that are not following you back.