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
    icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg',
    badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg',
    tag: 'notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
      console.log('[SW] Dados parseados:', data);
    } catch (e) {
      console.log('[SW] Erro ao parsear, usando texto:', e);
      data.body = event.data.text();
    }
  }

  console.log('[SW] Mostrando notificação:', data.title);

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      image: data.image,
      tag: data.tag || 'vagas-notification',
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      data: data.data || { url: '/' },
      actions: data.actions || []
    }).then(() => {
      console.log('[SW] Notificação exibida com sucesso');
    }).catch(err => {
      console.error('[SW] Erro ao exibir notificação:', err);
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
      console.log('Service Worker não suportado');
      return;
    }

    const registerSW = async () => {
      try {
        // Desregistrar todos os service workers antigos
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('SW antigo desregistrado');
        }

        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 500));

        // Criar blob com o código do SW
        const blob = new Blob([SW_CODE], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);

        // Registrar novo SW
        const registration = await navigator.serviceWorker.register(swUrl, { 
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('Service Worker registrado com sucesso:', registration);

        // Forçar ativação imediata
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Nova versão do SW encontrada');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('SW atualizado');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Limpar URL do blob após registro
        URL.revokeObjectURL(swUrl);

      } catch (error) {
        console.error('Erro ao registrar SW:', error);
      }
    };

    registerSW();

    // Recarregar quando houver nova versão
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('SW atualizado, recarregando...');
        window.location.reload();
      }
    });

  }, []);

  return null;
}