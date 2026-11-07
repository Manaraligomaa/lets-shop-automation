import { test, expect } from '../../fixtures/test';
import { details, Lock } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import { Endpoint } from '../../api/endpoints';
import raw from '../../data/AI-14-password-reset.data.json';

const data = resolve(raw);

test.describe(`${data.story} ${data.title}`, { tag: `@${data.story}` }, () => {
  for (const row of data.openFromLogin) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ page, loginPage, passwordResetPage }) => {
      await loginPage.open();
      await loginPage.openForgotPassword();
      await expect(page).toHaveRoute(data.resetRoute);
      await expect(passwordResetPage.saveButton).toBeVisible();
    });
  }

  for (const row of data.emptyForm) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ page, passwordResetPage }) => {
      await passwordResetPage.open();
      await passwordResetPage.submit();
      await expect(passwordResetPage.fieldErrors.filter({ hasText: row.requiredMessagePattern }).first()).toBeVisible();
      await expect(page).toHaveRoute(data.resetRoute);
    });
  }

  // This test logs in through the UI, which empties the shared cart, so it holds the cart lock.
  for (const row of data.mismatch) {
    test(`${row.jira} ${row.tc}: ${row.name}`, { ...details(row), lock: Lock.cart }, async ({ page, network, passwordResetPage, loginPage }) => {
      // Never change the shared account's real password.
      await network.block(Endpoint.newPassword);
      await passwordResetPage.open();
      await passwordResetPage.fillForm(row.email, row.password, row.confirmPassword);
      await passwordResetPage.submit();
      await expect(passwordResetPage.fieldErrors.first()).toBeVisible();
      expect(network.callsTo(Endpoint.newPassword)).toHaveLength(0);

      // The old password still works.
      await loginPage.open();
      await loginPage.login(row.loginEmail, row.loginPassword);
      await expect(page).toHaveRoute(row.dashboardRoute);
    });
  }

  for (const row of data.unregisteredEmail) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ page, passwordResetPage, toast }) => {
      await passwordResetPage.open();
      await passwordResetPage.fillForm(row.email, row.password, row.confirmPassword);
      await passwordResetPage.submit();
      await expect(toast.container).toBeVisible();
      await expect(page).toHaveRoute(data.resetRoute);
    });
  }
});
