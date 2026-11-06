import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';
import { PasswordResetPage } from '../pages/password-reset.page';
import { DashboardPage } from '../pages/dashboard.page';
import { ProtectedPage } from '../pages/protected.page';
import { ProductDetailsPage } from '../pages/product-details.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { Header } from '../components/header.component';
import { Toast } from '../components/toast.component';

export type PageFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  passwordResetPage: PasswordResetPage;
  protectedPage: ProtectedPage;
  dashboardPage: DashboardPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  header: Header;
  toast: Toast;
};

/** Page objects and components; each is built only when a test asks for it. */
export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  passwordResetPage: async ({ page }, use) => use(new PasswordResetPage(page)),
  protectedPage: async ({ page }, use) => use(new ProtectedPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  productDetailsPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  header: async ({ page }, use) => use(new Header(page)),
  toast: async ({ page }, use) => use(new Toast(page)),
});
