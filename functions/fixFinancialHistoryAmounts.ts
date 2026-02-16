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
    const subscriptions = await base44.asServiceRole.entities.Subscription.list();
    
    // Buscar todos os registros de FinancialHistory
    const financialHistory = await base44.asServiceRole.entities.FinancialHistory.list('-timestamp', 1000);
    
    let createdCount = 0;
    let fixedCount = 0;
    const errors = [];

    // Para cada assinatura, verificar se tem registro de payment em FinancialHistory
    for (const sub of subscriptions) {
      try {
        // Procurar por um registro de payment para esta assinatura
        const paymentRecord = financialHistory.find(
          h => h.subscription_id === sub.id && 
               (h.event_type === 'payment' || h.event_type === 'renewal')
        );

        if (!paymentRecord) {
          // Criar registro de payment inicial se não existir
          await base44.asServiceRole.entities.FinancialHistory.create({
            subscription_id: sub.id,
            user_email: sub.user_email,
            user_name: sub.user_name,
            event_type: 'payment',
            amount: sub.amount,
            cycle: sub.cycle,
            payment_method: sub.payment_method,
            notes: `Pagamento inicial - ${sub.account_type}`,
            timestamp: sub.payment_date || new Date().toISOString()
          });
          createdCount++;
        } else if (paymentRecord.amount === 0 || paymentRecord.amount === null) {
          // Corrigir registros com amount = 0
          await base44.asServiceRole.entities.FinancialHistory.update(paymentRecord.id, {
            amount: sub.amount
          });
          fixedCount++;
        }
      } catch (error) {
        errors.push({
          subscriptionId: sub.id,
          userEmail: sub.user_email,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `${createdCount} registros criados, ${fixedCount} corrigidos`,
      createdCount,
      fixedCount,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Erro ao corrigir FinancialHistory:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});