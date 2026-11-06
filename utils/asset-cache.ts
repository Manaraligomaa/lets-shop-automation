import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { type BrowserContext, type Route } from '@playwright/test';

/** Shared by every test, worker and run; delete it any time to start cold. */
export const ASSET_CACHE_DIR = path.join(__dirname, '..', '.cache', 'static-assets');

/** The app's own scripts, styles, fonts and images. The build gives scripts, styles and fonts a content hash in their names. */
const APP_FILE = /\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico)$/i;

/** Images and fonts from other hosts, e.g. the login page background on i.ibb.co (served with a 10-year max-age). */
const MEDIA_FILE = /\.(woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico)$/i;

/** Headers that describe the transfer, not the decoded body that `route.fetch()` returns. */
const TRANSFER_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding']);

interface Entry {
  contentType: string;
}

/**
 * Serves the app's static files from a disk cache. A new browser context starts with an empty HTTP cache, so
 * without this every test downloads the whole app (about 1 MB) again, which on a slow connection alone outlasts
 * the test timeout. The HTML page and the API always go to the network, and a new build is fetched fresh
 * because its files get new names.
 */
export class AssetCache {
  constructor(
    private readonly dir: string,
    private readonly origin: string,
  ) {}

  async attach(context: BrowserContext): Promise<void> {
    await context.route(
      (url) => (url.origin === this.origin ? APP_FILE : MEDIA_FILE).test(url.pathname),
      (route) => this.serve(route),
    );
  }

  /** Never throws: a route handler error would fail the test that happens to be running. */
  private async serve(route: Route): Promise<void> {
    try {
      await this.respond(route);
    } catch {
      // Either the test ended while the file was still downloading (its context is closed, nothing to answer),
      // or the download failed: then let the browser load, and report, the file itself.
      await route.continue().catch(() => undefined);
    }
  }

  private async respond(route: Route): Promise<void> {
    const file = path.join(this.dir, crypto.createHash('sha1').update(route.request().url()).digest('hex'));
    const cached = await this.read(file);
    if (cached) return route.fulfill({ status: 200, contentType: cached.contentType, body: cached.body });

    const response = await route.fetch();
    const body = await response.body();
    const headers = Object.fromEntries(Object.entries(response.headers()).filter(([name]) => !TRANSFER_HEADERS.has(name)));
    if (response.status() === 200) await this.write(file, body, headers['content-type'] ?? 'application/octet-stream');
    await route.fulfill({ status: response.status(), headers, body });
  }

  private async read(file: string): Promise<{ body: Buffer; contentType: string } | undefined> {
    try {
      const entry = JSON.parse(await fs.promises.readFile(`${file}.json`, 'utf8')) as Entry;
      return { body: await fs.promises.readFile(file), contentType: entry.contentType };
    } catch {
      return undefined; // not cached yet, or another worker is writing it
    }
  }

  /** The body first, then the entry that marks it complete, each renamed into place so no worker reads half a file. */
  private async write(file: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await fs.promises.mkdir(this.dir, { recursive: true });
      await this.replace(file, body);
      await this.replace(`${file}.json`, JSON.stringify({ contentType } satisfies Entry));
    } catch {
      // Another worker is writing the same file; it ends up cached either way.
    }
  }

  private async replace(file: string, data: Buffer | string): Promise<void> {
    const temp = `${file}.${crypto.randomUUID()}.tmp`;
    await fs.promises.writeFile(temp, data);
    await fs.promises.rename(temp, file);
  }
}
