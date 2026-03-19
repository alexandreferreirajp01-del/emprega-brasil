import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscription, action, visitorId } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Tentar obter usuário (pode ser null para visitantes)
    let user = null;
    let userType = 'visitor';
    let userEmail = null;

    try {
      user = await base44.auth.me();
      if (user) {
        userEmail = user.email;
        if (user.role === 'admin' || user.subscription_type === 'admin') {
          userType = 'admin';
        } else if (user.subscription_type === 'recruiter') {
          userType = 'recruiter';
        } else if (user.subscription_type === 'premium') {
          userType = 'premium';
        } else {
          userType = 'basic';
        }
      }
    } catch (e) {
      // Visitante - continua sem usuário
    }

    if (action === 'subscribe') {
      // Verificar se já existe essa inscrição
      const existingList = await base44.asServiceRole.entities.PushSubscription.filter({
        endpoint: subscription.endpoint
      });

      const existingSub = existingList.length > 0 ? existingList[0] : null;

      if (existingSub) {
        // Atualizar inscrição existente
        await base44.asServiceRole.entities.PushSubscription.update(existingSub.id, {
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          user_email: userEmail,
          user_type: userType,
          visitor_id: visitorId || existingSub.visitor_id,
          device_info: req.headers.get('user-agent') || '',
          is_active: true
        });
      } else {
        // Criar nova inscrição
        await base44.asServiceRole.entities.PushSubscription.create({
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          user_email: userEmail,
          user_type: userType,
          visitor_id: visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          device_info: req.headers.get('user-agent') || '',
          is_active: true
        });
      }

      return Response.json({ success: true, message: 'Subscribed' });

    } else if (action === 'unsubscribe') {
      // Desativar inscrição
      const existingList = await base44.asServiceRole.entities.PushSubscription.filter({
        endpoint: subscription.endpoint
      });

      if (existingList.length > 0) {
        await base44.asServiceRole.entities.PushSubscription.update(existingList[0].id, {
          is_active: false
        });
      }

      return Response.json({ success: true, message: 'Unsubscribed' });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Subscribe push error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});