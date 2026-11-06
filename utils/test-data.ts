/**
 * Resolves placeholders in data-file values so no test data is hardcoded in specs:
 *   {{env.NAME}} -> process.env.NAME (credentials, emails; never committed)
 *   {{unique}}   -> a value unique to this run (e.g. new registration emails)
 */
export function resolve<T>(value: T): T {
  if (typeof value === 'string') {
    return value
      .replace(/\{\{env\.([A-Z0-9_]+)\}\}/g, (_, name: string) => {
        const v = process.env[name];
        if (!v) throw new Error(`Missing environment variable ${name} (see automation/.env.example)`);
        return v;
      })
      .replace(/\{\{unique\}\}/g, () => `${Date.now()}${Math.floor(Math.random() * 1000)}`) as T;
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)])) as T;
  }
  return value;
}
