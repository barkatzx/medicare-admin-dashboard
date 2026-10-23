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

interface UserListResponse {
  data?: {
    users?: User[];
    pagination?: UserPagination;
  };
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
): Promise<{ users: User[]; pagination: UserPagination }> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) query.set("search", search);

  const response = await apiClient.request<UserListResponse | User[]>(
    `/users/all?${query.toString()}`,
  );

  if (
    !Array.isArray(response) &&
    response.data &&
    Array.isArray(response.data.users) &&
    response.data.pagination
  ) {
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

export async function getProfile(): Promise<UserProfile> {
  const response = await apiClient.request<
    UserProfile | { data?: UserProfile }
  >(
    "/users/profile",
  );
  return unwrapData(response);
}

export async function getAddresses(): Promise<UserAddress[]> {
  const response =
    await apiClient.request<
      UserAddress[] | { data?: UserAddress[] }
    >("/users/addresses");
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
