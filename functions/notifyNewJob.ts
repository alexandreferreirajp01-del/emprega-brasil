import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { jobId, jobTitle, jobCompany } = await req.json();

    if (!jobId || !jobTitle) {
      return Response.json({ error: 'jobId and jobTitle are required' }, { status: 400 });
    }

    // Buscar todos os usuários
    const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);

    // Criar notificação global (para todos)
    await base44.asServiceRole.entities.Notification.create({
      title: `Nova Vaga: ${jobTitle}`,
      message: `${jobCompany || 'Empresa'} está contratando! Confira a vaga de ${jobTitle}.`,
      type: 'job',
      job_id: jobId,
      sent_to_all: true,
      is_read: false
    });

    // Enviar email para usuários premium
    const premiumUsers = users.filter(u => 
      u.subscription_type === 'premium' || 
      u.subscription_type === 'admin' || 
      u.role === 'admin'
    );

    for (const user of premiumUsers) {
      if (user.email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `🔔 Nova Vaga: ${jobTitle}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0056ff, #0044cc); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Vagas Abertas Paraíba</h1>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                  <h2 style="color: #1e293b;">Nova Vaga Disponível! 🎉</h2>
                  <div style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #0056ff;">
                    <h3 style="margin-top: 0; color: #0056ff;">${jobTitle}</h3>
                    <p style="color: #64748b; margin: 0;">${jobCompany || 'Empresa'}</p>
                  </div>
                  <p style="color: #475569; margin-top: 20px;">
                    Uma nova oportunidade foi publicada e você está recebendo este aviso em primeira mão como usuário Premium!
                  </p>
                  <a href="https://vagas-abertas-paraiba-2af288b2.base44.app/JobDetail?id=${jobId}" 
                     style="display: inline-block; background: #0056ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
                    Ver Vaga
                  </a>
                </div>
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                  <p>Você recebeu este email por ser assinante Premium do Vagas Abertas Paraíba.</p>
                </div>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Erro ao enviar email para', user.email, emailError);
        }
      }
    }

    return Response.json({ 
      success: true, 
      notifiedUsers: premiumUsers.length,
      globalNotification: true
    });

  } catch (error) {
    console.error('Erro ao notificar:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});