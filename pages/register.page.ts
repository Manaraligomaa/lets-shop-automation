import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { step } from '../utils/step';

export interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation: string;
  gender: string;
  password: string;
  confirmPassword: string;
  ageConfirmed: boolean;
}

export class RegisterPage extends BasePage {
  protected readonly path = '#/auth/register';

  readonly firstNameInput: Locator = this.page.getByLabel('First Name');
  readonly lastNameInput: Locator = this.page.getByLabel('Last Name');
  readonly emailInput: Locator = this.page.getByRole('textbox', { name: 'email@example.com' });
  readonly phoneInput: Locator = this.page.getByRole('textbox', { name: 'enter your number' });
  readonly occupationSelect: Locator = this.page.getByRole('combobox');
  readonly passwordInput: Locator = this.page.locator('#userPassword');
  readonly confirmPasswordInput: Locator = this.page.getByLabel('Confirm Password');
  readonly ageCheckbox: Locator = this.page.getByRole('checkbox');
  readonly registerButton: Locator = this.page.getByRole('button', { name: 'Register' });

  genderRadio(gender: string): Locator {
    return this.page.getByRole('radio', { name: gender, exact: true });
  }

  /** Fills only the fields present in `form`; missing fields are left untouched. */
  @step('Fill in the registration form')
  async fillForm(form: Partial<RegistrationForm>): Promise<void> {
    if (form.firstName !== undefined) await this.firstNameInput.fill(form.firstName);
    if (form.lastName !== undefined) await this.lastNameInput.fill(form.lastName);
    if (form.email !== undefined) await this.emailInput.fill(form.email);
    if (form.phone !== undefined) await this.phoneInput.fill(form.phone);
    if (form.occupation !== undefined) await this.occupationSelect.selectOption({ label: form.occupation });
    if (form.gender !== undefined) await this.genderRadio(form.gender).check();
    if (form.password !== undefined) await this.passwordInput.fill(form.password);
    if (form.confirmPassword !== undefined) await this.confirmPasswordInput.fill(form.confirmPassword);
    if (form.ageConfirmed !== undefined) await this.ageCheckbox.setChecked(form.ageConfirmed);
  }

  @step('Submit the registration form')
  async submit(): Promise<void> {
    await this.click(this.registerButton);
  }
}
