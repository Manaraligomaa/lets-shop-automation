import { type Locator, type Page } from '@playwright/test';

/** ngx-toastr toasts. Title-only toasts have no alert role, so the container is matched. */
export class Toast {
  readonly container: Locator;

  constructor(page: Page) {
    this.container = page.locator('#toast-container');
  }
}
