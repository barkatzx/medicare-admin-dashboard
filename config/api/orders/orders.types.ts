import type { Product } from "../products/products.types";

export interface ShippingAddress {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  status: string;
  method: string;
  paidAt: string | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    pharmacy_name: string | null;
  };
  items: OrderItem[];
  payment: Payment;
  shippingAddress?: ShippingAddress;
}
