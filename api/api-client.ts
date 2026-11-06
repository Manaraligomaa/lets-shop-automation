import { errors, type APIRequestContext, type APIResponse } from '@playwright/test';
import { z } from 'zod';
import { apiUrl } from './endpoints';

type Method = 'get' | 'post' | 'delete';

/** The practice API answers slowly under load (5-20 s seen) rather than not at all, so one attempt waits long. */
const REQUEST_TIMEOUT_MS = 25_000;
const RETRY_DELAY_MS = 1_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Base for the API clients. Adds the base URL and auth header, retries once on a dropped connection,
 * and checks every response against its contract, so an API change fails with a readable message.
 */
export abstract class ApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  /** The unchecked response, for API tests that assert status codes and error bodies. */
  async raw(method: Method, path: string, data?: unknown): Promise<APIResponse> {
    const headers = this.token ? { Authorization: this.token } : undefined;
    return this.withRetry(() => this.request[method](apiUrl(path), { headers, data, timeout: REQUEST_TIMEOUT_MS }));
  }

  /** The body parsed by `schema`; throws ApiError on a non-2xx status or a body that breaks the contract. */
  protected async send<S extends z.ZodType>(method: Method, path: string, schema: S, data?: unknown): Promise<z.output<S>> {
    const res = await this.raw(method, path, data);
    const call = `${method.toUpperCase()} ${path}`;
    if (!res.ok()) throw new ApiError(`${call} failed with ${res.status()}: ${await res.text()}`, res.status());
    const body = schema.safeParse(await res.json());
    if (!body.success) throw new ApiError(`${call} broke its contract:\n${z.prettifyError(body.error)}`, res.status());
    return body.data;
  }

  /**
   * The practice API sometimes drops a connection ("socket hang up"); one retry after a short pause keeps that from
   * failing the test. A timeout is not retried (the server is slow, a second wait would only start over), and
   * neither is an HTTP error status.
   */
  private async withRetry(call: () => Promise<APIResponse>): Promise<APIResponse> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof errors.TimeoutError) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return call();
    }
  }
}
