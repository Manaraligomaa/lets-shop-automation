import { test, expect } from '../../fixtures/test';
import { details, Lock } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/cart.data.json';

const data = resolve(raw);

test.describe(data.title, { tag: `@${data.feature}`, lock: Lock.cart }, () => {
  // Uses the main account by choice (no isolated account yet). Its cart is one shared resource: every test here
  // holds the cart lock, so no two of them run at once, and each leaves the cart empty before and after.
  test.use({ account: 'shared' });

  test.beforeEach(async ({ cartApi }) => {
    await cartApi.clear();
  });

  test.afterEach(async ({ cartApi }) => {
    await cartApi.clear();
  });

  // UI actions are also checked on the server (cartApi), so a UI that only looks right still fails. The page
  // objects wait for the add/remove response, so one read is enough (the client retries a stalled call).
  for (const row of data.addFromDashboard) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ dashboardPage, cartPage, cartApi, header, toast }) => {
      await dashboardPage.open();
      await dashboardPage.addToCart(row.product);
      await expect(toast.container).toContainText(data.addedToast);
      await expect(header.button('Cart')).toContainText('1');
      expect(await cartApi.productNames(), 'cart on the server').toEqual([row.product]);

      await cartPage.open();
      await expect(cartPage.item(row.product)).toBeVisible();
    });
  }

  for (const row of data.addFromDetails) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productDetailsPage, cartPage, cartApi, toast }) => {
      await productDetailsPage.openProduct(row.productId);
      await productDetailsPage.addToCart();
      await expect(toast.container).toContainText(data.addedToast);
      expect(await cartApi.productNames(), 'cart on the server').toEqual([row.product]);

      await cartPage.open();
      await expect(cartPage.item(row.product)).toBeVisible();
    });
  }

  for (const row of data.cartContents) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi, cartPage }) => {
      await cartApi.add(...row.products);
      await cartPage.open();
      for (const product of row.products) await expect(cartPage.item(product)).toBeVisible();
      await expect(cartPage.subtotal).toHaveText(row.expectedSubtotal);
      await expect(cartPage.total).toHaveText(row.expectedTotal);
    });
  }

  for (const row of data.cartCount) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi, dashboardPage, header }) => {
      await cartApi.add(...row.products);
      await dashboardPage.open();
      await expect(header.button('Cart')).toContainText(row.expectedCount);
    });
  }

  for (const row of data.remove) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi, cartPage }) => {
      await cartApi.add(...row.products);
      await cartPage.open();
      await cartPage.remove(row.remove);
      await expect(cartPage.item(row.remove)).toBeHidden();
      await expect(cartPage.item(row.remaining)).toBeVisible();
      expect(await cartApi.productNames(), 'cart on the server').toEqual([row.remaining]);
    });
  }

  for (const row of data.removeLast) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi, cartPage }) => {
      await cartApi.add(...row.products);
      await cartPage.open();
      await cartPage.remove(row.remove);
      await expect(cartPage.emptyMessage).toBeVisible();
      expect(await cartApi.productNames(), 'cart on the server').toEqual([]);
    });
  }

  for (const row of data.checkout) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, cartApi, cartPage, checkoutPage }) => {
      await cartApi.add(...row.products);
      await cartPage.open();
      await cartPage.checkout();
      await expect(page).toHaveRoute(data.checkoutRoute, { exact: false });
      await expect(checkoutPage.itemTitles).toHaveText(row.products);
      await expect(checkoutPage.itemQuantities).toHaveText(row.products.map(() => row.expectedQuantity));
    });
  }

  for (const row of data.buyNow) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, cartApi, cartPage, checkoutPage }) => {
      await cartApi.add(...row.products);
      await cartPage.open();
      await cartPage.buyNow(row.buy);
      await expect(page).toHaveRoute(data.checkoutRoute, { exact: false });
      await expect(checkoutPage.itemTitles).toHaveText([row.buy]);
      await expect(checkoutPage.itemQuantities).toHaveText([row.expectedQuantity]);
    });
  }

  // Known bug: only the subtotal assertion is expected to fail (test.fail right before it), not the steps.
  for (const row of data.subtotalAfterRemove) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi, cartPage }) => {
      await cartApi.add(...row.products);
      await cartPage.open();
      await cartPage.remove(row.remove);
      await expect(cartPage.item(row.remove)).toBeHidden();
      test.fail();
      await expect(cartPage.subtotal).toHaveText(row.expectedSubtotal);
    });
  }
});
