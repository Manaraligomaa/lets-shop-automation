import { test, expect } from '../../fixtures/test';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import { Endpoint } from '../../api/endpoints';
import raw from '../../data/AI-13-register.data.json';

const data = resolve(raw);

test.describe(`${data.story} ${data.title}`, { tag: `@${data.story}` }, () => {
  // These are validation tests: no request may create a real account.
  test.beforeEach(async ({ network, registerPage }) => {
    await network.block(Endpoint.register);
    await registerPage.open();
  });

  for (const row of data.emptyForm) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ registerPage }) => {
      await registerPage.submit();
      for (const message of row.expectedMessages) {
        await expect(registerPage.fieldError(message)).toBeVisible();
      }
    });
  }

  for (const row of data.ageCheckbox) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ page, network, registerPage }) => {
      await registerPage.fillForm({ ...data.validUser, ...row.overrides });
      await registerPage.submit();
      await expect(registerPage.textOnPage(data.successText)).toBeHidden();
      await expect(page).toHaveRoute(data.registerRoute);
      expect(network.callsTo(Endpoint.register)).toHaveLength(0);
    });
  }

  for (const row of data.phoneRejected) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ registerPage }) => {
      await registerPage.fillForm({ phone: row.phone });
      await registerPage.submit();
      await expect(registerPage.fieldError(data.phoneMessage)).toBeVisible();
    });
  }

  for (const row of data.phoneAccepted) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ registerPage }) => {
      await registerPage.fillForm({ phone: row.phone });
      await registerPage.submit();
      await expect(registerPage.fieldError(data.phoneMessage)).toBeHidden();
    });
  }

  for (const row of data.passwordMismatch) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ registerPage }) => {
      await registerPage.fillForm({ password: row.password, confirmPassword: row.confirmPassword });
      await registerPage.submit();
      await expect(registerPage.fieldError(row.expectedMessage)).toBeVisible();
    });
  }
});
