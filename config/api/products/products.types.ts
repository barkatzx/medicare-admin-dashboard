import type { Category } from "../categories/categories.types";
import type { Distributor } from "../distributors/distributors.types";

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  productId: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  name: string | null;
  description: string;
  price: number;
  discountedPrice: number | null;
  discountPercent: number;
  stock: number;
  distributor: string | null;
  distributorId?: string | null;
  distributorData?: Distributor | null;
  distributorName?: string | null;
  tp: number | null;
  categoryId: string;
  featured?: boolean;
  trending?: boolean;
  createdAt: string;
  updatedAt?: string;
  images?: ProductImage[];
  category?: Category;
  finalPrice?: number;
  savings?: number;
  discountBadge?: string;
  primaryImageId?: string;
}

export interface ProductPagination {
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductPage {
  products: Product[];
  pagination: ProductPagination;
}
