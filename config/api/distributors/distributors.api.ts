import { ApiError, apiClient } from "../client";
import type { Distributor, DistributorInput } from "./distributors.types";
import type { Product } from "../products/products.types";

const distributorRoutes = ["/dristributors", "/distributors"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDistributor(value: unknown): value is Distributor {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function parseDistributor(value: unknown): Distributor {
  if (!isDistributor(value)) {
    throw new Error("Distributor response is missing its id or name.");
  }
  return value;
}

function isProduct(value: unknown): value is Product {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !(typeof value.name === "string" || value.name === null) ||
    typeof value.description !== "string" ||
    typeof value.price !== "number" ||
    !(typeof value.discountedPrice === "number" ||
      value.discountedPrice === null) ||
    typeof value.discountPercent !== "number" ||
    typeof value.stock !== "number" ||
    !(typeof value.distributor === "string" || value.distributor === null) ||
    !(typeof value.tp === "number" || value.tp === null) ||
    typeof value.categoryId !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return false;
  }
  return true;
}

function parseProduct(value: unknown): Product {
  if (!isProduct(value)) {
    throw new Error(
      "Distributor products response contains invalid product data.",
    );
  }
  return value;
}

function unwrapList(value: unknown, key: string): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;
  const candidate = value[key] ?? value.data;
  return Array.isArray(candidate) ? candidate : null;
}

async function requestDistributorRoute(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<unknown> {
  let lastError: unknown;

  for (const route of distributorRoutes) {
    try {
      const options: RequestInit = { method };
      if (body && (method === "POST" || method === "PATCH")) {
        options.body = JSON.stringify(body);
      }
      if (signal) options.signal = signal;
      return await apiClient.request<unknown>(`${route}${path}`, options);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to complete distributor request");
}

export async function getAllDistributor(
  signal?: AbortSignal,
): Promise<Distributor[]> {
  const result = await requestDistributorRoute("GET", "", undefined, signal);
  const list = unwrapList(result, "distributors");
  if (!list) {
    throw new Error("Distributor response is missing the distributor list.");
  }
  return list.map(parseDistributor);
}

export async function getDistributorById(id: string): Promise<Distributor> {
  const result = await requestDistributorRoute(
    "GET",
    `/${encodeURIComponent(id)}`,
  );
  const distributor =
    isRecord(result) && "distributor" in result ? result.distributor : result;
  return parseDistributor(distributor);
}

export async function createDistributor(
  name: string,
  details: DistributorInput = {},
): Promise<Distributor> {
  return parseDistributor(
    await requestDistributorRoute("POST", "", { name, ...details }),
  );
}

export async function updateDistributor(
  id: string,
  name: string,
  details: DistributorInput = {},
): Promise<Distributor> {
  return parseDistributor(
    await requestDistributorRoute(
      "PATCH",
      `/${encodeURIComponent(id)}`,
      { name, ...details },
    ),
  );
}

export async function deleteDistributor(id: string): Promise<void> {
  await requestDistributorRoute("DELETE", `/${encodeURIComponent(id)}`);
}

export interface DistributorProductsPage {
  products: Product[];
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
    `/${encodeURIComponent(id)}/products?page=${page}&limit=${limit}`,
  );

  const productList = unwrapList(result, "products");
  if (!productList) {
    throw new Error("Distributor products response is missing the product list.");
  }
  const products = productList.map(parseProduct);
  const p = isRecord(result) && isRecord(result.pagination)
    ? result.pagination
    : undefined;
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

export async function getDistributorProducts(id: string): Promise<Product[]> {
  const result = await requestDistributorRoute(
    "GET",
    `/${encodeURIComponent(id)}/products`,
  );
  const products = unwrapList(result, "products");
  if (!products) {
    throw new Error("Distributor products response is missing the product list.");
  }
  return products.map(parseProduct);
}
