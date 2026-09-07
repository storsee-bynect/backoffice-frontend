/* Storsee Web Push service worker */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'STORSEE', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'STORSEE';
  const url = (data.data && data.data.url) || data.url || '/';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/img/transparent.png',
    badge: data.badge || data.icon || '/assets/img/transparent.png',
    image: data.image || undefined,
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url && 'focus' in client) {
          await client.focus();
          if ('navigate' in client && url) {
            try {
              await client.navigate(url);
            } catch {}
          }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })()
  );
});
