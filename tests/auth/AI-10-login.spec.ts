import { test, expect } from '../../fixtures/test';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/AI-10-login.data.json';

const data = resolve(raw);

test.describe(`${data.story} ${data.title}`, { tag: `@${data.story}` }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  for (const row of data.wrongCredentials) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ page, loginPage, toast }) => {
      await loginPage.login(row.email, row.password);
      await expect(toast.container).toContainText(row.expectedToast);
      await expect(page).toHaveRoute(data.loginRoute);
    });
  }

  for (const row of data.requiredFields) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ page, loginPage }) => {
      await loginPage.login(row.email, row.password);
      await expect(loginPage.fieldError(row.expectedMessage)).toBeVisible();
      await expect(page).toHaveRoute(data.loginRoute);
    });
  }

  for (const row of data.invalidEmail) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ loginPage }) => {
      await loginPage.emailInput.fill(row.email);
      await loginPage.submit();
      await expect(loginPage.fieldError(row.expectedMessage)).toBeVisible();
    });
  }

  for (const row of data.passwordMasking) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ loginPage }) => {
      await loginPage.passwordInput.fill(row.password);
      await expect(loginPage.passwordInput).toHaveAttribute('type', row.expectedType);
    });
  }
});
