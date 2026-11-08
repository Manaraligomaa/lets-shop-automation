import { apiTest as test, expect } from '../../fixtures/test';
import { apiUrl, Endpoint } from '../../api/endpoints';
import { MessageSchema, ProductListSchema } from '../../api/schemas';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/products.api.data.json';

const data = resolve(raw);
const sorted = (names: string[]): string[] => [...names].sort();

test.describe(data.title, { tag: ['@api', `@${data.feature}`] }, () => {
  for (const row of data.catalog) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productApi }) => {
      const res = await productApi.raw('post', Endpoint.products, {});
      await expect(res).toBeOK();
      await expect(res).toMatchSchema(ProductListSchema);
      const body = ProductListSchema.parse(await res.json());
      expect(body.count, 'count matches the number of products').toBe(body.data.length);
      expect(body.data.map((p) => p.productName)).toEqual(expect.arrayContaining(row.expectedProducts));
    });
  }

  for (const row of data.detail) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productApi }) => {
      const product = await productApi.byId(row.productId);
      expect(product).toMatchObject({ _id: row.productId, productName: row.expectedName, productPrice: row.expectedPrice });
    });
  }

  for (const row of data.unknownProduct) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productApi }) => {
      const res = await productApi.raw('get', `${Endpoint.productDetail}${row.productId}`);
      expect(res.status()).toBe(row.expectedStatus);
      expect(await res.json()).toMatchObject({ message: row.expectedMessage });
    });
  }

  for (const row of data.noToken) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ request }) => {
      const res = await request.post(apiUrl(Endpoint.products), { data: {} });
      expect(res.status()).toBe(row.expectedStatus);
      expect(await res.json()).toMatchObject({ message: row.expectedMessage });
    });
  }

  for (const row of data.filters) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productApi }) => {
      const products = await productApi.search(row.query);
      expect(sorted(products.map((p) => p.productName))).toEqual(sorted(row.expectedProducts));
    });
  }

  // Known bugs: each asserts the correct behavior. `test.fail()` comes right before the assertion the bug breaks,
  // so only that assertion may fail; a timeout before it still fails the test. When the bug is fixed, Playwright
  // reports "expected to fail, but passed" and the row moves to `filters`.
  for (const row of data.filterBugs) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productApi }) => {
      const products = await productApi.search(row.query);
      test.fail();
      expect(sorted(products.map((p) => p.productName))).toEqual(sorted(row.expectedProducts));
    });
  }

  for (const row of data.malformedId) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ productApi }) => {
      const res = await productApi.raw('get', `${Endpoint.productDetail}${row.productId}`);
      test.fail();
      expect(res.status()).toBe(row.expectedStatus);
      await expect(res).toMatchSchema(MessageSchema);
    });
  }
});
