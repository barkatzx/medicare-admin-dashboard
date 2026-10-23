import type { User } from "./user/user.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export { API_BASE_URL };

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getResourceName(endpoint: string): string {
  return endpoint.split("?")[0].split("/").filter(Boolean)[0] || "unknown";
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const payload = body as Record<string, unknown>;
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
}

function waitBeforeRetry(delay: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The request was aborted.", "AbortError"));
      return;
    }

    const abort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("The request was aborted.", "AbortError"));
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, delay);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

class APIClient {
  private token: string | null = null;

  private user: User | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      this.restoreUser();
    }
  }

  private restoreUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    try {
      this.user = JSON.parse(userStr) as User;
    } catch {
      this.user = null;
      console.error("Unable to restore cached API user data.");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("token", token);
    }
  }

  getToken() {
    if (!this.token && typeof window !== "undefined") {
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
      this.restoreUser();
    }
    return this.user;
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3,
    backoff = 300,
  ): Promise<T> {
    const token = this.getToken();
    const method = (options.method || "GET").toUpperCase();
    const canRetry =
      method === "GET" || method === "HEAD" || method === "OPTIONS";
    const maxRetries = canRetry ? Math.max(0, Math.floor(retries)) : 0;
    const headers = new Headers(options.headers);

    if (
      options.body &&
      !(typeof FormData !== "undefined" && options.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const resource = getResourceName(endpoint);
    let attempt = 0;

    while (true) {
      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } catch (error) {
        const aborted =
          options.signal?.aborted ||
          (error instanceof Error && error.name === "AbortError");
        if (!canRetry || attempt >= maxRetries || aborted) {
          console.error("API network request failed.", { method, resource });
          throw error;
        }

        console.warn("Retrying a safe API request after a network failure.", {
          method,
          resource,
          attempt: attempt + 1,
        });
        await waitBeforeRetry(backoff * 2 ** attempt, options.signal || undefined);
        attempt += 1;
        continue;
      }

      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== "undefined") {
          window.location.assign("/login");
        }
        throw new ApiError("Session expired. Please login again.", 401);
      }

      if (!response.ok) {
        if (canRetry && response.status >= 500 && attempt < maxRetries) {
          console.warn("Retrying a safe API request after a server failure.", {
            method,
            resource,
            status: response.status,
            attempt: attempt + 1,
          });
          await waitBeforeRetry(backoff * 2 ** attempt, options.signal || undefined);
          attempt += 1;
          continue;
        }

        const responseText = await response.text();
        let body: unknown;
        try {
          body = responseText ? JSON.parse(responseText) : null;
        } catch {
          body = null;
        }

        console.error("API request failed.", {
          method,
          resource,
          status: response.status,
        });
        const fallback =
          response.status >= 500
            ? "The service could not complete the request. Please try again."
            : `API request failed with status ${response.status}`;
        throw new ApiError(
          response.status >= 500
            ? fallback
            : getErrorMessage(body, fallback),
          response.status,
        );
      }

      if (response.status === 204) return null as T;

      const responseText = await response.text();
      if (!responseText.trim()) return null as T;

      let result: unknown;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("API returned an invalid response body.", {
          method,
          resource,
          status: response.status,
        });
        throw new ApiError("API returned an invalid response.", response.status);
      }

      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        result.success === true
      ) {
        return ("data" in result ? result.data : null) as T;
      }

      return result as T;
    }
  }
}

export const apiClient = new APIClient();
