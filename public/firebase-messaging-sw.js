self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      notification: { title: "House Rent App", body: event.data.text() },
    };
  }

  const notification = payload.notification || {};
  const title = notification.title || "House Rent App";
  const body = notification.body || "You have a new notification.";
  const icon = notification.icon || "/icons/icon-192.svg";
  const badge = notification.badge || "/icons/icon-192.svg";
  const clickAction =
    notification.click_action || payload?.data?.click_action || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: {
        url: clickAction,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
