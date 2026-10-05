import { apiClient } from "../client";
import type { Distributor } from "./distributors.types";

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

export async function createDistributor(name: string): Promise<Distributor> {
  return requestDistributorRoute("POST", "", { name });
}

export async function updateDistributor(
  id: string,
  name: string,
): Promise<Distributor> {
  return requestDistributorRoute("PATCH", `/${id}`, { name });
}

export async function deleteDistributor(id: string): Promise<void> {
  await requestDistributorRoute("DELETE", `/${id}`);
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
