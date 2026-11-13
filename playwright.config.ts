import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { env } from './config/env';

const reporters: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never' }],
  // Absolute path, so a wrapper config in another folder still finds it.
  [path.join(__dirname, 'reporters', 'traceability.reporter.ts')],
  // Results for the Allure report (`npm run allure`). Inside test-results/, so each run starts clean.
  [
    'allure-playwright',
    {
      resultsDir: path.join(__dirname, 'test-results', 'allure-results'),
      environmentInfo: {
        'Base URL': env.baseUrl,
        Browser: env.browserChannel ?? 'chromium',
        OS: `${os.type()} ${os.release()}`,
        'Node.js': process.version,
      },
    },
  ],
];
if (env.isCI) reporters.push(['junit', { outputFile: 'test-results/junit.xml' }]);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.isCI,
  // One retry absorbs the practice site's occasional stalled request; a test that needs it is reported as flaky.
  retries: 1,
  // The practice site is shared and slow under load (page loads and API answers of 5-20 s seen), so each test gets
  // 60 s and each assertion 15 s instead of the defaults (30 s and 5 s). API calls: see api/api-client.ts.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: reporters,
  use: {
    baseURL: env.baseUrl,
    screenshot: 'only-on-failure', // no evidence for passed tests
    trace: 'retain-on-failure', // CI runs with no retries, so 'on-first-retry' would never record one
  },
  projects: [
    // Logs in once by API and saves the token: every login empties the account's cart, so tests reuse it.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    // UI and API tests. Tests that change the shared cart, or log in, hold the `Lock.cart` test lock,
    // so they never overlap while everything else runs in parallel (see utils/test-case.ts).
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: env.browserChannel }, dependencies: ['setup'] },
  ],
});
