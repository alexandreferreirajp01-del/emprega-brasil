import { useEffect } from 'react';

// Service Worker completo como string
const SW_CODE = `
// Service Worker - Vagas Abertas PB v2.0
console.log('[SW] Carregando Service Worker');

const CACHE_NAME = 'vagas-abertas-v2';

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        );
      })
    ])
  );
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  let data = {
    title: 'Nova Notificação',
    body: 'Você tem uma atualização',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-72.png',
      image: data.image,
      tag: data.tag || 'notification',
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      data: data.data || { url: '/' },
      actions: data.actions || []
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada');
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      for (const client of windows) {
        if ('focus' in client) {
          client.focus();
          if (client.navigate) client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] Service Worker pronto');
`;

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const blob = new Blob([SW_CODE], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        await navigator.serviceWorker.register(swUrl, { scope: '/' });
        URL.revokeObjectURL(swUrl);
      } catch (error) {
        console.warn('SW error:', error);
      }
    };

    registerSW().catch(() => {});
  }, []);

  return null;
}