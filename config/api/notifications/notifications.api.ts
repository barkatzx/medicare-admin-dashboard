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
