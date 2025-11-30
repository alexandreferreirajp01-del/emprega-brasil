import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação (opcional - permite visitantes também)
    let userEmail = '';
    try {
      const user = await base44.auth.me();
      userEmail = user?.email || '';
    } catch (e) {
      // Usuário não logado, mas pode se inscrever
    }

    const { subscription, action } = await req.json();

    if (action === 'unsubscribe') {
      // Remover inscrição
      const existing = await base44.asServiceRole.entities.PushSubscription.filter({
        endpoint: subscription.endpoint
      });
      
      for (const sub of existing) {
        await base44.asServiceRole.entities.PushSubscription.delete(sub.id);
      }
      
      return Response.json({ success: true, action: 'unsubscribed' });
    }

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Verificar se já existe
    const existing = await base44.asServiceRole.entities.PushSubscription.filter({
      endpoint: subscription.endpoint
    });

    if (existing.length > 0) {
      // Atualizar existente
      await base44.asServiceRole.entities.PushSubscription.update(existing[0].id, {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_email: userEmail,
        user_agent: req.headers.get('user-agent') || '',
        updated_at: new Date().toISOString()
      });
      
      return Response.json({ success: true, action: 'updated' });
    }

    // Criar nova inscrição
    await base44.asServiceRole.entities.PushSubscription.create({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_email: userEmail,
      user_agent: req.headers.get('user-agent') || ''
    });

    return Response.json({ success: true, action: 'subscribed' });

  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});