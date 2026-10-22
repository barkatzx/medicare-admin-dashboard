import { apiClient } from "../client";
import type { Distributor, DistributorInput } from "./distributors.types";

const distributorRoutes = ["/dristributors", "/distributors"] as const;

async function requestDistributorRoute(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<any> {
  let lastError: unknown;

  for (const route of distributorRoutes) {
    try {
      const options: RequestInit = { method };
      if (body && (method === "POST" || method === "PATCH")) {
        options.body = JSON.stringify(body);
      }
      return await apiClient.request(`${route}${path}`, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to complete distributor request");
}

export async function getAllDistributor(): Promise<Distributor[]> {
  const result = await requestDistributorRoute("GET", "");

  if (result && result.distributors && Array.isArray(result.distributors)) {
    return result.distributors;
  }

  if (result && result.data && Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

export async function getDistributorById(id: string): Promise<Distributor> {
  return requestDistributorRoute("GET", `/${id}`);
}

export async function createDistributor(
  name: string,
  details: DistributorInput = {},
): Promise<Distributor> {
  return requestDistributorRoute("POST", "", { name, ...details });
}

export async function updateDistributor(
  id: string,
  name: string,
  details: DistributorInput = {},
): Promise<Distributor> {
  return requestDistributorRoute("PATCH", `/${id}`, { name, ...details });
}

export async function deleteDistributor(id: string): Promise<void> {
  await requestDistributorRoute("DELETE", `/${id}`);
}

export interface DistributorProductsPage {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getDistributorProductsPage(
  id: string,
  page = 1,
  limit = 20,
): Promise<DistributorProductsPage> {
  const result = await requestDistributorRoute(
    "GET",
    `/${id}/products?page=${page}&limit=${limit}`,
  );

  const products: any[] = Array.isArray(result)
    ? result
    : Array.isArray(result?.products)
      ? result.products
      : Array.isArray(result?.data)
        ? result.data
        : [];
  const p = result?.pagination;
  const total = typeof p?.total === "number" ? p.total : products.length;
  const pageLimit = typeof p?.limit === "number" ? p.limit : limit;

  return {
    products,
    pagination: {
      page: typeof p?.page === "number" ? p.page : page,
      limit: pageLimit,
      total,
      totalPages:
        typeof p?.totalPages === "number"
          ? p.totalPages
          : Math.max(1, Math.ceil(total / pageLimit)),
    },
  };
}

export async function getDistributorProducts(id: string): Promise<any[]> {
  const result = await requestDistributorRoute("GET", `/${id}/products`);

  if (result && result.products && Array.isArray(result.products)) {
    return result.products;
  }

  if (result && result.data && Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}
