import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return value;
}

/** A URL setting, checked at startup so a typo (e.g. `API_URL==https://...`) fails loudly instead of breaking every call. */
function url(name: string, fallback: string): string {
  const value = process.env[name] || fallback;
  if (!URL.canParse(value)) throw new Error(`${name} is not a valid URL: "${value}"`);
  return value;
}

function optionalUrl(name: string): string | undefined {
  return process.env[name] ? url(name, '').replace(/\/+$/, '') : undefined;
}

const withTrailingSlash = (value: string): string => (value.endsWith('/') ? value : `${value}/`);

/** Typed settings from `.env` (locally) or CI secrets. Credentials are read only when a test needs them. */
export const env = {
  /** Always ends in "/": the site answers ".../client" with a redirect to ".../client/", a round trip per page open. */
  baseUrl: withTrailingSlash(url('BASE_URL', 'https://rahulshettyacademy.com/client/')),
  apiUrl: url('API_URL', 'https://rahulshettyacademy.com/api/ecom'),
  /** Use an installed browser instead of Playwright's Chromium, e.g. "chrome" or "msedge". */
  browserChannel: process.env.BROWSER_CHANNEL || undefined,
  /** ASSET_CACHE=off makes every test download the app's static files again (see utils/asset-cache.ts). */
  assetCache: process.env.ASSET_CACHE !== 'off',
  /** Jira site, e.g. https://your-team.atlassian.net: when set, the report links each test to its Jira issue. */
  jiraUrl: optionalUrl('JIRA_URL'),
  isCI: !!process.env.CI,
  get user() {
    return { email: required('USER_EMAIL'), password: required('USER_PASSWORD') };
  },
};
