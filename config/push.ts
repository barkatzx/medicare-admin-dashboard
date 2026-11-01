import { api } from "@/config/api";
import {
  FIREBASE_VAPID_KEY,
  getFirebaseConfig,
  isFirebaseConfigured,
} from "@/config/firebase";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

const TOKEN_KEY = "fcmWebToken";
const SW_URL = "/firebase-messaging-sw.js";

export type PushStatus =
  | "unsupported"
  | "unconfigured"
  | "denied"
  | "default"
  | "granted";

export async function getPushStatus(): Promise<PushStatus> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !(await isSupported().catch(() => false))
  ) {
    return "unsupported";
  }
  if (!isFirebaseConfigured()) return "unconfigured";
  return Notification.permission;
}

function getMessagingInstance() {
  const app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  return getMessaging(app);
}

async function registerServiceWorker() {
  const params = new URLSearchParams();
  Object.entries(getFirebaseConfig()).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const registration = await navigator.serviceWorker.register(
    `${SW_URL}?${params.toString()}`,
  );
  await navigator.serviceWorker.ready;
  return registration;
}

/** Obtains an FCM token (permission must already be granted) and syncs it with the server. */
export async function syncPushToken(): Promise<string> {
  const registration = await registerServiceWorker();
  const token = await getToken(getMessagingInstance(), {
    vapidKey: FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("No FCM token was returned.");

  const previous = localStorage.getItem(TOKEN_KEY);
  await api.registerDeviceToken(token);
  localStorage.setItem(TOKEN_KEY, token);
  if (previous && previous !== token) {
    await api.unregisterDeviceToken(previous).catch(() => {});
  }
  return token;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission();
}

export function listenForForegroundMessages(
  handler: (payload: MessagePayload) => void,
): () => void {
  return onMessage(getMessagingInstance(), handler);
}

/** Removes this device's token from the server and FCM; never throws. */
export async function removePushToken(): Promise<void> {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  localStorage.removeItem(TOKEN_KEY);
  try {
    await api.unregisterDeviceToken(token);
  } catch {
    // The server prunes invalid tokens on delivery.
  }
  try {
    if (await isSupported()) await deleteToken(getMessagingInstance());
  } catch {
    // Best effort.
  }
}
