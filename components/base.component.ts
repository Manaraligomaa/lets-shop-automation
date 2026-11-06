import { type Locator, type Page, type Request, type Response } from '@playwright/test';
import { type EndpointPath } from '../api/endpoints';

/** Behavior shared by pages and components: spinner wait, safe click, race-free API waits. */
export abstract class BaseComponent {
  /** Loading overlay (ngx-spinner). waitFor('hidden') resolves at once when it is absent. */
  private readonly spinner: Locator;

  constructor(protected readonly page: Page) {
    this.spinner = page.locator('.ngx-spinner-overlay');
  }

  protected async waitForSpinner(): Promise<void> {
    await this.spinner.waitFor({ state: 'hidden' });
  }

  protected async click(target: Locator): Promise<void> {
    await this.waitForSpinner();
    await target.click();
  }

  /**
   * Waits for a successful response from `endpoint`. Call it *before* the action that triggers the request
   * and await it after, so a fast response is never missed:
   *
   *   const loaded = this.waitForApi(Endpoint.products);
   *   await this.searchInput.press('Enter');
   *   await loaded;
   */
  protected waitForApi(endpoint: EndpointPath, matches: (request: Request) => boolean = () => true): Promise<Response> {
    return this.page.waitForResponse((r) => r.url().includes(endpoint) && r.ok() && matches(r.request()));
  }
}
