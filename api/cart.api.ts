import { type APIRequestContext } from '@playwright/test';
import { ApiClient } from './api-client';
import { Endpoint } from './endpoints';
import { ProductApi } from './product.api';
import { CartSchema, MessageSchema, type Product, type Session } from './schemas';

/** Puts the cart into a known state before a test, checks it after a UI action, and empties it afterwards. */
export class CartApi extends ApiClient {
  private readonly products: ProductApi;

  constructor(
    request: APIRequestContext,
    private readonly session: Session,
  ) {
    super(request, session.token);
    this.products = new ProductApi(request, session.token);
  }

  async contents(): Promise<Product[]> {
    return (await this.send('get', `${Endpoint.cartProducts}${this.session.userId}`, CartSchema)).products;
  }

  /** Names of the products in the cart, e.g. for `expect.poll` after a UI action. */
  async productNames(): Promise<string[]> {
    return (await this.contents()).map((p) => p.productName);
  }

  async add(...names: string[]): Promise<void> {
    for (const name of names) {
      const product = await this.products.byName(name);
      await this.send('post', Endpoint.addToCart, MessageSchema, { _id: this.session.userId, product });
    }
  }

  async remove(name: string): Promise<void> {
    const product = (await this.contents()).find((p) => p.productName === name);
    if (!product) throw new Error(`Product "${name}" is not in the cart`);
    await this.delete(product._id);
  }

  async clear(): Promise<void> {
    for (const product of await this.contents()) await this.delete(product._id);
  }

  private async delete(productId: string): Promise<void> {
    await this.send('delete', `${Endpoint.removeFromCart}${this.session.userId}/${productId}`, MessageSchema);
  }
}
