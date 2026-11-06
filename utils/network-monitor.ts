import { type Page } from '@playwright/test';
import { env } from '../config/env';
import { type EndpointPath } from '../api/endpoints';

/** Records the page's API calls and can block an endpoint, so a test never creates or changes real data. */
export class NetworkMonitor {
  private readonly calls: string[] = [];

  constructor(private readonly page: Page) {
    const apiPath = new URL(env.apiUrl).pathname;
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (url.pathname.startsWith(apiPath)) this.calls.push(`${r.method()} ${url.pathname}`);
    });
  }

  /**
   * Aborts requests to `endpoint` as "blocked by client", so the failure log shows they were blocked on purpose.
   * They are still recorded: `callsTo` shows whether the page tried.
   */
  async block(endpoint: EndpointPath): Promise<void> {
    await this.page.route((u) => u.pathname.includes(endpoint), (route) => route.abort('blockedbyclient'));
  }

  callsTo(endpoint: EndpointPath): string[] {
    return this.calls.filter((c) => c.includes(endpoint));
  }
}
