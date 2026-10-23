import { apiClient } from "../client";
import type { User, UserAddress, UserProfile } from "./user.types";

interface UserPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.phone_number === "string" &&
    (typeof value.name === "string" || value.name === null) &&
    (typeof value.pharmacy_name === "string" || value.pharmacy_name === null) &&
    (value.role === "admin" ||
      value.role === "customer" ||
      value.role === "TSR") &&
    typeof value.isApproved === "boolean"
  );
}

function isPagination(value: unknown): value is UserPagination {
  return (
    isRecord(value) &&
    typeof value.page === "number" &&
    typeof value.limit === "number" &&
    typeof value.total === "number" &&
    typeof value.pages === "number" &&
    typeof value.hasNextPage === "boolean" &&
    typeof value.hasPrevPage === "boolean"
  );
}

function unwrapData<T>(response: T | { data?: T }): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data as T;
  }
  return response as T;
}

export async function getUsers(
  page: number = 1,
  limit: number = 20,
  search?: string,
  signal?: AbortSignal,
): Promise<{ users: User[]; pagination: UserPagination }> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) query.set("search", search);

  const response = await apiClient.request<unknown>(
    `/users/all?${query.toString()}`,
    { signal },
  );
  const payload =
    isRecord(response) && "data" in response ? response.data : response;

  if (Array.isArray(payload)) {
    if (!payload.every(isUser)) {
      throw new Error("Users response contains invalid user records.");
    }
    const pages = Math.max(1, Math.ceil(payload.length / limit));
    return {
      users: payload,
      pagination: {
        page,
        limit,
        total: payload.length,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1,
      },
    };
  }

  if (!isRecord(payload) || !Array.isArray(payload.users)) {
    throw new Error("Users response is missing the user list.");
  }
  if (!payload.users.every(isUser)) {
    throw new Error("Users response contains invalid user records.");
  }
  if (!isPagination(payload.pagination)) {
    throw new Error("Users response is missing valid pagination metadata.");
  }

  return {
    users: payload.users,
    pagination: payload.pagination,
  };
}

export async function approveUser(userId: string): Promise<User> {
  return apiClient.request<User>(`/users/approve/${userId}`, { method: "PUT" });
}

export async function promoteUserToTSR(userId: string): Promise<User> {
  const response = await apiClient.request<User | { data?: User }>(
    `/users/${userId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role: "TSR" }),
    },
  );
  if ("id" in response) return response;
  if (response.data) return response.data;
  throw new Error("The user promotion response is missing user data.");
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.request(`/users/${userId}`, {
    method: "DELETE",
  });
}

export async function getProfile(signal?: AbortSignal): Promise<UserProfile> {
  const response = await apiClient.request<
    UserProfile | { data?: UserProfile }
  >(
    "/users/profile",
    { signal },
  );
  return unwrapData(response);
}

export async function getAddresses(signal?: AbortSignal): Promise<UserAddress[]> {
  const response =
    await apiClient.request<
      UserAddress[] | { data?: UserAddress[] }
    >("/users/addresses", { signal });
  if (Array.isArray(response)) return response;
  const data = unwrapData(response);
  return Array.isArray(data) ? data : [];
}

export async function updateProfile(profileData: {
  name: string;
  pharmacy_name: string;
  phone_number: string;
}): Promise<UserProfile> {
  const response = await apiClient.request<
    UserProfile | { data?: UserProfile }
  >("/users/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
  return unwrapData(response);
}

export async function changePassword(passwordData: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  return apiClient.request<void>("/users/change-password", {
    method: "POST",
    body: JSON.stringify(passwordData),
  });
}

export async function createAddress(addressData: {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}): Promise<UserAddress> {
  const response = await apiClient.request<
    UserAddress | { data?: UserAddress }
  >("/users/addresses", {
    method: "POST",
    body: JSON.stringify(addressData),
  });
  return unwrapData(response);
}

export async function updateAddress(
  addressId: string,
  addressData: Partial<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>,
): Promise<UserAddress> {
  const response = await apiClient.request<
    UserAddress | { data?: UserAddress }
  >(`/users/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(addressData),
  });
  return unwrapData(response);
}

export async function deleteAddress(addressId: string): Promise<void> {
  return apiClient.request<void>(`/users/addresses/${addressId}`, {
    method: "DELETE",
  });
}

export async function setDefaultAddress(
  addressId: string,
): Promise<UserAddress> {
  const response = await apiClient.request<
    UserAddress | { data?: UserAddress }
  >(`/users/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify({ isDefault: true }),
  });
  return unwrapData(response);
}
