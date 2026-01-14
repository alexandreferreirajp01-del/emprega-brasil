import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Apenas admin pode executar
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[notifyJobExpiringIn24h] Iniciando verificação de vagas expirando em 24h em ${now.toISOString()}`);

    // Calcular data do próximo dia (24 horas a partir de agora, com margem de 1 hora)
    const in24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 horas
    const in24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // 25 horas

    // Buscar todas as vagas com status 'ativa'
    const activeJobs = await base44.asServiceRole.entities.Job.filter({ status: 'ativa' }, '-created_date', 1000);
    
    if (!activeJobs || activeJobs.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Nenhuma vaga ativa encontrada',
        notifiedCount: 0,
        timestamp: now.toISOString()
      });
    }

    let notifiedCount = 0;
    const notifiedJobs = [];

    // Verificar cada vaga
    for (const job of activeJobs) {
      if (!job.expiration_date) continue;

      const expirationDate = new Date(job.expiration_date);

      // Se a data de expiração está entre 23-25 horas a partir de agora
      if (expirationDate >= in24hStart && expirationDate <= in24hEnd) {
        try {
          // Buscar criador da vaga
          const jobCreator = job.created_by;
          
          // Enviar notificação pelo sininho
          await base44.asServiceRole.entities.Notification.create({
            user_email: jobCreator,
            title: '⏰ Sua vaga expira em 24 horas!',
            message: `A vaga "${job.title}" na ${job.company} irá expirar em 24 horas e será removida das listagens públicas.`,
            type: 'job',
            reference_type: 'job',
            reference_id: job.id,
            icon_url: '⏰'
          });

          // Enviar email
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: jobCreator,
            subject: `⏰ Aviso: Sua vaga "${job.title}" expira em 24 horas`,
            body: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); border-radius: 12px 12px 0 0; margin: -20px -20px 20px -20px;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Aviso de Expiração</h1>
                </div>
                
                <h2 style="color: #FF6B35; margin-bottom: 15px; font-size: 22px;">Sua vaga expira em 24 horas!</h2>
                
                <div style="background: #FFF3E0; padding: 20px; border-left: 4px solid #FF6B35; border-radius: 8px; margin-bottom: 20px;">
                  <p style="font-size: 16px; color: #333; margin: 0 0 10px 0;">
                    <strong>Vaga:</strong> ${job.title}
                  </p>
                  <p style="font-size: 16px; color: #333; margin: 0 0 10px 0;">
                    <strong>Empresa:</strong> ${job.company || 'Não informado'}
                  </p>
                  <p style="font-size: 16px; color: #333; margin: 0;">
                    <strong>Expira em:</strong> ${new Date(job.expiration_date).toLocaleDateString('pt-BR')} às ${new Date(job.expiration_date).toLocaleTimeString('pt-BR')}
                  </p>
                </div>

                <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Após a expiração, sua vaga será removida das listagens públicas do Emprega Brasil+ e não aparecerá mais para os usuários. Os registros históricos serão mantidos em sua conta.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://empregabrasil.app/configuracoes" 
                     style="display: inline-block; background: #0A66C2; color: white; padding: 14px 32px; 
                            text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin-right: 10px;">
                    Renovar Vaga
                  </a>
                  <a href="https://empregabrasil.app/vagas?id=${job.id}" 
                     style="display: inline-block; background: #E0E0E0; color: #333; padding: 14px 32px; 
                            text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                    Ver Vaga
                  </a>
                </div>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                  <p style="font-size: 12px; color: #999; margin: 5px 0;">
                    Este é um aviso automático do Emprega Brasil+
                  </p>
                </div>
              </div>
            `
          });

          notifiedJobs.push({
            id: job.id,
            title: job.title,
            company: job.company,
            expirationDate: job.expiration_date,
            createdBy: jobCreator
          });

          notifiedCount++;
          console.log(`[notifyJobExpiringIn24h] Notificação enviada para ${jobCreator} - Vaga: ${job.title}`);
        } catch (err) {
          console.error(`[notifyJobExpiringIn24h] Erro ao notificar vaga ${job.id}:`, err.message);
        }
      }
    }

    console.log(`[notifyJobExpiringIn24h] Processo concluído: ${notifiedCount} notificações enviadas`);

    return Response.json({ 
      success: true, 
      message: `${notifiedCount} notificações de expiração enviadas`,
      notifiedCount,
      notifiedJobs,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('[notifyJobExpiringIn24h] Erro geral:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});