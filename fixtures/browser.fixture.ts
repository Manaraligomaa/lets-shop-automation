import fs from 'node:fs';
import { test as base, type Request } from '@playwright/test';
import { env } from '../config/env';
import { ASSET_CACHE_DIR, AssetCache } from '../utils/asset-cache';
import { NetworkMonitor } from '../utils/network-monitor';

/** A request slower than this is logged: the practice site sometimes stalls instead of failing. */
const SLOW_REQUEST_MS = 5_000;

export type BrowserOptions = {
  /** Serve the app's scripts, styles, fonts and images from the shared disk cache. Default: on (ASSET_CACHE=off). */
  cacheStaticAssets: boolean;
};

export type BrowserFixtures = {
  /** Records the page's API calls and blocks endpoints that would change real data. */
  network: NetworkMonitor;
  /** Runs for every UI test: attaches the static-asset cache to the browser context. */
  staticAssets: void;
  /** Runs for every UI test: on failure, saves what the browser reported (see below). */
  diagnostics: void;
};

export const test = base.extend<BrowserOptions & BrowserFixtures>({
  cacheStaticAssets: [env.assetCache, { option: true }],

  network: async ({ page }, use) => use(new NetworkMonitor(page)),

  staticAssets: [
    async ({ context, cacheStaticAssets, baseURL }, use) => {
      if (cacheStaticAssets && baseURL) await new AssetCache(ASSET_CACHE_DIR, new URL(baseURL).origin).attach(context);
      await use();
    },
    { auto: true },
  ],

  // A failed test gets browser-log.txt next to its screenshot and trace: console errors, uncaught page errors,
  // failed, 4xx/5xx and slow requests, and requests still pending at the end, each with the time since the
  // test started. Passed tests and expected failures save nothing.
  diagnostics: [
    async ({ page }, use, testInfo) => {
      const start = Date.now();
      const log: string[] = [];
      const pending = new Map<Request, number>();
      const record = (line: string) => log.push(`+${String(Date.now() - start).padStart(6)}ms  ${line}`);

      page.on('console', (m) => {
        if (m.type() === 'error') record(`console error: ${m.text()}`);
      });
      page.on('pageerror', (e) => record(`page error: ${e.message}`));
      page.on('request', (r) => pending.set(r, Date.now()));
      page.on('requestfinished', (r) => {
        const took = Date.now() - (pending.get(r) ?? Date.now());
        pending.delete(r);
        if (took > SLOW_REQUEST_MS) record(`slow request (${took}ms): ${r.method()} ${r.url()}`);
      });
      page.on('requestfailed', (r) => {
        pending.delete(r);
        record(`request failed: ${r.method()} ${r.url()} (${r.failure()?.errorText})`);
      });
      page.on('response', (r) => {
        if (r.status() >= 400) record(`HTTP ${r.status()}: ${r.request().method()} ${r.url()}`);
      });

      await use();

      if (testInfo.status === testInfo.expectedStatus) return;
      for (const [r, started] of pending) record(`still pending after ${Date.now() - started}ms: ${r.method()} ${r.url()}`);
      if (!log.length) return;
      const file = testInfo.outputPath('browser-log.txt');
      await fs.promises.writeFile(file, log.join('\n'));
      await testInfo.attach('browser-log', { path: file, contentType: 'text/plain' });
    },
    { auto: true },
  ],
});
