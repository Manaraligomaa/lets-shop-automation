import { ApiClient } from './api-client';
import { Endpoint } from './endpoints';
import { ProductDetailSchema, ProductListSchema, type Product } from './schemas';

/** The filter body the dashboard sends; unset fields mean "any". */
export interface ProductQuery {
  productName?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  productCategory?: string[];
  productSubCategory?: string[];
  productFor?: string[];
}

const ANY: Required<ProductQuery> = {
  productName: '',
  minPrice: null,
  maxPrice: null,
  productCategory: [],
  productSubCategory: [],
  productFor: [],
};

export class ProductApi extends ApiClient {
  /** Products matching `query`, sent exactly as the dashboard sends it; no query returns the whole catalog. */
  async search(query: ProductQuery = {}): Promise<Product[]> {
    return (await this.send('post', Endpoint.products, ProductListSchema, { ...ANY, ...query })).data;
  }

  async byId(id: string): Promise<Product> {
    return (await this.send('get', `${Endpoint.productDetail}${id}`, ProductDetailSchema)).data;
  }

  async byName(name: string): Promise<Product> {
    const product = (await this.search()).find((p) => p.productName === name);
    if (!product) throw new Error(`Product "${name}" is not in the catalog`);
    return product;
  }
}
