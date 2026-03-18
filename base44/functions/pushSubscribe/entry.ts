import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Sistema de inscrição push - versão 2.1
Deno.serve(async (req) => {
  console.log('[Push Subscribe] Requisição recebida');
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { subscription, action, deviceId, deviceInfo, visitorId } = body;

    if (!subscription?.endpoint) {
      return Response.json({ error: 'Endpoint obrigatório' }, { status: 400 });
    }

    // Identificar usuário
    let userEmail = null;
    let userType = 'visitor';
    
    try {
      const user = await base44.auth.me();
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
      // Visitante
    }

    const uniqueDeviceId = deviceId || visitorId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (action === 'subscribe') {
      // Buscar inscrição existente pelo endpoint
      const existing = await base44.asServiceRole.entities.PushSubscription.filter({
        endpoint: subscription.endpoint
      });

      const subscriptionData = {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
        user_email: userEmail,
        user_type: userType,
        visitor_id: uniqueDeviceId,
        device_info: deviceInfo || req.headers.get('user-agent') || 'Unknown',
        is_active: true
      };

      if (existing.length > 0) {
        await base44.asServiceRole.entities.PushSubscription.update(existing[0].id, subscriptionData);
      } else {
        await base44.asServiceRole.entities.PushSubscription.create(subscriptionData);
      }

      console.log('[Push Subscribe] Sucesso:', uniqueDeviceId);
      return Response.json({ 
        success: true, 
        message: 'Inscrito com sucesso',
        deviceId: uniqueDeviceId
      });

    } else if (action === 'unsubscribe') {
      const existing = await base44.asServiceRole.entities.PushSubscription.filter({
        endpoint: subscription.endpoint
      });

      if (existing.length > 0) {
        await base44.asServiceRole.entities.PushSubscription.update(existing[0].id, { is_active: false });
      }

      return Response.json({ success: true, message: 'Desinscrito' });

    } else if (action === 'check') {
      const existing = await base44.asServiceRole.entities.PushSubscription.filter({
        endpoint: subscription.endpoint,
        is_active: true
      });

      return Response.json({ 
        success: true, 
        isSubscribed: existing.length > 0 
      });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Push subscribe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});