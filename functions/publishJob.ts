import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Armazenar UUIDs processados (em produção, usar Redis ou DB)
const processedUUIDs = new Set();

Deno.serve(async (req) => {
  console.log('[PublishJob] Requisição recebida');
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                    user.role === 'admin' || 
                    user.subscription_type === 'admin';
    
    const isRecruiter = user.subscription_type === 'recruiter';

    if (!isAdmin && !isRecruiter) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const payload = await req.json();
    const { jobData, visibility, notification, scheduling, uuid } = payload;

    // ANTI-DUPLICAÇÃO
    if (processedUUIDs.has(uuid)) {
      console.log('[PublishJob] UUID já processado, bloqueando duplicação');
      return Response.json({ error: 'Esta vaga já foi publicada' }, { status: 409 });
    }

    // Validações
    if (!jobData?.title || !jobData?.company || !jobData?.description) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // AGENDAMENTO
    if (scheduling?.enabled && scheduling?.date && scheduling?.time) {
      const scheduledDate = new Date(`${scheduling.date}T${scheduling.time}`);
      
      if (scheduledDate <= new Date()) {
        return Response.json({ error: 'Data/hora deve ser futura' }, { status: 400 });
      }

      // Criar agendamento
      const scheduled = await base44.asServiceRole.entities.ScheduledPost.create({
        post_type: jobData.post_type || 'job',
        scheduled_date: scheduledDate.toISOString(),
        job_data: jobData,
        notification_data: notification || {},
        status: 'pending'
      });

      processedUUIDs.add(uuid);
      
      return Response.json({
        success: true,
        scheduled: true,
        id: scheduled.id
      });
    }

    // PUBLICAÇÃO IMEDIATA
    
    // Recrutador sem admin - criar solicitação
    if (isRecruiter && !isAdmin) {
      const request = await base44.entities.RecruiterRequest.create({
        recruiter_email: user.email,
        recruiter_name: user.full_name,
        recruiter_photo: user.profile_photo,
        request_type: jobData.post_type || 'job',
        title: jobData.title,
        content_preview: `${jobData.company} - ${jobData.city || 'Cidade não informada'}`,
        full_content: jobData,
        status: 'pending'
      });

      processedUUIDs.add(uuid);
      
      return Response.json({
        success: true,
        pending: true,
        id: request.id
      });
    }

    // Admin - criar vaga diretamente
    const createdJob = await base44.asServiceRole.entities.Job.create({
      ...jobData,
      city: jobData.city || 'Não informado',
      is_premium: visibility === 'premium' || jobData.is_premium,
      is_featured: jobData.is_featured || false
    });

    processedUUIDs.add(uuid);

    // ENVIAR NOTIFICAÇÕES
    if (notification?.enabled && notification?.template?.title && notification?.template?.message) {
      try {
        // Definir grupos alvo
        let targetGroups = ['visitor', 'basic', 'premium', 'recruiter', 'admin'];
        
        if (notification.premiumOnly) {
          targetGroups = ['premium', 'admin'];
        } else if (visibility === 'premium') {
          targetGroups = ['premium', 'admin'];
        }

        // Push Notification
        await base44.asServiceRole.functions.invoke('pushSend', {
          title: notification.template.title,
          message: notification.template.message,
          icon: notification.template.icon || '/icon-192.png',
          url: `/jobs?id=${createdJob.id}`,
          targetGroups
        });

        // Criar notificações no sininho
        const users = await base44.asServiceRole.entities.User.list();
        const targetUsers = users.filter(u => {
          if (notification.premiumOnly || visibility === 'premium') {
            return u.subscription_type === 'premium' || u.subscription_type === 'admin' || u.role === 'admin';
          }
          return true;
        });

        const notificationPromises = targetUsers.map(u => 
          base44.asServiceRole.entities.Notification.create({
            user_email: u.email,
            title: notification.template.title,
            message: notification.template.message,
            type: 'job',
            is_read: false,
            link: `/jobs?id=${createdJob.id}`
          })
        );
        await Promise.all(notificationPromises);

        // Enviar emails se habilitado
        if (notification.sendEmail) {
          for (const u of targetUsers.slice(0, 100)) { // Limitar a 100 por segurança
            try {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: u.email,
                subject: notification.template.title,
                body: `${notification.template.message}\n\nAcesse: ${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/jobs?id=${createdJob.id}`
              });
            } catch (e) {
              console.error('Erro ao enviar email para', u.email, e);
            }
          }
        }

      } catch (error) {
        console.error('[PublishJob] Erro ao enviar notificações:', error);
        // Não bloqueia a publicação se notificação falhar
      }
    }

    return Response.json({
      success: true,
      job: createdJob
    });

  } catch (error) {
    console.error('[PublishJob] Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});