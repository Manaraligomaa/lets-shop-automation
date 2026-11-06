import { mergeTests } from '@playwright/test';
import { test as pagesTest } from './pages.fixture';
import { test as browserTest } from './browser.fixture';
import { test as sessionTest } from './session.fixture';

/** The `test` UI specs import: page objects, network control, failure diagnostics, session and API clients. */
export const test = mergeTests(pagesTest, browserTest, sessionTest);

/** The `test` API specs import (`import { apiTest as test }`): session and API clients only, so no browser starts. */
export const apiTest = sessionTest;

/** Playwright's `expect` plus custom matchers (`toHaveRoute`, `toMatchSchema`). */
export { expect } from './matchers';
