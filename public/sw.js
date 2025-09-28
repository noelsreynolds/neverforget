self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Never Forget';
  const body = data.body || '';
  const tag = data.tag || undefined;
  const options = {
    body,
    data: data.data || {},
    tag,
    badge: '/icon-192.png',
    icon: '/icon-192.png',
    actions: [
      { action: 'snooze', title: 'Snooze 1 day' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const data = event.notification.data || {};
  if (action === 'snooze' && data.reminder_id) {
    event.waitUntil(fetch('/api/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminder_id: data.reminder_id })
    }));
  }
  event.notification.close();
});
