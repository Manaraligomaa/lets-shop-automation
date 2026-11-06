import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { step } from '../utils/step';

export class LoginPage extends BasePage {
  protected readonly path = '#/auth/login';

  readonly emailInput: Locator = this.page.getByRole('textbox', { name: 'email@example.com' });
  /** Password inputs have no ARIA role, so the stable id is used. */
  readonly passwordInput: Locator = this.page.locator('#userPassword');
  readonly loginButton: Locator = this.page.getByRole('button', { name: 'Login' });
  readonly forgotPasswordLink: Locator = this.page.getByRole('link', { name: 'Forgot password?' });

  @step('Fill in login credentials')
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  @step('Submit the login form')
  async submit(): Promise<void> {
    await this.click(this.loginButton);
  }

  @step('Log in')
  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  @step('Open Forgot password')
  async openForgotPassword(): Promise<void> {
    await this.click(this.forgotPasswordLink);
  }
}
