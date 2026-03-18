import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verificar se é admin
    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todas as assinaturas
    const subscriptions = await base44.asServiceRole.entities.Subscription.list('', 1000);
    
    // Buscar todos os registros de FinancialHistory
    const financialHistory = await base44.asServiceRole.entities.FinancialHistory.list('', 1000);
    
    let createdCount = 0;
    let fixedCount = 0;
    const processed = [];
    const errors = [];

    // Para cada assinatura, garantir que tem registro de payment correto
    for (const sub of subscriptions) {
      try {
        // Buscar TODOS os registros de payment/renewal para esta assinatura
        const paymentRecords = financialHistory.filter(
          h => h.subscription_id === sub.id && 
               (h.event_type === 'payment' || h.event_type === 'renewal')
        );

        if (paymentRecords.length === 0) {
          // Criar registro de payment se não existir nenhum
          await base44.asServiceRole.entities.FinancialHistory.create({
            subscription_id: sub.id,
            user_email: sub.user_email,
            user_name: sub.user_name,
            event_type: 'payment',
            amount: parseFloat(sub.amount || 0),
            cycle: sub.cycle,
            payment_method: sub.payment_method,
            notes: `Pagamento inicial`,
            timestamp: sub.payment_date || new Date().toISOString()
          });
          createdCount++;
          processed.push({ action: 'created', subscription: sub.user_name, amount: sub.amount });
        } else {
          // Verificar e corrigir cada registro
          for (const record of paymentRecords) {
            if (!record.amount || record.amount === 0 || record.amount === null) {
              await base44.asServiceRole.entities.FinancialHistory.update(record.id, {
                amount: parseFloat(sub.amount || 0)
              });
              fixedCount++;
              processed.push({ action: 'fixed', subscription: sub.user_name, amount: sub.amount });
            }
          }
        }
      } catch (error) {
        errors.push({
          subscription: sub.user_name,
          userEmail: sub.user_email,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `✅ ${createdCount} registros criados, ${fixedCount} corrigidos`,
      createdCount,
      fixedCount,
      processed,
      totalSubscriptions: subscriptions.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});