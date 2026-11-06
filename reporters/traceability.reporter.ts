import fs from 'node:fs';
import path from 'node:path';
import { type FullConfig, type Reporter, type TestCase } from '@playwright/test/reporter';

interface Row {
  tc: string;
  jira: string;
  title: string;
  result: string;
  note: string;
}

/**
 * Writes test-results/traceability.md: one row per test case with its Jira issue, final result and
 * known-bug note, so a run can go straight into a test report. Retries collapse into one final result.
 */
export default class TraceabilityReporter implements Reporter {
  private outputFile = '';
  private readonly tests = new Map<string, TestCase>();

  /** Next to the run's other results (the projects' output folder, test-results/ by default). */
  onBegin(config: FullConfig): void {
    this.outputFile = path.join(config.projects[0]?.outputDir ?? 'test-results', 'traceability.md');
  }

  onTestEnd(test: TestCase): void {
    this.tests.set(test.id, test);
  }

  onEnd(): void {
    const rows = [...this.tests.values()].map((test) => this.row(test)).filter((row): row is Row => !!row);
    rows.sort((a, b) => a.tc.localeCompare(b.tc, 'en', { numeric: true }));
    const count = (result: string) => rows.filter((r) => r.result === result).length;
    const summary = ['passed', 'FAILED', 'flaky', 'known bug', 'BUG FIXED?', 'skipped']
      .map((result) => `${result}: ${count(result)}`)
      .join(' · ');
    const lines = [
      '# Test traceability',
      '',
      `${new Date().toISOString()} · ${rows.length} test cases · ${summary}`,
      '',
      '| Test case | Jira | Title | Result | Note |',
      '|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.tc} | ${r.jira} | ${r.title} | ${r.result} | ${r.note} |`),
      '',
    ];
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(this.outputFile, lines.join('\n'));
  }

  /** Tests without a test-case id (the setup login) are left out. */
  private row(test: TestCase): Row | undefined {
    const tc = test.tags.find((tag) => tag.startsWith('@TC-'))?.slice(1);
    if (!tc) return undefined;
    const annotation = (type: string) => test.annotations.find((a) => a.type === type)?.description ?? '';
    const last = test.results.at(-1);
    const result = {
      expected: test.expectedStatus === 'failed' ? 'known bug' : 'passed',
      unexpected: last?.status === 'passed' ? 'BUG FIXED?' : 'FAILED',
      flaky: 'flaky',
      skipped: 'skipped',
    }[test.outcome()];
    const title = test.title.replace(/^.*?: /, '').replace(/\|/g, '\\|');
    return { tc, jira: annotation('issue'), title, result, note: annotation('bug').replace(/\|/g, '\\|') };
  }
}
