import { test, expect } from '../../fixtures/test';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/products.data.json';

const data = resolve(raw);

test.describe(data.title, { tag: `@${data.feature}` }, () => {
  test.use({ account: 'shared' }); // read-only: never changes the cart or orders

  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.open();
  });

  for (const row of data.search) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ dashboardPage }) => {
      await dashboardPage.search(row.term);
      await expect(dashboardPage.productNames).toHaveText(row.expectedProducts);
      await expect(dashboardPage.resultCount).toContainText(`Showing ${row.expectedProducts.length} results`);
    });
  }

  for (const row of data.categoryFilter) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ dashboardPage }) => {
      await dashboardPage.checkFilter(row.label);
      await expect(dashboardPage.productNames).toHaveText(row.expectedProducts);
      await expect(dashboardPage.resultCount).toContainText(`Showing ${row.expectedProducts.length} results`);
    });
  }

  for (const row of data.priceRange) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ dashboardPage }) => {
      await dashboardPage.setPriceRange(row.min, row.max);
      await expect(dashboardPage.productNames).toHaveText(row.expectedProducts);
    });
  }

  for (const row of data.details) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productDetailsPage }) => {
      await productDetailsPage.openProduct(row.productId);
      await expect(productDetailsPage.productName).toHaveText(row.expectedName);
      await expect(productDetailsPage.productPrice).toHaveText(row.expectedPrice);
      await expect(productDetailsPage.textOnPage(row.expectedDescription)).toBeVisible();
    });
  }
});
