import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const now = new Date().toISOString();
    
    // Buscar envios pendentes que já passaram da hora
    const pendingSchedules = await base44.asServiceRole.entities.PromoSchedule.filter({
      status: 'pending',
      scheduled_date: { $lte: now }
    });

    if (!pendingSchedules || pendingSchedules.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Nenhum envio agendado pendente',
        processed: 0
      });
    }

    const results = [];

    for (const schedule of pendingSchedules) {
      try {
        // Buscar o template
        const template = await base44.asServiceRole.entities.PromoTemplate.get(schedule.template_id);
        
        if (!template || !template.is_active) {
          await base44.asServiceRole.entities.PromoSchedule.update(schedule.id, {
            status: 'failed',
            error_message: 'Template não encontrado ou inativo',
            sent_at: new Date().toISOString()
          });
          continue;
        }

        // Buscar destinatários
        let users = [];
        if (schedule.target_audience === 'all') {
          users = await base44.asServiceRole.entities.User.list();
        } else if (schedule.target_audience === 'custom' && schedule.custom_emails?.length > 0) {
          users = await base44.asServiceRole.entities.User.filter({
            email: { $in: schedule.custom_emails }
          });
        } else {
          // Filtrar por plano
          const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            plan_type: schedule.target_audience,
            status: 'active'
          });
          const emails = subscriptions.map(s => s.user_email);
          if (emails.length > 0) {
            users = await base44.asServiceRole.entities.User.filter({
              email: { $in: emails }
            });
          }
        }

        let sentCount = 0;
        let failedCount = 0;

        // Enviar para cada usuário
        for (const targetUser of users) {
          try {
            // Personalizar mensagem
            const personalizedMessage = template.message
              .replace(/\{nome\}/g, targetUser.full_name || 'Usuário')
              .replace(/\{email\}/g, targetUser.email);

            // Enviar email
            if (schedule.channel === 'email' || schedule.channel === 'both') {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: targetUser.email,
                subject: template.subject || 'Vagas Abertas PB',
                body: personalizedMessage
              });
            }

            // Enviar WhatsApp (se disponível)
            if ((schedule.channel === 'whatsapp' || schedule.channel === 'both') && targetUser.phone) {
              // Implementar envio WhatsApp via ZAPI ou outra integração
              // await base44.asServiceRole.functions.invoke('sendWhatsAppNotification', {
              //   phone: targetUser.phone,
              //   message: personalizedMessage
              // });
            }

            sentCount++;
          } catch (error) {
            failedCount++;
            console.error('Erro ao enviar para:', targetUser.email, error);
          }
        }

        // Atualizar status do agendamento
        await base44.asServiceRole.entities.PromoSchedule.update(schedule.id, {
          status: 'sent',
          sent_count: sentCount,
          failed_count: failedCount,
          sent_at: new Date().toISOString()
        });

        results.push({
          schedule_id: schedule.id,
          template_name: template.name,
          sent: sentCount,
          failed: failedCount
        });

      } catch (error) {
        await base44.asServiceRole.entities.PromoSchedule.update(schedule.id, {
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString()
        });
        
        results.push({
          schedule_id: schedule.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      processed: pendingSchedules.length,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});