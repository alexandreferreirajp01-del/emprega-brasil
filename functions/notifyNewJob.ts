import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import webpush from 'npm:web-push@3.6.7';

// VAPID Keys para Push Notifications
const VAPID_PUBLIC_KEY = "BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q";
const VAPID_PRIVATE_KEY = "3jK8_LCcooMHF3xjb8sSjT3u5qXkwkdmewCzTolOjDA";
const VAPID_EMAIL = 'mailto:alexandreferreirajp01@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const APP_URL = 'https://vagasabertasparaiba.info';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { jobId, jobTitle, jobCompany, isHomeOffice } = await req.json();

    if (!jobId || !jobTitle) {
      return Response.json({ error: 'jobId and jobTitle are required' }, { status: 400 });
    }

    // Buscar TODOS os usuários (sem filtro de plano)
    const users = await base44.asServiceRole.entities.User.list('-created_date', 5000);
    
    // Criar notificação global (para todos)
    await base44.asServiceRole.entities.Notification.create({
      title: `Nova Vaga: ${jobTitle}`,
      message: `${jobCompany || 'Empresa'} está contratando! ${isHomeOffice ? '🏠 Home Office' : ''} Confira a vaga de ${jobTitle}.`,
      type: 'job',
      job_id: jobId,
      sent_to_all: true,
      is_read: false
    });

    const jobUrl = `${APP_URL}/JobDetail?id=${jobId}`;
    let emailsSent = 0;
    let pushSent = 0;
    let emailErrors = 0;
    let pushErrors = 0;

    // ========== ENVIAR EMAIL PARA TODOS OS USUÁRIOS ==========
    for (const user of users) {
      if (user.email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `🔔 Nova Vaga: ${jobTitle}${isHomeOffice ? ' 🏠 Home Office' : ''}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0056ff, #0044cc); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">Vagas Abertas Paraíba</h1>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                  <h2 style="color: #1e293b; margin-top: 0;">Nova Vaga Disponível! 🎉</h2>
                  <div style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #0056ff; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #0056ff; font-size: 20px;">${jobTitle}</h3>
                    <p style="color: #64748b; margin: 0; font-size: 16px;">${jobCompany || 'Empresa'}</p>
                    ${isHomeOffice ? '<span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px;">🏠 Home Office</span>' : ''}
                  </div>
                  <p style="color: #475569; margin-top: 20px; font-size: 15px;">
                    Uma nova oportunidade foi publicada! Não perca essa chance de conquistar a vaga dos seus sonhos.
                  </p>
                  <a href="${jobUrl}" 
                     style="display: inline-block; background: #0056ff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; margin-top: 20px; font-weight: bold; font-size: 16px;">
                    Ver Vaga Agora
                  </a>
                </div>
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0;">Você recebeu este email por estar cadastrado no Vagas Abertas Paraíba.</p>
                  <p style="margin: 5px 0 0 0;">WhatsApp: (83) 99197-1320</p>
                </div>
              </div>
            `
          });
          emailsSent++;
        } catch (emailError) {
          emailErrors++;
          console.error('Erro ao enviar email para', user.email, emailError.message);
        }
      }
    }

    // ========== ENVIAR PUSH NOTIFICATION PARA TODOS ==========
    try {
      const subscriptions = await base44.asServiceRole.entities.PushSubscription.list('-created_date', 10000);
      
      const payload = JSON.stringify({
        title: `Nova Vaga: ${jobTitle}`,
        body: `${jobCompany || 'Empresa'} está contratando!${isHomeOffice ? ' 🏠 Home Office' : ''} Clique para ver.`,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        url: jobUrl,
        timestamp: Date.now()
      });

      const failedSubscriptions = [];

      for (const sub of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          await webpush.sendNotification(pushSubscription, payload);
          pushSent++;
        } catch (pushError) {
          pushErrors++;
          // Se a inscrição expirou ou foi cancelada, marcar para remoção
          if (pushError.statusCode === 404 || pushError.statusCode === 410) {
            failedSubscriptions.push(sub.id);
          }
          console.error(`Push falhou para ${sub.endpoint}:`, pushError.message);
        }
      }

      // Remover inscrições inválidas
      for (const subId of failedSubscriptions) {
        try {
          await base44.asServiceRole.entities.PushSubscription.delete(subId);
        } catch (e) {
          console.error('Falha ao deletar subscription:', e.message);
        }
      }
    } catch (pushListError) {
      console.error('Erro ao listar push subscriptions:', pushListError.message);
    }

    return Response.json({ 
      success: true,
      emailsSent,
      emailErrors,
      pushSent,
      pushErrors,
      totalUsers: users.length,
      message: `Notificações enviadas: ${emailsSent} emails, ${pushSent} push`
    });

  } catch (error) {
    console.error('Erro ao notificar:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});