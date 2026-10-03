import * as auth from "./auth";
import * as user from "./user";
import * as orders from "./orders";
import * as sales from "./sales";
import * as tsrSales from "./tsr-sales";
import * as products from "./products";
import * as categories from "./categories";
import { apiClient } from "./client";
import type { User } from "./user/user.types";

export * from "./auth";
export * from "./user";
export * from "./orders";
export * from "./sales";
export * from "./tsr-sales";
export * from "./products";
export * from "./categories";

export const api = {
  ...auth,
  ...user,
  ...orders,
  ...sales,
  ...tsrSales,
  ...products,
  ...categories,
  setToken: (token: string) => apiClient.setToken(token),
  getToken: () => apiClient.getToken(),
  clearToken: () => apiClient.clearToken(),
  setUser: (currentUser: User) => apiClient.setUser(currentUser),
  getUser: () => apiClient.getUser(),
};
