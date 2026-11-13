import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', 'allure-report'] },
  ...tseslint.configs.recommended,
  {
    // Type-aware rules: a missing `await` on a Playwright call is the most common cause of flaky tests.
    files: ['**/*.ts'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-raw-locators': 'error', // specs use page objects only
    },
  },
  {
    // Specs get test/expect (with fixtures and custom matchers) from fixtures/test.ts, never straight from Playwright.
    files: ['tests/**/*.ts'],
    ignores: ['tests/setup/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: '@playwright/test', message: 'Import test and expect from fixtures/test.ts.' }] },
      ],
    },
  },
  {
    files: ['pages/**/*.ts', 'components/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.name='expect']", message: 'No expect in page objects; assert in specs.' },
        { selector: "Literal[value=/^\\s*(\\/\\/|xpath=|\\(\\/\\/)/]", message: 'XPath is not allowed.' },
      ],
    },
  },
);
