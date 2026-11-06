import { expect as baseExpect, type APIResponse, type Page } from '@playwright/test';
import { z } from 'zod';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const isApiResponse = (value: unknown): value is APIResponse =>
  typeof (value as APIResponse | undefined)?.json === 'function' && typeof (value as APIResponse).status === 'function';

export const expect = baseExpect.extend({
  /**
   * Waits until the page is on the given SPA hash route, e.g. "#/auth/login".
   * `exact: false` allows anything after it, e.g. the query in "#/dashboard/order?prop=...".
   */
  async toHaveRoute(page: Page, route: string, options?: { exact?: boolean; timeout?: number }) {
    const name = 'toHaveRoute';
    const pattern = new RegExp(`${escapeRegExp(route)}${options?.exact === false ? '' : '$'}`);
    let pass: boolean;
    let actual: unknown;
    try {
      const assertion = this.isNot ? baseExpect(page).not : baseExpect(page);
      await assertion.toHaveURL(pattern, { timeout: options?.timeout });
      pass = !this.isNot;
    } catch (error) {
      actual = (error as { matcherResult?: { actual?: unknown } }).matcherResult?.actual;
      pass = this.isNot;
    }
    const message = () =>
      `${this.utils.matcherHint(name, undefined, undefined, { isNot: this.isNot })}\n\n` +
      `Expected route: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(route)}\n` +
      `Received URL: ${this.utils.printReceived(actual ?? page.url())}`;
    return { name, pass, message, expected: route, actual };
  },

  /**
   * Checks an API response body (or any value) against a zod schema; a failure lists every field that broke.
   *
   *   await expect(response).toMatchSchema(MessageSchema);
   */
  async toMatchSchema(received: unknown, schema: z.ZodType) {
    const name = 'toMatchSchema';
    const body: unknown = isApiResponse(received) ? await received.json() : received;
    const result = schema.safeParse(body);
    const message = () =>
      `${this.utils.matcherHint(name, undefined, undefined, { isNot: this.isNot })}\n\n` +
      (result.success ? 'Expected the body not to match the schema.\n' : `${z.prettifyError(result.error)}\n\n`) +
      `Received: ${this.utils.printReceived(body)}`;
    return { name, pass: result.success, message, actual: body };
  },
});
