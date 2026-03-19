import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { subscription_id, new_status, old_status, notes } = body;

    if (!subscription_id || !new_status) {
      return Response.json({ error: 'subscription_id and new_status required' }, { status: 400 });
    }

    // Atualizar assinatura
    await base44.asServiceRole.entities.Subscription.update(subscription_id, {
      status: new_status
    });

    // Registrar no histórico
    const subscription = await base44.asServiceRole.entities.Subscription.get(subscription_id);
    await base44.asServiceRole.entities.FinancialHistory.create({
      subscription_id,
      user_email: subscription.user_email,
      user_name: subscription.user_name,
      event_type: 'status_change',
      old_status: old_status || 'unknown',
      new_status,
      notes: notes || `Status mudou de ${old_status} para ${new_status}`,
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      message: 'Status atualizado com sucesso'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});