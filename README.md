# Let's Shop — Playwright automation

POM + custom fixtures + data-driven tests at two layers, UI and API. Every input and expected value lives in `data/<STORY>-<slug>.data.json` (UI) or `data/<feature>.api.data.json` (API); specs loop over the rows.

## Run
```bash
npm ci
npx playwright install chromium     # or set BROWSER_CHANNEL=chrome in .env to use installed Chrome
cp .env.example .env                # fill USER_EMAIL / USER_PASSWORD (never commit .env)
npm test                            # all tests
npm run test:smoke                  # @smoke only
npm run test:api                    # API layer only (no browser, seconds)
npm run test:bugs                   # known application bugs: shows which are still open
npx playwright test --grep @AI-13   # one story, UI and API
npm run test:headed                 # watch it, one test at a time
npm run test:ui                     # UI mode: pick, watch and time-travel tests
npm run report                      # open the last HTML report
npm run check                       # tsc + eslint
```

## Layout
| Folder | Contents |
|---|---|
| `config/env.ts` | Typed settings from `.env` / CI secrets; URLs are validated, credentials read only when needed |
| `api/` | `ApiClient` base (base URL, auth, per-attempt timeout and one retry, contract check on every response), `AuthApi`, `ProductApi`, `CartApi`; `schemas.ts` holds the response contracts (zod) and the types derived from them; `endpoints.ts` is the single list of API paths; `session.ts` saves the login token |
| `components/` | `BaseComponent` (spinner wait, safe click, race-free `waitForApi`), `Header`, `Toast` |
| `pages/` | Page objects extending `BasePage` (`BaseComponent` + navigation). Actions carry `@step` titles |
| `fixtures/` | `pages.fixture.ts` (page objects), `browser.fixture.ts` (`network`, auto `staticAssets` and `diagnostics`), `session.fixture.ts` (`account` option, worker-scoped `session`, `authApi`, `productApi`, `cartApi`), merged in `test.ts`; `matchers.ts` adds `toHaveRoute` and `toMatchSchema` |
| `reporters/` | `traceability.reporter.ts`: writes `test-results/traceability.md` |
| `utils/` | `test-case.ts` (`details(row)`, `Lock`), `asset-cache.ts` (shared disk cache for the app's static files), `step.ts` (`@step` decorator), `network-monitor.ts` (record/block API calls), `test-data.ts` (`{{env.X}}`, `{{unique}}`) |
| `data/` | Test data per Story or feature |
| `tests/<module>/` | Per feature: `*.spec.ts` (UI) and `*.api.spec.ts` (API). Titles start with the Jira Subtask key, or the test-case ID (`TC-CART-01`) where there is no Jira issue yet |
| `.github/workflows/` | `playwright.yml`: lint, typecheck and the whole suite on every pull request (see CI) |

## Conventions
- **Specs** import `test`/`expect` from `fixtures/test.ts` (ESLint blocks `@playwright/test`); API specs use `import { apiTest as test }`, so no browser starts. Specs receive page objects and clients from fixtures and assert. No raw locators, no `new SomePage()`, no hard waits (enforced by ESLint).
- **Test details**: `test(title, details(row), ...)`. `details` adds the ID tags (`@AI-30 @TC-AUTH-10-02`), the row's tags, and a Jira link annotation when `JIRA_URL` is set.
- **Page objects** expose locators and actions, never assertions. Locator order: role → label → test id → CSS (last resort, with a comment why).
- **Network waits**: start `waitForApi(Endpoint.x)` *before* the action that triggers the request, await it after. Pages open on `domcontentloaded` and then wait for the app's own signals (spinner, API response), never for every image to load.
- **Steps**: decorate each action with `@step('Title {0}')`; `{n}` inserts argument n. Never put credentials in a title.
- **Routes**: `await expect(page).toHaveRoute('#/auth/login')`; add `{ exact: false }` when a query follows.
- **Contracts**: every client call is checked against its schema in `api/schemas.ts`; API tests assert it explicitly with `await expect(res).toMatchSchema(Schema)`.
- **Setup data** goes through `cartApi` (API), not the UI. Cart tests also check the server after UI actions (`expect(await cartApi.productNames()).toEqual(...)`). API endpoints come from `Endpoint`, never string literals.
- **Lint** is type-aware: a missing `await` on a promise fails `npm run lint`.

## Known bugs are tests
A known application bug is a data row with a `bug` field (tagged `@known-bug` by `details`). The test asserts the *correct* behavior and calls `test.fail()` right before the assertion the bug breaks:
- bug still there → the assertion fails as expected, the run stays green, the report shows it as a known bug;
- bug fixed → "expected to fail, but passed" fails the run: move the row to the normal list;
- anything else breaks (timeout, network) → `test.fail()` was not reached yet, so the test fails normally. This is why it is not declared with `test.fail(title, ...)`, which would accept any failure.

| Test case | Bug |
|---|---|
| TC-CART-09 | Cart subtotal is wrong after removing a product: $66500 minus a $55000 item shows $78000 until reload |
| TC-OUT-10 | Sign Out only deletes the token in the browser; the server still accepts it (200) |
| TC-API-PRD-07 | Search is case-sensitive: `zara` finds nothing |
| TC-API-PRD-08 | Search matches only from the start of the name: `COAT` finds nothing |
| TC-API-PRD-09 | Min price alone is ignored: min 20000 still returns the $11500 products |
| TC-API-PRD-10 | Max price alone is ignored: max 20000 still returns the $55000 product |
| TC-API-PRD-11 | A malformed product id returns 500 with the raw database error (Mongoose CastError) |

Not automated: Sign Out (and HOME) cannot be clicked on the order page, because the order form covers the header.

Not automated: the dashboard shows the filter answer that arrives last, not the answer to the latest filter. Typing a min and then a max price sends two searches; when the first answer is slower, the list shows the result for the min price alone (seen once as a flaky TC-PRD-05). `setPriceRange` waits for each search to finish, so TC-PRD-05 checks the filter, not this race.

## Scheduling: test locks
Every successful login empties the account's cart on the server, and the account has one cart. Instead of ordering projects, tests that change the cart, or log in through the UI, hold the `Lock.cart` [test lock](https://playwright.dev/docs/test-parallel#test-locks) (`utils/test-case.ts`). Tests holding the same lock never run at the same time; everything else runs in parallel.

| Project | Runs |
|---|---|
| `setup` | `tests/setup/session.setup.ts`: logs in once by API and saves the token to `.auth/` (gitignored). Logged-in tests reuse it. |
| `chromium` | Every UI and API spec, after `setup`. Holders of `Lock.cart`: `tests/cart/` (UI and API), AI-59, TC-OUT-09. |

Feature tags: `@api`, `@navigation`, `@products`, `@cart`, `@checkout`, `@logout`, `@security`, `@known-bug` (e.g. `npx playwright test --grep @cart`).

## Reports and diagnostics
- `playwright-report/`: HTML report with steps, tags, Jira links and known-bug notes (`npm run report`).
- `test-results/traceability.md`: one row per test case (Jira key, title, result: passed / FAILED / flaky / known bug / BUG FIXED?).
- `test-results/<test>/browser-log.txt` on failure: console errors, page errors, failed, 4xx/5xx, slow and still-pending requests.
- Screenshots and traces are kept only for failed tests. On CI: JUnit at `test-results/junit.xml`.

## CI
`.github/workflows/playwright.yml` runs lint, typecheck and the whole suite with no retries on every pull request to `main` and every push to it, and uploads the report and `test-results/` when something fails. It needs the repository secrets `USER_EMAIL` and `USER_PASSWORD` (the test account). All runs share that account, so they wait for each other (`concurrency`); don't run the suite locally while a CI run is going.

## Speed and timeouts
- **Static-asset cache.** Every test starts with an empty browser cache, so on its own each one downloads the whole app (about 1.4 MB) again, which on a slow connection outlasts the test timeout. `utils/asset-cache.ts` serves the app's scripts, styles, fonts and images from `.cache/static-assets/` (gitignored), shared by all tests, workers and runs. This is safe because the build puts a content hash in those file names; the HTML page and the API always go to the network. `ASSET_CACHE=off` turns it off; delete `.cache/` to start cold.
- **Base URL** is used with a trailing slash: `/client` answers with a redirect, an extra round trip per page open.
- **Timeouts.** The shared practice site answers slowly under load (5-20 s seen), so each test gets 60 s and each assertion 15 s. API calls wait up to 25 s; a dropped connection is retried once after 1 s, a timeout or an HTTP error status is not.
- **Retries.** Locally every test gets one retry; a test that passes on it is reported as flaky, never hidden. CI runs with no retries (see CI). With `CI` set: JUnit report, and `test.only` fails the run.
- **Connection drops.** `net::ERR_INTERNET_DISCONNECTED`, `ERR_NETWORK_CHANGED` or `ERR_NAME_NOT_RESOLVED` in a failure mean the PC lost its connection; check the Wi-Fi before the tests.

## Safety
Registration and password-change tests block `/auth/register` and `/auth/new-password`, so no real account is created or changed.
Checkout tests block `/order/create-order`; no test places an order.
Cart tests use the main `USER_EMAIL` account (no isolated account yet) and remove everything from its cart.
Sign Out tests reuse the shared token, which works only because of TC-OUT-10's bug: once Sign Out ends the session on the server, give the logout tests their own login first.
