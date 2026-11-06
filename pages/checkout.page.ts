import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Endpoint } from '../api/endpoints';
import { step } from '../utils/step';

/** Order page reached from the cart's Checkout or Buy Now; the product ids are in the route. */
export class CheckoutPage extends BasePage {
  protected path = '#/dashboard/order';

  /** Order summary and shipping fields have no roles or labels, so their classes are the last resort. */
  readonly itemTitles: Locator = this.page.locator('.item__title');
  readonly itemQuantities: Locator = this.page.locator('.item__quantity');
  readonly shippingEmail: Locator = this.page.locator('.user__name input').first();
  readonly countryInput: Locator = this.page.getByRole('textbox', { name: 'Select Country' });
  /** "Place Order" is an anchor without href, so it has no link role. */
  readonly placeOrderButton: Locator = this.page.getByText('Place Order', { exact: true });

  /** Country suggestions start with an icon glyph, so the name is matched at the end. */
  countryOption(country: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`(^|\\s)${country}$`) });
  }

  @step('Open the order page for {0}')
  async openFor(productIds: string[]): Promise<void> {
    const loaded = this.waitForApi(Endpoint.productDetail, (r) => r.url().endsWith(productIds[0]));
    this.path = `#/dashboard/order?prop=${encodeURIComponent(JSON.stringify(productIds))}`;
    await this.open();
    await loaded;
  }

  @step('Type "{0}" in Select Country')
  async typeCountry(text: string): Promise<void> {
    await this.countryInput.pressSequentially(text);
  }

  @step('Choose country {0}')
  async chooseCountry(country: string): Promise<void> {
    await this.click(this.countryOption(country));
  }

  @step('Place Order')
  async placeOrder(): Promise<void> {
    await this.click(this.placeOrderButton);
  }
}
