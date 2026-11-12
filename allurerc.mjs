import { defineConfig } from 'allure';

/** Allure report of the last run: `npm run allure` builds it from test-results/allure-results and opens it. */
export default defineConfig({
  name: "Let's Shop automation",
  resultsDir: './test-results/allure-results',
  output: './allure-report',
  // Kept between runs (test-results/ is emptied every run), so the report shows each test's history and trend.
  historyPath: './.cache/allure-history.jsonl',
  plugins: {
    awesome: {
      options: { reportName: "Let's Shop automation", reportLanguage: 'en' },
    },
  },
});
