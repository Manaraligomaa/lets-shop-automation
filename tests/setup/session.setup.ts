import { test as setup, expect } from '@playwright/test';
import { AuthApi } from '../../api/auth.api';
import { saveSession } from '../../api/session';
import { env } from '../../config/env';

// Log in once per run: every login empties the account's cart, so logged-in tests reuse this token.
setup('log in the shared account by API', async ({ request, baseURL }) => {
  const session = await new AuthApi(request).login(env.user.email, env.user.password);
  expect(session.token, 'login returned no token').toBeTruthy();
  saveSession(session, baseURL!);
});
