import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = "BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q";
const VAPID_PRIVATE_KEY = "3jK8_LCcooMHF3xjb8sSjT3u5qXkwkdmewCzTolOjDA";
const VAPID_EMAIL = 'mailto:alexandreferreirajp01@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                    user.role === 'admin' || 
                    user.subscription_type === 'admin';
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, message, icon, image, url, targetGroups, targetEmails } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Title and message required' }, { status: 400 });
    }

    // Buscar todas as inscrições push ativas
    let subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
      is_active: true
    });

    // Filtrar por grupos se especificado
    if (targetGroups && targetGroups.length > 0 && !targetGroups.includes('all')) {
      subscriptions = subscriptions.filter(sub => {
        return targetGroups.includes(sub.user_type);
      });
    }

    // Filtrar por emails específicos se fornecido
    if (targetEmails && targetEmails.length > 0) {
      subscriptions = subscriptions.filter(sub => {
        return targetEmails.includes(sub.user_email);
      });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: icon || '/icon-192.png',
      badge: '/icon-72.png',
      image: image || null,
      data: {
        url: url || '/',
        timestamp: Date.now()
      },
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' }
      ],
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });

    let successCount = 0;
    let failCount = 0;
    const failedSubscriptions = [];

    // Enviar para todas as inscrições em paralelo (batches de 50)
    const BATCH_SIZE = 50;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          try {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            };

            await webpush.sendNotification(pushSubscription, payload);
            return { success: true, id: sub.id };
          } catch (error) {
            // Se a inscrição expirou ou foi cancelada
            if (error.statusCode === 404 || error.statusCode === 410) {
              return { success: false, id: sub.id, expired: true };
            }
            return { success: false, id: sub.id, expired: false };
          }
        })
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else {
            failCount++;
            if (result.value.expired) {
              failedSubscriptions.push(result.value.id);
            }
          }
        } else {
          failCount++;
        }
      });
    }

    // Remover inscrições inválidas/expiradas
    for (const subId of failedSubscriptions) {
      try {
        await base44.asServiceRole.entities.PushSubscription.delete(subId);
      } catch (e) {
        console.error('Failed to delete subscription:', e);
      }
    }

    return Response.json({ 
      success: true, 
      sent: successCount, 
      failed: failCount,
      removed: failedSubscriptions.length,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});