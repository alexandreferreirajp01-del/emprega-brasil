import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { template_id, target_audience, custom_emails, channel } = await req.json();

    if (!template_id || !target_audience || !channel) {
      return Response.json({ 
        error: 'Parâmetros obrigatórios: template_id, target_audience, channel' 
      }, { status: 400 });
    }

    // Buscar o template
    const template = await base44.asServiceRole.entities.PromoTemplate.get(template_id);
    
    if (!template || !template.is_active) {
      return Response.json({ error: 'Template não encontrado ou inativo' }, { status: 404 });
    }

    // Buscar destinatários
    let users = [];
    if (target_audience === 'all') {
      users = await base44.asServiceRole.entities.User.list();
    } else if (target_audience === 'custom' && custom_emails?.length > 0) {
      users = await base44.asServiceRole.entities.User.filter({
        email: { $in: custom_emails }
      });
    } else if (target_audience === 'inactive') {
      // Usuários sem assinatura ativa
      const activeSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
        status: 'active'
      });
      const activeEmails = activeSubscriptions.map(s => s.user_email);
      const allUsers = await base44.asServiceRole.entities.User.list();
      users = allUsers.filter(u => !activeEmails.includes(u.email));
    } else {
      // Filtrar por plano
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        plan_type: target_audience,
        status: 'active'
      });
      const emails = subscriptions.map(s => s.user_email);
      if (emails.length > 0) {
        users = await base44.asServiceRole.entities.User.filter({
          email: { $in: emails }
        });
      }
    }

    if (users.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Nenhum usuário encontrado com os critérios selecionados',
        sent: 0,
        failed: 0
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Enviar para cada usuário
    for (const targetUser of users) {
      try {
        // Personalizar mensagem
        const personalizedMessage = template.message
          .replace(/\{nome\}/g, targetUser.full_name || 'Usuário')
          .replace(/\{email\}/g, targetUser.email);

        // Enviar email
        if (channel === 'email' || channel === 'both') {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: targetUser.email,
            subject: template.subject || 'Vagas Abertas PB',
            body: personalizedMessage
          });
        }

        // Enviar WhatsApp (se disponível)
        if ((channel === 'whatsapp' || channel === 'both') && targetUser.phone) {
          // Implementar envio WhatsApp
        }

        sentCount++;
      } catch (error) {
        failedCount++;
        errors.push({ email: targetUser.email, error: error.message });
      }
    }

    return Response.json({
      success: true,
      template: template.name,
      target: target_audience,
      total_users: users.length,
      sent: sentCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : []
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});