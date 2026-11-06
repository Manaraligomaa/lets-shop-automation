import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { step } from '../utils/step';

export class PasswordResetPage extends BasePage {
  protected readonly path = '#/auth/password-new';

  readonly emailInput: Locator = this.page.getByRole('textbox', { name: 'Enter your email address' });
  readonly passwordInput: Locator = this.page.locator('#userPassword');
  readonly confirmPasswordInput: Locator = this.page.getByLabel('Confirm Password');
  readonly saveButton: Locator = this.page.getByRole('button', { name: 'Save New Password' });

  @step('Fill in the reset form')
  async fillForm(email: string, password: string, confirmPassword: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  @step('Save the new password')
  async submit(): Promise<void> {
    await this.click(this.saveButton);
  }
}
