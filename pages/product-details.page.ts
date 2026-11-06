import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Endpoint } from '../api/endpoints';
import { step } from '../utils/step';

export class ProductDetailsPage extends BasePage {
  protected path = '#/dashboard/product-details/';

  readonly productName: Locator = this.page.getByRole('heading', { level: 2 });
  readonly productPrice: Locator = this.page.getByRole('heading', { level: 3, name: /^\$/ });
  readonly addToCartButton: Locator = this.page.getByRole('button', { name: 'Add to Cart', exact: true });
  readonly continueShoppingLink: Locator = this.page.getByRole('link', { name: /Continue Shopping/ });

  /** Waits for the product request, which must finish before Add to Cart works. */
  @step('Open product details {0}')
  async openProduct(productId: string): Promise<void> {
    const loaded = this.waitForApi(Endpoint.productDetail, (r) => r.url().endsWith(productId));
    this.path = `#/dashboard/product-details/${productId}`;
    await this.open();
    await loaded;
  }

  @step('Add to the cart from product details')
  async addToCart(): Promise<void> {
    const added = this.waitForApi(Endpoint.addToCart);
    await this.click(this.addToCartButton);
    await added;
  }

  /** Returns to the dashboard and waits for its product list. */
  @step('Continue Shopping')
  async continueShopping(): Promise<void> {
    const loaded = this.waitForApi(Endpoint.products);
    await this.click(this.continueShoppingLink);
    await loaded;
  }
}
