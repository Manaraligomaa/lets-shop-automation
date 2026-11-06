import { ApiClient } from './api-client';
import { Endpoint } from './endpoints';
import { SessionSchema, type Session } from './schemas';

export class AuthApi extends ApiClient {
  /** Note: every successful login empties the account's cart on the server. */
  async login(email: string, password: string): Promise<Session> {
    return this.send('post', Endpoint.login, SessionSchema, { userEmail: email, userPassword: password });
  }
}
