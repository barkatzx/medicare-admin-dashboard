import type { User } from "./user/user.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export { API_BASE_URL };

class APIClient {
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

  async request(
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
}

export const apiClient = new APIClient();
