'use strict';

function parseBoolean(value) {
  if (value === undefined) {
    return true;
  }

  const normalized = String(value).toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

function parsePositiveInteger(name, value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer`);
  }

  return parsed;
}

function parseArgs(argv) {
  const options = {
    headless: false,
    maxScrolls: 250,
    noNewLimit: 8,
    timeoutMs: 5 * 60 * 1000
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const [rawName, inlineValue] = arg.slice(2).split('=', 2);
    const nextValue = inlineValue === undefined ? argv[i + 1] : inlineValue;

    switch (rawName) {
      case 'username':
        if (!nextValue || nextValue.startsWith('--')) {
          throw new Error('--username is required');
        }
        options.username = nextValue.replace(/^@+/, '').trim();
        if (inlineValue === undefined) {
          i += 1;
        }
        break;
      case 'profile-dir':
        if (!nextValue || nextValue.startsWith('--')) {
          throw new Error('--profile-dir requires a path');
        }
        options.profileDir = nextValue;
        if (inlineValue === undefined) {
          i += 1;
        }
        break;
      case 'report-dir':
        if (!nextValue || nextValue.startsWith('--')) {
          throw new Error('--report-dir requires a path');
        }
        options.reportDir = nextValue;
        if (inlineValue === undefined) {
          i += 1;
        }
        break;
      case 'max-scrolls':
        if (!nextValue || nextValue.startsWith('--')) {
          throw new Error('--max-scrolls requires a value');
        }
        options.maxScrolls = parsePositiveInteger(rawName, nextValue);
        if (inlineValue === undefined) {
          i += 1;
        }
        break;
      case 'no-new-limit':
        if (!nextValue || nextValue.startsWith('--')) {
          throw new Error('--no-new-limit requires a value');
        }
        options.noNewLimit = parsePositiveInteger(rawName, nextValue);
        if (inlineValue === undefined) {
          i += 1;
        }
        break;
      case 'timeout-ms':
        if (!nextValue || nextValue.startsWith('--')) {
          throw new Error('--timeout-ms requires a value');
        }
        options.timeoutMs = parsePositiveInteger(rawName, nextValue);
        if (inlineValue === undefined) {
          i += 1;
        }
        break;
      case 'headless':
        options.headless = parseBoolean(inlineValue);
        if (inlineValue === undefined && nextValue && !nextValue.startsWith('--')) {
          options.headless = parseBoolean(nextValue);
          i += 1;
        }
        break;
      case 'help':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: --${rawName}`);
    }
  }

  if (!options.help && !options.username) {
    throw new Error('--username is required');
  }

  return options;
}

function usage() {
  return [
    'Usage:',
    '  npm run nonfollowers -- --username your_instagram_username',
    '',
    'Options:',
    '  --username <name>       Instagram account to inspect (required)',
    '  --profile-dir <path>    Browser session directory (default: .auth/instagram)',
    '  --report-dir <path>     CSV report directory (default: reports)',
    '  --max-scrolls <n>       Maximum scroll attempts per list (default: 250)',
    '  --no-new-limit <n>      Stop after this many scrolls find no new users (default: 8)',
    '  --timeout-ms <n>        Timeout per list in milliseconds (default: 300000)',
    '  --headless [boolean]    Run browser headlessly (default: false)',
    '  --help                  Show this help'
  ].join('\n');
}

module.exports = {
  parseArgs,
  usage
};
