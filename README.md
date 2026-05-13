# Instagram Non-Followback CLI

A local Node.js CLI that finds Instagram accounts you follow that do not follow you back.

The tool opens Instagram in a visible Playwright Chromium browser, lets you log in manually, scrapes your `following` and `followers` lists, compares them locally, prints the result, and saves a CSV report.

## Important Notes

- This is an unofficial browser automation tool. Instagram can change its UI, rate-limit requests, show checkpoints, or block automated-looking activity.
- Use it only with your own account.
- The app never asks for your Instagram password. You log in directly on Instagram in the opened browser.
- A local browser session is saved in `.auth/instagram` so you do not need to log in every run.
- Treat `.auth/instagram` as sensitive. It can contain logged-in session cookies.
- Generated reports are saved in `reports/`.
- `.auth/`, `reports/`, and `node_modules/` are ignored by git.

## Requirements

- Node.js 18 or newer
- npm
- An Instagram account you can log into manually

Check your Node version:

```sh
node --version
```

## Installation

Clone the repository and install dependencies:

```sh
git clone <repo-url>
cd insta-script
npm install
```

Install Playwright's Chromium browser:

```sh
npx playwright install chromium
```

## Usage

Run the CLI with your Instagram username:

```sh
npm run nonfollowers -- --username your_instagram_username
```

Example:

```sh
npm run nonfollowers -- --username your_instagram_username
```

Do not include the `@` symbol. If you do include it, the CLI will strip it automatically.

## First Run

On the first run, a Chromium browser window opens.

1. Log into Instagram in the opened browser if prompted.
2. Complete any two-factor authentication or checkpoint prompts.
3. Make sure the browser is on your profile page:

```text
https://www.instagram.com/your_instagram_username/
```

4. Wait until the profile header shows `posts`, `followers`, and `following`.
5. Return to the terminal and press Enter if the CLI is waiting for confirmation.

After login, the browser session is saved in `.auth/instagram`. Future runs should usually reuse that session.

## What It Does

The CLI:

1. Opens your Instagram profile.
2. Opens the `following` list and scrolls through it.
3. Opens the `followers` list and scrolls through it.
4. Normalizes usernames case-insensitively.
5. Computes:

```text
following - followers
```

The result is the list of accounts you follow that are not following you back.

## Output

The terminal output includes:

- total following count collected
- total follower count collected
- non-followback count
- one username per line for each account not following you back

The CLI also writes a timestamped CSV report:

```text
reports/non-followers-YYYY-MM-DD-HH-MM-SS.csv
```

CSV format:

```csv
username
someaccount
anotheraccount
```

## Options

```text
--username <name>       Instagram account to inspect (required)
--profile-dir <path>    Browser session directory (default: .auth/instagram)
--report-dir <path>     CSV report directory (default: reports)
--max-scrolls <n>       Maximum scroll attempts per list (default: 250)
--no-new-limit <n>      Stop after this many scrolls find no new users (default: 8)
--timeout-ms <n>        Timeout per list in milliseconds (default: 300000)
--headless [boolean]    Run browser headlessly (default: false)
--help                  Show help
```

For larger accounts, increase the scrape limits:

```sh
npm run nonfollowers -- --username your_instagram_username --max-scrolls 500 --timeout-ms 600000
```

Use a different report directory:

```sh
npm run nonfollowers -- --username your_instagram_username --report-dir ./my-reports
```

Use a different browser session directory:

```sh
npm run nonfollowers -- --username your_instagram_username --profile-dir ./my-instagram-session
```

## Privacy and Security

This project is designed to keep your data local:

- No Instagram password is requested by the CLI.
- No credentials are sent to this project.
- Scraped usernames are processed locally.
- CSV reports are written locally.
- The saved browser session stays in `.auth/instagram` by default.

To remove the saved Instagram session:

```sh
rm -rf .auth/instagram
```

Before pushing your own copy to GitHub, check that local session data and reports are ignored:

```sh
git status --short --ignored
```

You should see entries like:

```text
!! .auth/
!! reports/
!! node_modules/
```

These ignored folders should not be committed.

## Troubleshooting

### The CLI says it cannot find the following or followers link

Make sure the opened browser is logged in and showing your profile page:

```text
https://www.instagram.com/your_instagram_username/
```

Wait until the profile header shows `posts`, `followers`, and `following`, then return to the terminal and press Enter.

### The browser opens but nothing seems to happen

Check the terminal. The CLI may be waiting for you to log in, resolve a checkpoint, or press Enter.

### The result looks incomplete

Instagram may not have loaded the full list before the scraper stopped. Try a longer run:

```sh
npm run nonfollowers -- --username your_instagram_username --max-scrolls 500 --timeout-ms 600000
```

### Instagram shows a checkpoint or warning

Resolve it manually in the opened browser. If Instagram rate-limits the session, stop the script and try again later.

### I want to log in again from scratch

Delete the saved browser session:

```sh
rm -rf .auth/instagram
```

Then run the CLI again.

## Development

Run tests:

```sh
npm test
```

The automated tests cover CLI parsing, username normalization, duplicate handling, non-followback comparison, empty lists, and CSV report writing. They do not contact Instagram.

## Limitations

- This depends on Instagram's web UI and may break if Instagram changes its markup.
- Very large accounts may need higher scroll and timeout limits.
- Private account visibility depends on the logged-in Instagram account's permissions.
- Browser automation may violate Instagram's terms or trigger anti-automation systems. Use at your own discretion.
