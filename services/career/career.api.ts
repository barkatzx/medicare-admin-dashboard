import { apiClient } from "@/config/api/client";
import type {
  CareerApplication,
  CareerApplicationStatus,
  CareerJob,
  CareerJobInput,
  CareerJobStatus,
  CareerPage,
} from "./career.types";

const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_ROOT = (configuredBase ?? "").replace(/\/v1\/?$/, "").replace(/\/$/, "");
const CAREER_ROOT = `${API_ROOT}/api/career`;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
  pagination?: CareerPage<unknown>["pagination"];
}

const request = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> => {
  if (!API_ROOT) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be configured to use career management.");
  }
  const headers = new Headers(init.headers);
  const token = apiClient.getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${CAREER_ROOT}${path}`, { ...init, headers });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (response.status === 401) {
    apiClient.clearToken();
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
    throw new Error("Session expired. Please login again.");
  }
  if (!response.ok || !body?.success) {
    throw new Error(
      response.status >= 500
        ? "The career service could not complete the request. Please try again."
        : body?.error || `Career API request failed (${response.status})`,
    );
  }
  return body;
};

export const careerApi = {
  listJobs: async (query: URLSearchParams) => {
    const result = await request<CareerJob[]>(`/admin/jobs?${query}`);
    return { data: result.data, pagination: result.pagination! };
  },
  getJob: async (id: string) => (await request<CareerJob>(`/admin/jobs/${encodeURIComponent(id)}`)).data,
  createJob: async (input: CareerJobInput) =>
    (await request<CareerJob>("/admin/jobs", {
      method: "POST",
      body: JSON.stringify(input),
    })).data,
  updateJob: async (id: string, input: CareerJobInput & { status?: CareerJobStatus }) =>
    (await request<CareerJob>(`/admin/jobs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })).data,
  transitionJob: async (id: string, action: "publish" | "close" | "archive") =>
    (await request<CareerJob>(`/admin/jobs/${encodeURIComponent(id)}/${action}`, {
      method: "PATCH",
    })).data,
  listApplications: async (query: URLSearchParams) => {
    const result = await request<CareerApplication[]>(`/admin/applications?${query}`);
    return { data: result.data, pagination: result.pagination! };
  },
  getApplication: async (id: string) =>
    (await request<CareerApplication>(`/admin/applications/${encodeURIComponent(id)}`)).data,
  getResume: async (id: string) =>
    (await request<{ resumeUrl: string; resumeUrlExpiresIn: number }>(
      `/admin/applications/${encodeURIComponent(id)}/resume`,
    )).data,
  updateApplicationStatus: async (id: string, status: CareerApplicationStatus) =>
    (await request<CareerApplication>(`/admin/applications/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })).data,
  updateApplicationNotes: async (id: string, adminNotes: string) =>
    (await request<CareerApplication>(`/admin/applications/${encodeURIComponent(id)}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ adminNotes }),
    })).data,
};
