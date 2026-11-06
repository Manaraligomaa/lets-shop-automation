import { type Locator } from '@playwright/test';
import { BaseComponent } from '../components/base.component';

/** A routed page of the app: navigation plus the shared component behavior. */
export abstract class BasePage extends BaseComponent {
  protected abstract readonly path: string;

  /** Inline validation messages under form fields (no ARIA role on this site: CSS is the last resort). */
  get fieldErrors(): Locator {
    return this.page.locator('.invalid-feedback, .text-danger');
  }

  /**
   * Waits for the document, not the `load` event: a slow banner image or third-party script must not fail a test.
   * Readiness comes from the app itself: the spinner, and in subclasses the API response the page needs.
   */
  async open(): Promise<void> {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    await this.waitForSpinner();
  }

  /** The SPA hash route, e.g. "#/auth/login". */
  currentRoute(): string {
    return new URL(this.page.url()).hash;
  }

  fieldError(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  /** Any visible text on the page, e.g. a success message. */
  textOnPage(text: string): Locator {
    return this.page.getByText(text);
  }
}
