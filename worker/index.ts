/// <reference lib="webworker" />

interface PrecacheEntry {
  url: string;
  revision?: string | null;
}

// Access sw self with correct typing safely
const sw = (typeof self !== 'undefined' ? self : {}) as unknown as ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
};

// Listen for push events
sw.addEventListener("push", (event) => {
  const pushEvent = event as PushEvent;
  const data = pushEvent.data?.json() ?? {};
  
  const title = data.title || "Apple ID Update";
  const options = {
    body: data.body || "There are new updates to the Apple ID you are following.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: data.data || { url: "/" },
  };

  pushEvent.waitUntil(sw.registration.showNotification(title, options));
});

// Listen for notification clicks
sw.addEventListener("notificationclick", (event) => {
  const notificationEvent = event as NotificationEvent;
  notificationEvent.notification.close();
  
  const urlToOpen = notificationEvent.notification.data?.url || "/";
  
  notificationEvent.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If window already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(urlToOpen);
        }
      })
  );
});

// We can just add custom listeners above safely without disrupting what next-pwa does
