import { apiTest as test, expect } from '../../fixtures/test';
import { Endpoint } from '../../api/endpoints';
import { MessageSchema } from '../../api/schemas';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/AI-10-login.api.data.json';

const data = resolve(raw);

test.describe(`${data.story} ${data.title}`, { tag: ['@api', `@${data.story}`] }, () => {
  // Only a successful login empties the cart, so these rejected logins need no cart lock.
  for (const row of data.rejected) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ authApi }) => {
      const res = await authApi.raw('post', Endpoint.login, row.body);
      expect(res.status()).toBe(row.expectedStatus);
      await expect(res).toMatchSchema(MessageSchema);
      expect(await res.json()).toMatchObject({ message: row.expectedMessage });
    });
  }
});
