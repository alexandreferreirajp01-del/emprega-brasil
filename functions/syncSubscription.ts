import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userEmail, subscriptionType, action = 'activate' } = await req.json();

    if (!userEmail || !subscriptionType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar usuário
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    if (action === 'activate') {
      // Verificar se já existe assinatura ativa
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
        user_email: userEmail,
        status: 'active'
      });

      if (existingSubs.length > 0) {
        return Response.json({ 
          success: true, 
          message: 'Subscription already exists',
          subscription: existingSubs[0]
        });
      }

      // Criar nova assinatura
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Padrão: mensal

      const subscription = await base44.asServiceRole.entities.Subscription.create({
        user_email: userEmail,
        user_name: targetUser.full_name || userEmail,
        subscription_type: subscriptionType,
        plan_duration: 'mensal',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_status: 'pending',
        status: 'active',
        notes: 'Ativação automática via gerenciador de usuários'
      });

      return Response.json({ 
        success: true, 
        message: 'Subscription created',
        subscription 
      });

    } else if (action === 'deactivate') {
      // Cancelar assinaturas ativas
      const activeSubs = await base44.asServiceRole.entities.Subscription.filter({
        user_email: userEmail,
        status: 'active'
      });

      for (const sub of activeSubs) {
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'cancelled',
          notes: (sub.notes || '') + '\nCancelada via gerenciador de usuários'
        });
      }

      return Response.json({ 
        success: true, 
        message: 'Subscriptions cancelled',
        count: activeSubs.length
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error syncing subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});