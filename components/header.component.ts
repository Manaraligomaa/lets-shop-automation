import { type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';
import { step } from '../utils/step';

/** Top navigation bar shown on every logged-in page: HOME, ORDERS, Cart, Sign Out. */
export class Header extends BaseComponent {
  private readonly nav: Locator = this.page.getByRole('navigation');

  /** A header button by its visible label. The Cart button also shows the cart count. */
  button(label: string): Locator {
    return this.nav.getByRole('button', { name: label });
  }

  @step('Header: {0}')
  async navigate(label: string): Promise<void> {
    await this.click(this.button(label));
  }
}
