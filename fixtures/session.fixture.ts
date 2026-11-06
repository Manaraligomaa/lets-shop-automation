import { test as base } from '@playwright/test';
import { AuthApi } from '../api/auth.api';
import { CartApi } from '../api/cart.api';
import { ProductApi } from '../api/product.api';
import { loadSession, STORAGE_STATE } from '../api/session';
import { type Session } from '../api/schemas';

export type SessionOptions = {
  /** 'none': logged-out visitor. 'shared': USER_EMAIL account, using the token saved by the setup project. */
  account: 'none' | 'shared';
};

export type SessionFixtures = {
  /** Login API (no token). */
  authApi: AuthApi;
  /** Catalog API as the shared account. */
  productApi: ProductApi;
  /** Sets up, checks and cleans the shared account's cart by API. */
  cartApi: CartApi;
};

type WorkerFixtures = {
  /** The token saved by the setup project, read once per worker. */
  session: Session;
};

/** Session and API clients. Needs no browser, so API specs use it on its own (`apiTest`). */
export const test = base.extend<SessionOptions & SessionFixtures, WorkerFixtures>({
  account: ['none', { option: true }],
  session: [async ({}, use) => use(loadSession()), { scope: 'worker' }],
  // Reuse the saved token instead of logging in again: every login empties the account's cart.
  storageState: async ({ account, storageState }, use) => use(account === 'shared' ? STORAGE_STATE : storageState),
  authApi: async ({ request }, use) => use(new AuthApi(request)),
  productApi: async ({ request, session }, use) => use(new ProductApi(request, session.token)),
  cartApi: async ({ request, session }, use) => use(new CartApi(request, session)),
});
