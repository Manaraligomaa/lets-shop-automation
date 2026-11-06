import { test } from '@playwright/test';

/**
 * Reports a page-object action as one named step in the HTML report and trace, and points failures
 * at the spec line that called it (`box`). `{0}`, `{1}`... in the title insert arguments; the default
 * title shows no arguments, so passwords never reach the report.
 *
 *   @step('Search for "{0}"')  async search(term: string) { ... }
 */
export function step(title?: string) {
  return function <This extends object, Args extends unknown[], R>(
    target: (this: This, ...args: Args) => Promise<R>,
    context: ClassMethodDecoratorContext<This>,
  ) {
    return function (this: This, ...args: Args): Promise<R> {
      const name = title
        ? title.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)]))
        : `${this.constructor.name}.${String(context.name)}`;
      return test.step(name, () => target.call(this, ...args), { box: true });
    };
  };
}
