import { test, expect } from '../../fixtures/test';
import { details } from '../../utils/test-case';
import { resolve } from '../../utils/test-data';
import { Endpoint } from '../../api/endpoints';
import raw from '../../data/checkout.data.json';

const data = resolve(raw);

test.describe(data.title, { tag: `@${data.feature}` }, () => {
  test.use({ account: 'shared' });

  // The order page takes product ids from its route, so these tests need no cart. No order may be placed.
  test.beforeEach(async ({ network, checkoutPage }) => {
    await network.block(Endpoint.createOrder);
    await checkoutPage.openFor([data.productId]);
  });

  for (const row of data.shippingEmail) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ checkoutPage }) => {
      await expect(checkoutPage.shippingEmail).toHaveValue(row.expectedEmail);
    });
  }

  for (const row of data.countrySearch) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ checkoutPage }) => {
      await checkoutPage.typeCountry(row.typed);
      await expect(checkoutPage.countryOption(row.country)).toBeVisible();
      await checkoutPage.chooseCountry(row.country);
      await expect(checkoutPage.countryInput).toHaveValue(row.country);
    });
  }

  for (const row of data.missingCountry) {
    test(`${row.tc}: ${row.name}`, details(row), async ({ network, checkoutPage, toast }) => {
      await checkoutPage.placeOrder();
      await expect(toast.container).toContainText(row.expectedToast);
      expect(network.callsTo(Endpoint.createOrder)).toHaveLength(0);
    });
  }
});
