import { apiClient, API_BASE_URL } from "../client";
import type { Product } from "./products.types";

export async function getAllProducts(
  page: number = 1,
  limit: number = 20,
  search?: string,
  categoryId?: string,
): Promise<{ products: Product[]; pagination: any }> {
  let url: string;

  // Use dedicated search endpoint when search term is provided
  if (search && search.trim()) {
    url = `/products/search?q=${encodeURIComponent(search.trim())}&page=${page}&limit=${limit}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
  } else {
    url = `/products?page=${page}&limit=${limit}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
  }

  const result = await apiClient.request(url);

  const data = result?.data ?? result;

  if (data && data.products && Array.isArray(data.products)) {
    const p = data.pagination || {};
    return {
      products: data.products,
      pagination: {
        page: p.page ?? page,
        limit: p.limit ?? limit,
        total: p.total ?? data.products.length,
        pages:
          p.totalPages ??
          p.pages ??
          Math.ceil((p.total ?? data.products.length) / limit),
      },
    };
  }

  // Some search endpoints return the array directly
  if (Array.isArray(data)) {
    return {
      products: data,
      pagination: {
        page: 1,
        limit: data.length,
        total: data.length,
        pages: 1,
      },
    };
  }

  return {
    products: [],
    pagination: { page: 1, limit, total: 0, pages: 0 },
  };
}

export async function getProductById(id: string): Promise<Product> {
  return apiClient.request(`/products/${id}`);
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  return apiClient.request("/products/", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(
  productId: string,
  productData: Partial<Product>,
): Promise<Product> {
  return apiClient.request(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiClient.request(`/products/${productId}/`, {
    method: "DELETE",
  });
}

export async function getLowStockProducts(threshold: number = 10): Promise<Product[]> {
  const result = await apiClient.request(
    `/products/admin/low-stock?threshold=${threshold}`,
  );
  if (result && result.products && Array.isArray(result.products)) {
    return result.products;
  }
  if (Array.isArray(result)) {
    return result;
  }
  return [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await apiClient.request("/products/featured");

    if (Array.isArray(response)) {
      return response;
    }

    if (response && response.products && Array.isArray(response.products)) {
      return response.products;
    }

    console.warn(
      "Unexpected response structure from featured products:",
      response,
    );
    return [];
  } catch (error) {
    console.error("Error in getFeaturedProducts:", error);
    throw error;
  }
}

export async function updateProductFeaturedStatus(
  productId: string,
  featured: boolean,
): Promise<Product> {
  return apiClient.request(`/products/${productId}/featured`, {
    method: "PATCH",
    body: JSON.stringify({ featured }),
  });
}

export async function getTrendingProducts(): Promise<Product[]> {
  try {
    // Use apiClient.request to automatically handle response format parsing
    const response = await apiClient.request("/products/trending");

    // If the response is already the array of products (handled by apiClient.request logic)
    if (Array.isArray(response)) {
      return response;
    }

    // If it returned the raw data for some reason
    if (response && response.products && Array.isArray(response.products)) {
      return response.products;
    }

    console.warn(
      "Unexpected response structure from trending products:",
      response,
    );
    return [];
  } catch (error) {
    console.error("Error in getTrendingProducts:", error);
    throw error;
  }
}

export async function updateProductTrendingStatus(
  productId: string,
  trending: boolean,
): Promise<Product> {
  // Only send the 'trending' boolean since 'trendingOrder' is no longer required
  return apiClient.request(`/products/${productId}/trending`, {
    method: "PATCH",
    body: JSON.stringify({ trending }),
  });
}

export async function setDefaultProductImage(
  productId: string,
  imageId: string,
): Promise<any> {
  const token = apiClient.getToken();

  console.log(
    `Setting default image: Product ${productId}, Image ${imageId}`,
  );

  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/images/${imageId}/default`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const result = await response.json();
  console.log("Set default image response:", result);

  if (!response.ok) {
    throw new Error(
      result.message || result.error || "Failed to set default image",
    );
  }

  return result;
}

export async function addProductImages(productId: string, images: File[]): Promise<any> {
  const formData = new FormData();

  // Backend expects 'images' as the field name for multiple file uploads
  images.forEach((image) => {
    formData.append("images", image); // Use 'images', not 'files'
  });

  console.log(`Uploading ${images.length} images for product ${productId}`);

  const token = apiClient.getToken();
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  const result = await response.json();
  console.log("Upload response:", result);

  if (!response.ok) {
    throw new Error(
      result.message || result.error || "Failed to upload images",
    );
  }

  return result.data;
}

export async function createProductWithImages(formData: FormData): Promise<Product> {
  const token = apiClient.getToken();

  // Make sure the form data uses 'images' field for files
  // The formData should already have 'images' field when created

  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || result.error || "Failed to create product",
    );
  }

  if (result && result.success === true) {
    return result.data;
  }
  return result;
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const token = apiClient.getToken();
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/images/${imageId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = await response.json();
  console.log("Delete image response:", result);

  if (!response.ok) {
    throw new Error(
      result.message || result.error || "Failed to delete image",
    );
  }

  return result;
}

export async function incrementProductStock(
  productId: string,
  stock: number,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/stock`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
      body: JSON.stringify({ operation: "increment", stock }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to increment stock");
  }

  // Handle response structure { success: true, data: ... }
  if (result && result.success === true) {
    return result.data;
  }
  return result;
}

export async function decrementProductStock(
  productId: string,
  stock: number,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/stock`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
      body: JSON.stringify({ operation: "decrement", stock }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to decrement stock");
  }

  if (result && result.success === true) {
    return result.data;
  }
  return result;
}

export async function updateProductStock(productId: string, stock: number): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/stock`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
      body: JSON.stringify({ stock }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to update stock");
  }

  if (result && result.success === true) {
    return result.data;
  }
  return result;
}

export async function getProductCountsByCategory(): Promise<Record<string, number>> {
  const result = await apiClient.request("/products/counts-by-category");
  return result;
}
