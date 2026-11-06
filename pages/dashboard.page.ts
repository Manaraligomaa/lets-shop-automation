import { type Locator, type Response } from '@playwright/test';
import { BasePage } from './base.page';
import { Endpoint } from '../api/endpoints';
import { step } from '../utils/step';

type ProductQuery = Record<string, unknown>;

/** Product list with search, price range and category filters. */
export class DashboardPage extends BasePage {
  protected readonly path = '#/dashboard/dash';

  readonly searchInput: Locator = this.page.getByRole('textbox', { name: 'search' });
  readonly minPriceInput: Locator = this.page.getByRole('textbox', { name: 'Min Price' });
  readonly maxPriceInput: Locator = this.page.getByRole('textbox', { name: 'Max Price' });
  readonly resultCount: Locator = this.page.getByText(/Showing \d+ results/);
  /** Product cards have no role, so the card class is the last resort. */
  readonly productCards: Locator = this.page.locator('.card-body');
  readonly productNames: Locator = this.productCards.getByRole('heading', { level: 5 });

  productCard(name: string): Locator {
    return this.productCards.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  /** Filter checkboxes have no accessible name; they are found by the label text next to them. */
  filterCheckbox(label: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByRole('checkbox'), hasText: new RegExp(`^\\s*${label}\\s*$`) })
      .getByRole('checkbox');
  }

  @step('Open the dashboard')
  async open(): Promise<void> {
    const loaded = this.productList();
    await super.open();
    await loaded;
  }

  @step('Search for "{0}"')
  async search(term: string): Promise<void> {
    const loaded = this.productList((query) => query.productName === term);
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
    await loaded;
  }

  /**
   * The page searches whenever a price field changes (Enter, or leaving the field) and shows the answer that
   * arrives last, so each search must finish before the next field changes: otherwise a late answer for the
   * min price alone replaces the answer for the whole range.
   */
  @step('Set price range {0}–{1}')
  async setPriceRange(min: number, max: number): Promise<void> {
    await this.enterPrice(this.minPriceInput, min, (query) => query.minPrice === min && query.maxPrice === null);
    await this.enterPrice(this.maxPriceInput, max, (query) => query.minPrice === min && query.maxPrice === max);
  }

  @step('Filter by "{0}"')
  async checkFilter(label: string): Promise<void> {
    const loaded = this.productList((query) => JSON.stringify(query).includes(`"${label}"`));
    await this.waitForSpinner();
    await this.filterCheckbox(label).check();
    await loaded;
  }

  @step('Add "{0}" to the cart from the dashboard')
  async addToCart(name: string): Promise<void> {
    const added = this.waitForApi(Endpoint.addToCart);
    await this.click(this.productCard(name).getByRole('button', { name: 'Add To Cart' }));
    await added;
  }

  /** Opens the product's details page and waits for its data. */
  @step('View "{0}"')
  async viewProduct(name: string): Promise<void> {
    const loaded = this.waitForApi(Endpoint.productDetail);
    await this.click(this.productCard(name).getByRole('button', { name: 'View' }));
    await loaded;
  }

  /** Types a price, commits it with Enter and waits until the search it starts has fully arrived. */
  private async enterPrice(input: Locator, price: number, matches: (query: ProductQuery) => boolean): Promise<void> {
    const loaded = this.productList(matches);
    await input.fill(String(price));
    await input.press('Enter');
    await (await loaded).finished();
  }

  /** The product list response whose query (request body) matches `filter`. */
  private productList(filter: (query: ProductQuery) => boolean = () => true): Promise<Response> {
    return this.waitForApi(Endpoint.products, (request) => filter((request.postDataJSON() as ProductQuery) ?? {}));
  }
}
