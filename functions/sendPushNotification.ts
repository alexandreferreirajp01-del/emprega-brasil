import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import webpush from 'npm:web-push@3.6.7';

// Gerar chaves VAPID se não existirem (rodar uma vez para gerar)
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log('Public Key:', vapidKeys.publicKey);
// console.log('Private Key:', vapidKeys.privateKey);

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
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

    const { title, message, icon, url } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Title and message required' }, { status: 400 });
    }

    // Buscar todas as inscrições push
    const subscriptions = await base44.asServiceRole.entities.PushSubscription.list();
    
    const payload = JSON.stringify({
      title,
      body: message,
      icon: icon || '/icon-192.png',
      badge: '/icon-72.png',
      url: url || '/',
      timestamp: Date.now()
    });

    let successCount = 0;
    let failCount = 0;
    const failedSubscriptions = [];

    // Enviar para todas as inscrições
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        successCount++;
      } catch (error) {
        failCount++;
        // Se a inscrição expirou ou foi cancelada, marcar para remoção
        if (error.statusCode === 404 || error.statusCode === 410) {
          failedSubscriptions.push(sub.id);
        }
        console.error(`Failed to send to ${sub.endpoint}:`, error.message);
      }
    }

    // Remover inscrições inválidas
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