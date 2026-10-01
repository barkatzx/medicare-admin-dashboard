import { apiClient } from "../client";
import type { Category } from "./categories.types";

export async function getAllCategories(): Promise<Category[]> {
  const result = await apiClient.request("/categories/");
  if (result && result.categories && Array.isArray(result.categories)) {
    return result.categories;
  }
  if (Array.isArray(result)) {
    return result;
  }
  return [];
}

export async function createCategory(name: string, description?: string): Promise<Category> {
  return apiClient.request("/categories/", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function updateCategory(
  id: string,
  name: string,
  description?: string,
): Promise<Category> {
  return apiClient.request(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, description }),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return apiClient.request(`/categories/${id}`, {
    method: "DELETE",
  });
}
