# insta-script

Local Node.js CLI for finding Instagram accounts you follow that do not follow you back.

It opens Instagram in a visible Playwright Chromium browser, lets you log in manually, scrapes your `following` and `followers` lists, compares them locally, prints the result, and writes a CSV report.

## Requirements

- Node.js 18 or newer
- An Instagram account you can log into manually in the browser

## Install

```sh
npm install
```

Playwright may also need to download its Chromium browser:

```sh
npx playwright install chromium
```

## Run

```sh
npm run nonfollowers -- --username your_instagram_username
```

The first run opens a visible Chromium window. If Instagram asks you to log in, complete login and any checkpoint prompts in that browser, return to the terminal, and press Enter.

The session is stored in `.auth/instagram`, which is ignored by git. The app never asks for your Instagram password and does not store credentials directly.

## Output

The CLI prints:

- following count
- followers count
- non-followback count
- one username per line for accounts you follow that do not follow you back

It also writes a timestamped CSV report in `reports/`, for example:

```text
reports/non-followers-2026-05-13-12-34-56.csv
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

Example with a longer scrape window:

```sh
npm run nonfollowers -- --username your_instagram_username --max-scrolls 500 --timeout-ms 600000
```

## Troubleshooting

- Instagram UI changes can break browser automation. Re-run after updating dependencies if selectors stop working.
- Instagram may rate-limit, checkpoint, or temporarily block automated-looking activity. Keep the visible browser open, resolve prompts manually, and try again later if loading stalls.
- Private account visibility depends on your own logged-in account permissions.
- If the result seems incomplete, increase `--max-scrolls`, increase `--timeout-ms`, or lower activity by trying again later.
- To force a fresh login, close the browser and delete `.auth/instagram`.

## Tests

```sh
npm test
```

The automated tests cover username normalization, non-followback comparison, duplicate handling, empty lists, and CSV report writing. They do not contact Instagram.
