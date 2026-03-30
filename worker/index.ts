// @ts-nocheck
import { defaultCache } from "@ducanh2912/next-pwa/worker";
import type { PrecacheEntry } from "@serwist/precaching";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: PrecacheEntry[] | undefined;
};

// Listen for push events
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  
  const title = data.title || "Apple ID Update";
  const options = {
    body: data.body || "There are new updates to the Apple ID you are following.",
    icon: "/icons/icon-192x192.png", // Assuming these exist from standard PWA gen
    badge: "/icons/icon-72x72.png",
    data: data.data || { url: "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If window already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// We can just add custom listeners above safely without disrupting what next-pwa does
