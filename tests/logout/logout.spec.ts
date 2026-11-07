import { test, expect } from '../../fixtures/test';
import { Endpoint } from '../../api/endpoints';
import { details, Lock } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/logout.data.json';

const data = resolve(raw);

test.describe(data.title, { tag: `@${data.feature}` }, () => {
  // Signing out clears only this browser's token; the saved session stays valid for other tests (see TC-OUT-10).
  test.use({ account: 'shared' });

  for (const row of data.signOutFrom) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, protectedPage, header, toast }) => {
      await protectedPage.openRoute(row.startRoute);
      await header.navigate('Sign Out');
      await expect(page).toHaveRoute(data.loginRoute);
      await expect(toast.container).toContainText(data.logoutToast);
    });
  }

  for (const row of data.lockedAfterSignOut) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, dashboardPage, header, protectedPage }) => {
      await dashboardPage.open();
      await header.navigate('Sign Out');
      await expect(page).toHaveRoute(data.loginRoute);

      await protectedPage.openRoute(row.route);
      await expect(page).toHaveRoute(data.loginRoute);
    });
  }

  for (const row of data.backAfterSignOut) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, dashboardPage, header, loginPage }) => {
      await dashboardPage.open();
      await header.navigate('Sign Out');
      await expect(page).toHaveRoute(data.loginRoute);

      await page.goBack();
      await expect(page).toHaveRoute(data.loginRoute);
      await expect(loginPage.loginButton).toBeVisible();
      await expect(dashboardPage.productCards).toHaveCount(0);
    });
  }

  // A UI login empties the shared cart, so this test holds the cart lock.
  for (const row of data.loginAgain) {
    test(`${row.tc}: ${row.name}`, { ...details(row), lock: Lock.cart }, async ({ page, dashboardPage, header, loginPage }) => {
      await dashboardPage.open();
      await header.navigate('Sign Out');
      await expect(page).toHaveRoute(data.loginRoute);

      await loginPage.login(row.email, row.password);
      await expect(page).toHaveRoute(data.dashboardRoute);
      await expect(header.button('Sign Out')).toBeVisible();
    });
  }

  // Known bug: the signed-out token should be refused by the server; only that assertion is expected to fail.
  // Once fixed, Sign Out ends the shared session for every test, so the logout tests must log in on their own first.
  for (const row of data.sessionAfterSignOut) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ page, dashboardPage, header, productApi }) => {
      await dashboardPage.open();
      await header.navigate('Sign Out');
      await expect(page).toHaveRoute(data.loginRoute);

      const res = await productApi.raw('post', Endpoint.products, {});
      test.fail();
      expect(res.status(), 'status of an API call with the signed-out token').toBe(row.expectedStatus);
    });
  }
});
