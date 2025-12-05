import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import webpush from 'npm:web-push@3.6.7';

// Chaves VAPID para Web Push
const VAPID_PUBLIC_KEY = "BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q";
const VAPID_PRIVATE_KEY = "3jK8_LCcooMHF3xjb8sSjT3u5qXkwkdmewCzTolOjDA";
const VAPID_EMAIL = 'mailto:alexandreferreirajp01@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  console.log('[Push Send] Requisição recebida');
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar admin
    const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                    user.role === 'admin' || 
                    user.subscription_type === 'admin';
    
    if (!isAdmin) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { 
      title, 
      message, 
      icon, 
      image, 
      url, 
      targetGroups, 
      targetEmails,
      badge,
      tag
    } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Título e mensagem obrigatórios' }, { status: 400 });
    }

    // Buscar TODAS as inscrições ativas
    let subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
      is_active: true
    });

    console.log(`Total de inscrições ativas: ${subscriptions.length}`);

    // Filtrar por grupos
    if (targetGroups && targetGroups.length > 0 && !targetGroups.includes('all')) {
      subscriptions = subscriptions.filter(sub => targetGroups.includes(sub.user_type));
    }

    // Filtrar por emails específicos
    if (targetEmails && targetEmails.length > 0) {
      subscriptions = subscriptions.filter(sub => 
        sub.user_email && targetEmails.includes(sub.user_email.toLowerCase())
      );
    }

    // Payload da notificação
    const payload = JSON.stringify({
      title: title,
      body: message,
      icon: icon || '/icon-192.png',
      badge: badge || '/icon-72.png',
      image: image || undefined,
      tag: tag || `notif-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [100, 50, 100, 50, 100],
      data: {
        url: url || '/',
        timestamp: Date.now(),
        id: `push-${Date.now()}`
      },
      actions: [
        { action: 'open', title: 'Ver Agora', icon: '/icon-72.png' },
        { action: 'dismiss', title: 'Depois' }
      ]
    });

    let sent = 0;
    let failed = 0;
    const expiredIds = [];
    const BATCH_SIZE = 100;

    // Enviar em lotes
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            return { success: false, id: sub.id, reason: 'invalid' };
          }

          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth
                }
              },
              payload,
              {
                TTL: 86400, // 24 horas
                urgency: 'high',
                topic: 'vagas-abertas'
              }
            );
            return { success: true, id: sub.id };
          } catch (error) {
            const statusCode = error.statusCode || 0;
            // 404, 410 = expirado/removido
            if (statusCode === 404 || statusCode === 410) {
              return { success: false, id: sub.id, reason: 'expired' };
            }
            console.error(`Erro ao enviar para ${sub.id}:`, error.message);
            return { success: false, id: sub.id, reason: 'error' };
          }
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            sent++;
          } else {
            failed++;
            if (result.value.reason === 'expired') {
              expiredIds.push(result.value.id);
            }
          }
        } else {
          failed++;
        }
      }
    }

    // Remover inscrições expiradas
    for (const id of expiredIds) {
      try {
        await base44.asServiceRole.entities.PushSubscription.delete(id);
      } catch (e) {
        // Ignorar
      }
    }

    return Response.json({
      success: true,
      sent,
      failed,
      removed: expiredIds.length,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Push send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});