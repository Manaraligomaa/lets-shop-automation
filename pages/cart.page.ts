import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Endpoint } from '../api/endpoints';
import { step } from '../utils/step';

export class CartPage extends BasePage {
  protected readonly path = '#/dashboard/cart';

  readonly heading: Locator = this.page.getByRole('heading', { name: 'My Cart' });
  readonly emptyMessage: Locator = this.page.getByRole('heading', { name: 'No Products in Your Cart !' });
  /** Cart rows sit in `.cartWrap` lists; the class scopes them away from the header list. */
  readonly items: Locator = this.page.locator('.cartWrap').getByRole('listitem');
  readonly subtotal: Locator = this.page.locator('.totalRow').filter({ hasText: 'Subtotal' }).locator('.value');
  readonly total: Locator = this.page.locator('.totalRow').filter({ hasText: /^\s*Total/ }).locator('.value');
  readonly checkoutButton: Locator = this.page.getByRole('button', { name: 'Checkout' });
  readonly continueShoppingButton: Locator = this.page.getByRole('button', { name: /Continue Shopping/ });

  item(name: string): Locator {
    return this.items.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  @step('Open the cart')
  async open(): Promise<void> {
    const loaded = this.waitForApi(Endpoint.cartProducts);
    await super.open();
    await loaded;
  }

  /** The delete button is an icon with no accessible name, so its class is the last resort. */
  @step('Remove "{0}" from the cart')
  async remove(name: string): Promise<void> {
    const removed = this.waitForApi(Endpoint.removeFromCart);
    await this.click(this.item(name).locator('.btn-danger'));
    await removed;
  }

  @step('Buy Now "{0}"')
  async buyNow(name: string): Promise<void> {
    await this.click(this.item(name).getByRole('button', { name: 'Buy Now' }));
  }

  @step('Checkout')
  async checkout(): Promise<void> {
    await this.click(this.checkoutButton);
  }

  /** Returns to the dashboard and waits for its product list. */
  @step('Continue Shopping')
  async continueShopping(): Promise<void> {
    const loaded = this.waitForApi(Endpoint.products);
    await this.click(this.continueShoppingButton);
    await loaded;
  }
}
