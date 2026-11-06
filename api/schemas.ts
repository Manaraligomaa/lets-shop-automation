import { z } from 'zod';

/**
 * Response contracts of the shop API, checked on every client call (see ApiClient.send) and by
 * `expect(response).toMatchSchema(...)` in API tests. A broken contract fails with the exact field that changed.
 */

/** Products keep unknown fields (`looseObject`): the cart API takes the whole product back. */
export const ProductSchema = z.looseObject({
  _id: z.string().regex(/^[0-9a-f]{24}$/, 'expected a 24-character id'),
  productName: z.string().min(1),
  productCategory: z.string().min(1),
  productSubCategory: z.string().min(1),
  productPrice: z.number().positive(),
  productDescription: z.string(),
  productImage: z.url(),
  productFor: z.string().min(1),
});

/** A search with no match has no `count`: `{"data":[],"message":"No Products Found"}`. */
export const ProductListSchema = z.object({
  data: z.array(ProductSchema),
  count: z.number().int().nonnegative().optional(),
  message: z.string(),
});

export const ProductDetailSchema = z.object({ data: ProductSchema, message: z.string() });

export const SessionSchema = z.object({ token: z.string().min(1), userId: z.string().min(1) });

/** An empty cart is 200 with only a message: `{"message":"No Product in Cart"}`. */
export const CartSchema = z.object({ products: z.array(ProductSchema).default([]), message: z.string() });

/** Bodies that carry only a message, e.g. "Product Added To Cart" or "Incorrect email or password.". */
export const MessageSchema = z.object({ message: z.string().min(1) });

export type Product = z.infer<typeof ProductSchema>;
export type Session = z.infer<typeof SessionSchema>;
