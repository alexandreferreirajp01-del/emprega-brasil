import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verificar se é admin
    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todos os registros de FinancialHistory
    const financialHistory = await base44.asServiceRole.entities.FinancialHistory.list();
    
    // Buscar todas as assinaturas
    const subscriptions = await base44.asServiceRole.entities.Subscription.list();
    
    let fixedCount = 0;
    const errors = [];

    // Para cada registro de FinancialHistory com amount = 0
    for (const record of financialHistory) {
      if (record.amount === 0 || record.amount === null) {
        try {
          // Encontrar a assinatura relacionada
          const subscription = subscriptions.find(s => s.id === record.subscription_id);
          
          if (subscription && subscription.amount > 0) {
            // Atualizar o registro com o amount correto
            await base44.asServiceRole.entities.FinancialHistory.update(record.id, {
              amount: subscription.amount
            });
            fixedCount++;
          }
        } catch (error) {
          errors.push({
            recordId: record.id,
            error: error.message
          });
        }
      }
    }

    return Response.json({
      success: true,
      message: `Corrigidos ${fixedCount} registros de FinancialHistory`,
      fixedCount,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Erro ao corrigir FinancialHistory:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});