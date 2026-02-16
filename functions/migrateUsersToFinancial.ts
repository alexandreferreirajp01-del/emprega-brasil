import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Buscar todos os usuários com subscription_type premium ou recruiter
    const allUsers = await base44.asServiceRole.entities.User.list();
    const premiumUsers = allUsers.filter(u => 
      u.subscription_type === 'premium' || u.subscription_type === 'recruiter'
    );

    // Buscar assinaturas já existentes
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.list();
    const existingEmails = new Set(existingSubscriptions.map(s => s.user_email));

    const migrated = [];
    const skipped = [];

    for (const premiumUser of premiumUsers) {
      if (existingEmails.has(premiumUser.email)) {
        skipped.push(premiumUser.email);
        continue;
      }

      // Criar assinatura para este usuário
      const subscription = await base44.asServiceRole.entities.Subscription.create({
        user_email: premiumUser.email,
        user_name: premiumUser.full_name || 'Sem nome',
        account_type: premiumUser.subscription_type === 'recruiter' ? 'recruiter' : 'premium',
        status: 'active',
        cycle: 'monthly',
        amount: 0,
        payment_method: 'manual',
        payment_date: new Date().toISOString(),
        start_date: new Date().toISOString(),
        expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        days_remaining: 30,
        notes: 'Migrado automaticamente do Gerenciador de Usuários'
      });

      // Registrar no histórico
      await base44.asServiceRole.entities.FinancialHistory.create({
        subscription_id: subscription.id,
        user_email: premiumUser.email,
        user_name: premiumUser.full_name || 'Sem nome',
        event_type: 'payment',
        new_status: 'active',
        amount: 0,
        cycle: 'monthly',
        payment_method: 'manual',
        notes: 'Criado através de migração automática',
        timestamp: new Date().toISOString()
      });

      migrated.push(premiumUser.email);
    }

    return Response.json({
      success: true,
      message: `Migração concluída! ${migrated.length} usuários migrados, ${skipped.length} ignorados (já existiam)`,
      migrated_count: migrated.length,
      skipped_count: skipped.length,
      migrated_emails: migrated,
      skipped_emails: skipped
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});