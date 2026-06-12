// services/api.ts - Full updated file

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface User {
  id: string;
  email: string;
  phone_number: string;
  name: string | null;
  pharmacy_name: string | null;
  role: "admin" | "customer";
  isApproved: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string | null;
  description: string;
  price: number;
  discountedPrice: number | null;
  discountPercent: number;
  stock: number;
  categoryId: string;
  featured?: boolean;
  trending?: boolean;
  createdAt: string;
  updatedAt?: string;
  images?: ProductImage[];
  category?: Category;
  finalPrice?: number;
  savings?: number;
  primaryImageId?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  productId: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

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

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product: Product;
}

export interface Payment {
  id: string;
  status: string;
  method: string;
  paidAt: string | null;
}

// Add these interfaces to your services/api.ts

export interface DailySalesData {
  date: string;
  sales: number;
  orders: number;
}

export interface WeeklySalesData {
  week: string;
  sales: number;
  orders: number;
}

export interface MonthlySalesData {
  month: string;
  sales: number;
  orders: number;
}

export interface SalesSummaryData {
  overall_summary: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
    totalDiscounts: number;
    totalCustomers: number;
    topProducts: Array<{
      id: string;
      name: string;
      price: string;
      images: Array<{ url: string }>;
      totalSold: number;
    }>;
    topCategories: Array<{
      id: string;
      name: string;
      totalSold: number;
    }>;
  };
  growth_percentage: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  sales_by_status: Array<{
    status: string;
    totalSales: number;
    totalOrders: number;
  }>;
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalProducts: number;
}

export interface YearlyResponse {
  monthly_breakdown: Array<{
    period: "monthly";
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
  }>;
  yearly_totals: {
    totalSales: number;
    totalOrders: number;
    totalItemsSold: number;
  };
  average_monthly_sales: number;
  best_month?: {
    period: "monthly";
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
  };
}

export interface TopProduct extends Product {
  totalSold: number;
  totalRevenue: number;
}

// Add after SalesSummary interface
export interface DashboardData {
  today: {
    sales: number;
    orders: number;
    items: number;
  };
  this_week: {
    sales: number;
    orders: number;
    items: number;
  };
  this_month: {
    sales: number;
    orders: number;
    items: number;
  };
  this_year: {
    sales: number;
    orders: number;
    items: number;
  };
  lifetime: {
    sales: number;
    orders: number;
    customers: number;
    products_sold: number;
  };
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  recent_orders: Order[];
}

