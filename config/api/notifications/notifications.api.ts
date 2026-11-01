import { apiClient } from "../client";

export type NotificationType = "system" | "order" | "approval";

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  photo?: File;
}

function createFormData(payload: NotificationPayload): FormData {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("message", payload.message);
  formData.append("type", payload.type);
  if (payload.photo) formData.append("photo", payload.photo);
  return formData;
}

export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  await apiClient.request(
    `/notifications/user/${encodeURIComponent(userId)}`,
    { method: "POST", body: createFormData(payload) },
  );
}

export async function sendNotificationToAll(
  payload: NotificationPayload,
): Promise<void> {
  await apiClient.request("/notifications/all", {
    method: "POST",
    body: createFormData(payload),
  });
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  photo: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationsPage {
  notifications: AdminNotification[];
  unreadCount: number;
  hasMore: boolean;
}

export async function getAdminNotifications(
  page: number = 1,
  limit: number = 20,
): Promise<AdminNotificationsPage> {
  const result = await apiClient.requestEnvelope<{
    data?: AdminNotification[];
    unreadCount?: number;
    pagination?: { hasMore?: boolean };
  }>(`/notifications/admin?page=${page}&limit=${limit}`);
  if (!Array.isArray(result?.data)) {
    throw new Error("Notifications response is missing the notification list.");
  }
  return {
    notifications: result.data,
    unreadCount: Number(result.unreadCount) || 0,
    hasMore: Boolean(result.pagination?.hasMore),
  };
}

export async function getAdminUnreadCount(): Promise<number> {
  const result = await apiClient.requestEnvelope<{
    data?: number | { unreadCount?: number; count?: number } | null;
    unreadCount?: number;
    count?: number;
  }>("/notifications/admin/unread-count");
  const data = result?.data;
  const value =
    typeof data === "number"
      ? data
      : (data?.unreadCount ?? data?.count ?? result?.unreadCount ?? result?.count);
  return Math.max(0, Number(value) || 0);
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  await apiClient.request(
    `/notifications/admin/${encodeURIComponent(id)}/read`,
    { method: "PATCH" },
  );
}
