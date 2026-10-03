import { apiClient } from "../client";
import type { User } from "./user.types";

export async function getUsers(
  page: number = 1,
  limit: number = 20,
): Promise<{ users: User[]; pagination: any }> {
  const response = await apiClient.request(
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

export async function approveUser(userId: string): Promise<User> {
  return apiClient.request(`/users/approve/${userId}`, { method: "PUT" });
}

export async function promoteUserToTSR(userId: string): Promise<User> {
  const response = await apiClient.request(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role: "TSR" }),
  });
  return response?.data ?? response;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.request(`/users/${userId}`, {
    method: "DELETE",
  });
}

export async function getProfile(): Promise<any> {
  const response = await apiClient.request("/users/profile");
  return response?.data ?? response;
}

export async function getAddresses(): Promise<any[]> {
  const response = await apiClient.request("/users/addresses");
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : [];
}

export async function getNotifications(unreadOnly: boolean = false): Promise<any> {
  const url = unreadOnly
    ? "/users/notifications?unreadOnly=true"
    : "/users/notifications";
  const response = await apiClient.request(url);
  // response.data = { notifications, unreadCount, pagination }
  return response?.data ?? response;
}

export async function updateProfile(profileData: {
  name: string;
  pharmacy_name: string;
  phone_number: string;
}): Promise<any> {
  const response = await apiClient.request("/users/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
  return response?.data ?? response;
}

export async function changePassword(passwordData: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  return apiClient.request("/users/change-password", {
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
}): Promise<any> {
  const response = await apiClient.request("/users/addresses", {
    method: "POST",
    body: JSON.stringify(addressData),
  });
  return response?.data ?? response;
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
): Promise<any> {
  const response = await apiClient.request(`/users/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(addressData),
  });
  return response?.data ?? response;
}

export async function deleteAddress(addressId: string): Promise<void> {
  return apiClient.request(`/users/addresses/${addressId}`, {
    method: "DELETE",
  });
}

export async function setDefaultAddress(addressId: string): Promise<any> {
  const response = await apiClient.request(`/users/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify({ isDefault: true }),
  });
  return response?.data ?? response;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiClient.request(`/users/notifications/${notificationId}`, {
    method: "PUT",
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return apiClient.request("/users/notifications/read-all", {
    method: "PUT",
  });
}

export async function sendNotification(payload: {
  userId: string;
  title: string;
  message: string;
  type: string;
}): Promise<any> {
  const adminToken = localStorage.getItem("adminToken");
  const response = await apiClient.request("/users/notifications/send", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });
  return response?.data ?? response;
}

export async function sendBulkNotifications(payload: {
  userIds: string[];
  title: string;
  message: string;
  type: string;
}): Promise<any> {
  const adminToken = localStorage.getItem("adminToken");
  const response = await apiClient.request("/users/notifications/send-bulk", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });
  return response?.data ?? response;
}
