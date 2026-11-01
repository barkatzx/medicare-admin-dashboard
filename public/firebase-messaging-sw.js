/* global firebase, clients */
// Registered with the public Firebase web config as query parameters.

const ROUTES = {
  order: "/dashboard/orders/pending-orders",
  approval: "/dashboard/users/pending-users",
};

// Registered before the Firebase SDK so our click handling runs first.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const fcmData = (data.FCM_MSG && data.FCM_MSG.data) || data;
  const target = ROUTES[fcmData.type] || "/dashboard";
  const url = new URL(target, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windows) => {
        const existing = windows.find((client) =>
          client.url.startsWith(self.location.origin),
        );
        if (existing) {
          await existing.focus();
          if ("navigate" in existing) {
            try {
              await existing.navigate(url);
              return;
            } catch {
              // Fall through to messaging the page.
            }
          }
          existing.postMessage({ type: "NOTIFICATION_CLICK", url: target });
          return;
        }
        await clients.openWindow(url);
      }),
  );
});

importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js",
);

const params = new URL(self.location.href).searchParams;
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Messages with a `notification` block are displayed by the SDK itself.
  // Data-only messages are shown here so they are never silently dropped.
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;
    const data = payload.data || {};
    self.registration.showNotification(data.title || "MediCarePLC", {
      body: data.message || data.body || "",
      icon: "/admin-logo.png",
      badge: "/admin-badge.png",
      data,
    });
  });
}