class API {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("token", token); // Keep both for compatibility
    }
  }

  getToken() {
    if (!this.token && typeof window !== "undefined") {
      // Try both keys
      this.token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    this.user = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  setUser(user: User) {
    this.user = user;
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  getUser() {
    if (!this.user && typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    }
    return this.user;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    retries = 3,
    backoff = 300,
  ): Promise<any> {
    const token = this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        if (response.status >= 500 && retries > 0) {
          console.warn(
            `API ${response.status} for ${endpoint}. Retrying in ${backoff}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
          return this.request(endpoint, options, retries - 1, backoff * 2);
        }

        const text = await response.text();
        console.error(
          `API Error details: ${response.status} ${response.statusText}`,
          text,
        );
        let error;
        try {
          error = JSON.parse(text);
        } catch (e) {
          error = {
            message: `API request failed with status ${response.status}`,
          };
        }
        throw new Error(
          error.message ||
            error.error ||
            `API request failed with status ${response.status}`,
        );
      }

      // ✅ KEY FIX: Handle 204 No Content (DELETE returns empty body)
      if (response.status === 204) return null;

      // ✅ KEY FIX: Safely read text first, only parse if non-empty
      const text = await response.text();
      if (!text || text.trim() === "") return null;

      const result = JSON.parse(text);

      if (result && result.success === true) {
        return result.data;
      }

      return result;
    } catch (error) {
      if (retries > 0 && error instanceof TypeError) {
        console.warn(
          `Network error for ${endpoint}. Retrying in ${backoff}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.request(endpoint, options, retries - 1, backoff * 2);
      }
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // ==================== AUTH ====================
  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Login failed");
    }

    if (!result.data) {
      throw new Error("Invalid response from server");
    }

    const { token, user } = result.data;

    if (user.role !== "admin") {
      throw new Error("Access denied. Admin only.");
    }

    if (!user.isApproved) {
      throw new Error(
        "Account pending approval. Please wait for admin approval.",
      );
    }

    this.setToken(token);
    this.setUser(user);

    return { token, user };
  }

  // ==================== USER MANAGEMENT ====================
  async getUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ users: User[]; pagination: any }> {
    const response = await this.request(
      `/users/all?page=${page}&limit=${limit}`,
    );

    if (response && response.data && Array.isArray(response.data.users)) {
      return {
        users: response.data.users,
        pagination: response.data.pagination,
      };
    }
    // fallback
    return {
      users: Array.isArray(response) ? response : [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  async approveUser(userId: string): Promise<User> {
    return this.request(`/users/approve/${userId}`, { method: "PUT" });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  // ==================== USER ADDRESS NOTIFICATION MANAGEMENT ====================

  async getProfile(): Promise<any> {
    const response = await this.request("/users/profile");
    return response?.data ?? response;
  }

  async getAddresses(): Promise<any[]> {
    const response = await this.request("/users/addresses");
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  }

  async getNotifications(unreadOnly: boolean = false): Promise<any> {
    const url = unreadOnly
      ? "/users/notifications?unreadOnly=true"
      : "/users/notifications";
    const response = await this.request(url);
    // response.data = { notifications, unreadCount, pagination }
    return response?.data ?? response;
  }

  async updateProfile(profileData: {
    name: string;
    pharmacy_name: string;
    phone_number: string;
  }): Promise<any> {
    const response = await this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    return response?.data ?? response;
  }

  async changePassword(passwordData: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    return this.request("/users/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  }

  async createAddress(addressData: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }): Promise<any> {
    const response = await this.request("/users/addresses", {
      method: "POST",
      body: JSON.stringify(addressData),
    });
    return response?.data ?? response;
  }

  async updateAddress(
    addressId: string,
    addressData: Partial<{
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault: boolean;
    }>,
  ): Promise<any> {
    const response = await this.request(`/users/addresses/${addressId}`, {
      method: "PUT",
      body: JSON.stringify(addressData),
    });
    return response?.data ?? response;
  }

  async deleteAddress(addressId: string): Promise<void> {
    return this.request(`/users/addresses/${addressId}`, {
      method: "DELETE",
    });
  }

  async setDefaultAddress(addressId: string): Promise<any> {
    const response = await this.request(`/users/addresses/${addressId}`, {
      method: "PUT",
      body: JSON.stringify({ isDefault: true }),
    });
    return response?.data ?? response;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.request(`/users/notifications/${notificationId}`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request("/users/notifications/read-all", {
      method: "PUT",
    });
  }

  async sendNotification(payload: {
    userId: string;
    title: string;
    message: string;
    type: string;
  }): Promise<any> {
    const adminToken = localStorage.getItem("adminToken");
    const response = await this.request("/users/notifications/send", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
    });
    return response?.data ?? response;
  }

  async sendBulkNotifications(payload: {
    userIds: string[];
    title: string;
    message: string;
    type: string;
  }): Promise<any> {
    const adminToken = localStorage.getItem("adminToken");
    const response = await this.request("/users/notifications/send-bulk", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
    });
    return response?.data ?? response;
  }
  // ==================== PRODUCT MANAGEMENT ====================
  async getAllProducts(
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

    const result = await this.request(url);

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

  async getProductById(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    return this.request("/products/", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(
    productId: string,
    productData: Partial<Product>,
  ): Promise<Product> {
    return this.request(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.request(`/products/${productId}/`, {
      method: "DELETE",
    });
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const result = await this.request(
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

  // ==================== FEATURED PRODUCTS MANAGEMENT ====================

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await this.request("/products/featured");

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

  async updateProductFeaturedStatus(
    productId: string,
    featured: boolean,
  ): Promise<Product> {
    return this.request(`/products/${productId}/featured`, {
      method: "PATCH",
      body: JSON.stringify({ featured }),
    });
  }

  // ==================== TRENDING PRODUCTS MANAGEMENT ====================

  async getTrendingProducts(): Promise<Product[]> {
    try {
      // Use this.request to automatically handle response format parsing
      const response = await this.request("/products/trending");

      // If the response is already the array of products (handled by this.request logic)
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

  async updateProductTrendingStatus(
    productId: string,
    trending: boolean,
  ): Promise<Product> {
    // Only send the 'trending' boolean since 'trendingOrder' is no longer required
    return this.request(`/products/${productId}/trending`, {
      method: "PATCH",
      body: JSON.stringify({ trending }),
    });
  }

  // ==================== PRODUCT IMAGE MANAGEMENT ====================

  async setDefaultProductImage(
    productId: string,
    imageId: string,
  ): Promise<any> {
    const token = this.getToken();

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

  async addProductImages(productId: string, images: File[]): Promise<any> {
    const formData = new FormData();

    // Backend expects 'images' as the field name for multiple file uploads
    images.forEach((image) => {
      formData.append("images", image); // Use 'images', not 'files'
    });

    console.log(`Uploading ${images.length} images for product ${productId}`);

    const token = this.getToken();
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

  async createProductWithImages(formData: FormData): Promise<Product> {
    const token = this.getToken();

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

  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    const token = this.getToken();
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

  // Increment stock (PATCH: /api/products/{productId}/stock)
  async incrementProductStock(
    productId: string,
    stock: number,
  ): Promise<Product> {
    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/stock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
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

  // Decrement stock (PATCH: /api/products/{productId}/stock)
  async decrementProductStock(
    productId: string,
    stock: number,
  ): Promise<Product> {
    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/stock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
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

  // Set exact stock value (PATCH: /api/products/{productId}/stock)
  async updateProductStock(productId: string, stock: number): Promise<Product> {
    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/stock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
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

  // ==================== CATEGORY MANAGEMENT ====================
  async getAllCategories(): Promise<Category[]> {
    const result = await this.request("/categories/");
    if (result && result.categories && Array.isArray(result.categories)) {
      return result.categories;
    }
    if (Array.isArray(result)) {
      return result;
    }
    return [];
  }

  // Add this method to your API class in services/api.ts

  async getProductCountsByCategory(): Promise<Record<string, number>> {
    const result = await this.request("/products/counts-by-category");
    return result;
  }

  async createCategory(name: string, description?: string): Promise<Category> {
    return this.request("/categories/", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  async updateCategory(
    id: string,
    name: string,
    description?: string,
  ): Promise<Category> {
    return this.request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    return this.request(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== ORDER MANAGEMENT ====================
  async getAllOrders(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{ orders: Order[]; pagination: any }> {
    let url = `/orders?page=${page}&limit=${limit}`;
    if (status && status !== "all") {
      url += `&status=${status}`;
    }
    const data = await this.request(url);
    return {
      orders: data?.orders || [],
      pagination: data?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      },
    };
  }

  async getOrderById(orderId: string): Promise<Order> {
    return this.request(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    return this.request(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async confirmPayment(
    orderId: string,
  ): Promise<{ orderId: string; payment: Payment }> {
    const response = await this.request(`/orders/${orderId}/payment/confirm`, {
      method: "PUT",
    });
    // Return an object that includes the orderId
    return { orderId, payment: response };
  }

  // ==================== SALES & REPORTS ====================

  // Update the getTopProducts method return type
  async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
    const data = await this.request(`/sales/top-products?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  }

  async getTodayOrderedProducts(): Promise<any> {
    return this.request("/sales/today-ordered-products");
  }

  async getDashboardData(): Promise<DashboardData> {
    try {
      const data = await this.request("/sales/dashboard");
      return data as DashboardData;
    } catch (error) {
      console.error("Dashboard API error, returning fallback data:", error);
      // Return fallback data instead of throwing
      return {
        today: { sales: 0, orders: 0, items: 0 },
        this_week: { sales: 0, orders: 0, items: 0 },
        this_month: { sales: 0, orders: 0, items: 0 },
        this_year: { sales: 0, orders: 0, items: 0 },
        lifetime: { sales: 0, orders: 0, customers: 0, products_sold: 0 },
        growth: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        recent_orders: [],
      };
    }
  }

  async getDailySales(): Promise<any> {
    return this.request("/sales/daily");
  }

  async getWeeklySales(): Promise<any> {
    return this.request("/sales/weekly");
  }

  async getMonthlySales(): Promise<any> {
    return this.request("/sales/monthly");
  }

  async getSalesSummary(): Promise<SalesSummaryData> {
    return this.request("/sales/summary");
  }

  async getCustomRangeSales(
    startDate: string,
    endDate: string,
  ): Promise<{
    salesData: {
      totalSales: number;
      totalOrders: number;
      averageOrderValue: number;
      totalItemsSold: number;
      totalDiscounts: number;
    };
    dailyBreakdown: any[];
  }> {
    const data = await this.request(
      `/sales/custom-range?startDate=${startDate}&endDate=${endDate}`,
    );
    return data;
  }

  async getYearlySales(): Promise<YearlyResponse> {
    const data = await this.request("/sales/yearly");
    return data;
  }

  async exportSalesData(format: "csv" | "pdf" = "csv") {
    const token = this.getToken();
    const response = await fetch(
      `${API_BASE_URL}/sales/export?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (format === "csv") {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-data-${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    return response;
  }
}

export const api = new API();
