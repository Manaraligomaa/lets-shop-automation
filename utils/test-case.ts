import { type TestDetails, type TestDetailsAnnotation } from '@playwright/test';
import { env } from '../config/env';

/** The fields a data row needs to become a test case. */
export interface TestCase {
  /** Test-case id, e.g. "TC-CART-01". */
  tc: string;
  /** Jira Subtask key, e.g. "AI-30", when the case is in Jira. */
  jira?: string;
  tags: string[];
  /** A known application bug that makes this case fail; declare the test with `test.fail`. */
  bug?: string;
}

/**
 * Tags and report annotations for a data row, so every result traces back to its test case:
 * `@AI-30 @TC-AUTH-10-02` plus the row's tags, a link to the Jira issue (when JIRA_URL is set),
 * and for a known bug the `@known-bug` tag and its description.
 */
export function details(row: TestCase): TestDetails {
  const ids = row.jira ? [row.jira, row.tc] : [row.tc];
  const annotation: TestDetailsAnnotation[] = [];
  if (row.jira) annotation.push({ type: 'issue', description: env.jiraUrl ? `${env.jiraUrl}/browse/${row.jira}` : row.jira });
  if (row.bug) annotation.push({ type: 'bug', description: row.bug });
  return { tag: [...ids.map((id) => `@${id}`), ...row.tags, ...(row.bug ? ['@known-bug'] : [])], annotation };
}

/**
 * Test locks (Playwright `lock` detail) for server state the tests share: tests that hold the same lock
 * never run at the same time, while everything else stays parallel.
 */
export const Lock = {
  /** The shared account's cart. Hold it to change the cart, or to log in: every login empties the cart. */
  cart: 'shared-cart',
} as const;
