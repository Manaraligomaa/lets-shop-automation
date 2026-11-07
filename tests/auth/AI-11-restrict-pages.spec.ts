import { test, expect } from '../../fixtures/test';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/AI-11-restrict-pages.data.json';

const data = resolve(raw);

test.describe(`${data.story} ${data.title}`, { tag: `@${data.story}` }, () => {
  for (const row of data.protectedRoutes) {
    test(`${row.jira} ${row.tc}: ${row.name}`, details(row), async ({ page, protectedPage }) => {
      await protectedPage.openRoute(row.route);
      await expect(page).toHaveRoute(data.expectedRoute);
    });
  }
});
