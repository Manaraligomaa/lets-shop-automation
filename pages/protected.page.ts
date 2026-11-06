import { BasePage } from './base.page';
import { step } from '../utils/step';

/** Any protected shop page, opened by route for access-control, navigation and sign-out tests. */
export class ProtectedPage extends BasePage {
  protected path = '#/dashboard/dash';

  @step('Open {0}')
  async openRoute(route: string): Promise<void> {
    this.path = route;
    await this.open();
  }
}
