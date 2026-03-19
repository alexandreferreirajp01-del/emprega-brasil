import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Buscar todas as assinaturas ativas
    const activeSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: 'active'
    });

    const now = new Date();
    const blockedCount = [];

    for (const subscription of activeSubscriptions) {
      const expDate = new Date(subscription.expiration_date);
      
      if (expDate < now) {
        // Bloquear assinatura expirada
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          status: 'blocked',
          is_active: false
        });

        // Registrar no histórico
        await base44.asServiceRole.entities.FinancialHistory.create({
          subscription_id: subscription.id,
          user_email: subscription.user_email,
          user_name: subscription.user_name,
          event_type: 'block',
          old_status: 'active',
          new_status: 'blocked',
          notes: 'Bloqueado automaticamente por expiração',
          timestamp: new Date().toISOString()
        });

        blockedCount.push(subscription.user_email);
      }
    }

    return Response.json({ 
      success: true,
      blocked_count: blockedCount.length,
      blocked_users: blockedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});