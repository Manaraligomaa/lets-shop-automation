import { env } from '../config/env';

/** Every API path the tests touch, in one place: used by the API clients, network waits and request blocking. */
export const Endpoint = {
  login: '/auth/login',
  register: '/auth/register',
  newPassword: '/auth/new-password',
  products: '/product/get-all-products',
  productDetail: '/product/get-product-detail/',
  addToCart: '/user/add-to-cart',
  cartProducts: '/user/get-cart-products/',
  removeFromCart: '/user/remove-from-cart/',
  createOrder: '/order/create-order',
} as const;

export type EndpointPath = (typeof Endpoint)[keyof typeof Endpoint];

/** Full URL of an API path, e.g. `apiUrl(Endpoint.login)`. */
export const apiUrl = (path: string): string => `${env.apiUrl}${path}`;
