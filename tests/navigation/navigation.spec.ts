import { test, expect } from '../../fixtures/test';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/navigation.data.json';

const data = resolve(raw);

test.describe(data.title, { tag: `@${data.feature}` }, () => {
  test.use({ account: 'shared' }); // read-only: never changes the cart or orders

  for (const row of data.headerButtons) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, protectedPage, header }) => {
      await protectedPage.openRoute(row.startRoute);
      await header.navigate(row.button);
      await expect(page).toHaveRoute(row.expectedRoute);
    });
  }

  for (const row of data.viewProduct) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, dashboardPage, productDetailsPage }) => {
      await dashboardPage.open();
      await dashboardPage.viewProduct(row.product);
      await expect(page).toHaveRoute(row.expectedRoute);
      await expect(productDetailsPage.productName).toHaveText(row.product);
    });
  }

  for (const row of data.continueFromDetails) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, productDetailsPage, dashboardPage }) => {
      await productDetailsPage.openProduct(row.productId);
      await productDetailsPage.continueShopping();
      await expect(page).toHaveRoute(data.dashboardRoute);
      await expect(dashboardPage.productCards.first()).toBeVisible();
    });
  }

  for (const row of data.continueFromCart) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, cartPage }) => {
      await cartPage.open();
      await cartPage.continueShopping();
      await expect(page).toHaveRoute(data.dashboardRoute);
    });
  }
});
