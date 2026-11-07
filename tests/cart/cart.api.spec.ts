import { apiTest as test, expect } from '../../fixtures/test';
import { Endpoint } from '../../api/endpoints';
import { MessageSchema } from '../../api/schemas';
import { details, Lock } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import raw from '../../data/cart.api.data.json';

const data = resolve(raw);

test.describe(data.title, { tag: ['@api', `@${data.feature}`], lock: Lock.cart }, () => {
  test.beforeEach(async ({ cartApi }) => {
    await cartApi.clear();
  });

  test.afterEach(async ({ cartApi }) => {
    await cartApi.clear();
  });

  for (const row of data.emptyCart) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi, session }) => {
      const res = await cartApi.raw('get', `${Endpoint.cartProducts}${session.userId}`);
      await expect(res).toBeOK();
      await expect(res).toMatchSchema(MessageSchema);
      expect(await res.json()).toMatchObject({ message: row.expectedMessage });
    });
  }

  for (const row of data.addProducts) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi, productApi }) => {
      await cartApi.add(...row.products);
      const catalog = await productApi.search();
      const priceOf = (name: string) => catalog.find((p) => p.productName === name)?.productPrice;
      const cart = (await cartApi.contents()).map((p) => ({ name: p.productName, price: p.productPrice }));
      expect(cart).toHaveLength(row.products.length);
      expect(cart).toEqual(expect.arrayContaining(row.products.map((name) => ({ name, price: priceOf(name) }))));
    });
  }

  for (const row of data.removeProduct) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ cartApi }) => {
      await cartApi.add(...row.products);
      await cartApi.remove(row.remove);
      expect(await cartApi.productNames()).toEqual(row.remaining);
    });
  }
});
