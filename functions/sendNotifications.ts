import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notification, jobIds, templateId, targetUsers } = await req.json();
    
    const brasiliaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    // Obter detalhes das vagas
    let jobs = [];
    if (jobIds && jobIds.length > 0) {
      for (const id of jobIds) {
        try {
          const job = await base44.asServiceRole.entities.Job.get(id);
          if (job) jobs.push(job);
        } catch (e) {
          console.warn(`Job ${id} not found`);
        }
      }
    }

    const numJobs = jobs.length;
    let dynamicTitle = notification.title;
    let dynamicMessage = notification.message;
    let emailSubject = notification.title;
    let primaryJobId = jobs.length > 0 ? jobs[0].id : null;

    // Se múltiplas vagas e a primeira tem contato, replicar para as outras
    if (numJobs > 1 && jobs[0]) {
      const primaryContact = jobs[0].application_link || jobs[0].additional_info;
      if (primaryContact) {
        for (let i = 1; i < jobs.length; i++) {
          if (!jobs[i].application_link && !jobs[i].additional_info) {
            jobs[i].application_link = primaryContact;
          }
        }
      }
    }

    // Se um template foi selecionado, usar ele
    if (templateId) {
      try {
        const template = await base44.asServiceRole.entities.NotificationTemplate.get(templateId);
        if (template && template.is_active) {
          // Substituir variáveis no template
          dynamicTitle = template.title_template
            .replace(/\{\{num_jobs\}\}/g, numJobs)
            .replace(/\{\{job_title\}\}/g, jobs[0]?.title || '')
            .replace(/\{\{company\}\}/g, jobs[0]?.company || '');
          
          dynamicMessage = template.message_template
            .replace(/\{\{num_jobs\}\}/g, numJobs)
            .replace(/\{\{job_title\}\}/g, jobs[0]?.title || '')
            .replace(/\{\{company\}\}/g, jobs[0]?.company || '');
          
          emailSubject = template.email_subject_template || dynamicTitle;
          notification.icon = template.icon || notification.icon;
        }
      } catch (e) {
        console.warn('Template not found, using dynamic generation');
      }
    }

    // Geração dinâmica se não houver template
    if (!templateId && numJobs > 0) {
      if (numJobs > 1) {
        dynamicTitle = `🚨 ${numJobs} Novas Vagas Publicadas!`;
        const phrases = [
          `Confira as ${numJobs} oportunidades recém-adicionadas no Emprega Brasil+!`, 
          `Acabamos de adicionar ${numJobs} vagas fresquinhas para você explorar!`, 
          `Não perca: ${numJobs} novas chances de emprego esperam por você!`, 
          `Sua próxima vaga pode estar entre estas ${numJobs} oportunidades!`,
          `${numJobs} vagas disponíveis agora no Emprega Brasil+!`,
          `Chegaram ${numJobs} novas vagas! Veja quais combinam com você.`
        ];
        dynamicMessage = phrases[Math.floor(Math.random() * phrases.length)];
        emailSubject = dynamicTitle;
      } else if (numJobs === 1) {
        dynamicTitle = `🔥 Nova Vaga: ${jobs[0].title}`;
        dynamicMessage = `${jobs[0].title} na ${jobs[0].company || 'empresa'} - ${jobs[0].city || 'localização'}, ${jobs[0].state || ''}`;
        emailSubject = `Nova Vaga: ${jobs[0].title} na ${jobs[0].company || 'empresa'}`;
      }
    }
    
    // Se múltiplas vagas, redirecionar para página de lote
    const jobUrl = numJobs > 1 
      ? `https://empregabrasil.app/recent-jobs-batch?ids=${jobIds.join(',')}` 
      : primaryJobId 
        ? `https://empregabrasil.app/jobs?id=${primaryJobId}` 
        : `https://empregabrasil.app/jobs`;

    let results = {
      email: { sent: 0, failed: 0 },
      push: { sent: 0, failed: 0 },
      bell: { sent: 0, failed: 0 }
    };

    // 1. NOTIFICAÇÃO SININHO INTERNO
    if (notification.channels.bell) {
      try {
        for (const userEmail of targetUsers) {
          const notifData = {
            user_email: userEmail,
            title: dynamicTitle,
            message: dynamicMessage,
            type: 'job',
            reference_type: 'job',
            reference_id: primaryJobId,
            job_id: primaryJobId,
            is_read: false
          };

          // Se múltiplas vagas, redirecionar para página de lote
          if (numJobs > 1) {
            notifData.redirect_page = 'RecentJobsBatch';
            notifData.redirect_params = { ids: jobIds.join(',') };
            notifData.redirect_url = `https://empregabrasil.app/recent-jobs-batch?ids=${jobIds.join(',')}`;
          } else if (primaryJobId) {
            notifData.redirect_page = 'JobDetail';
            notifData.redirect_params = { id: primaryJobId };
            notifData.redirect_url = `https://empregabrasil.app/jobs?id=${primaryJobId}`;
          }

          await base44.asServiceRole.entities.Notification.create(notifData);
          results.bell.sent++;
        }
      } catch (err) {
        console.error('Bell notification error:', err);
        results.bell.failed = targetUsers.length;
      }
    }

    // 2. NOTIFICAÇÃO PUSH
    if (notification.channels.push) {
      try {
        const targetGroups = notification.premiumOnly 
          ? ['premium', 'admin'] 
          : ['visitor', 'basic', 'premium', 'recruiter', 'admin'];

        const pushResult = await base44.asServiceRole.functions.invoke('pushSend', {
          title: dynamicTitle,
          message: dynamicMessage,
          icon: notification.icon,
          url: jobUrl,
          targetGroups
        });

        results.push.sent = pushResult.data?.sent || 0;
        results.push.failed = pushResult.data?.failed || 0;
      } catch (err) {
        console.error('Push notification error:', err);
        results.push.failed++;
      }
    }

    // 3. EMAIL
    if (notification.channels.email) {
      try {
        const users = await base44.asServiceRole.entities.User.list();
        const filteredUsers = notification.premiumOnly 
          ? users.filter(u => u.subscription_type === 'premium' || u.role === 'admin')
          : users;

        // Gerar lista de vagas para o email
        let jobListHtml = '';
        if (numJobs > 0) {
          jobListHtml = `
            <div style="margin: 20px 0;">
              <h3 style="color: #0A66C2; margin-bottom: 15px;">Vagas Publicadas:</h3>
              ${jobs.map(job => `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f9f9f9;">
                  <h4 style="margin: 0 0 8px 0; font-size: 18px; color: #0A66C2;">${job.title}</h4>
                  <p style="margin: 5px 0; font-size: 14px; color: #666;">
                    <strong>Empresa:</strong> ${job.company || 'Não informado'}<br>
                    <strong>Local:</strong> ${job.city || 'Não informado'}, ${job.state || ''}<br>
                    ${job.job_type ? `<strong>Tipo:</strong> ${job.job_type}<br>` : ''}
                    ${job.salary_range ? `<strong>Salário:</strong> ${job.salary_range}<br>` : ''}
                  </p>
                  <a href="https://empregabrasil.app/jobs?id=${job.id}" 
                     style="display: inline-block; background: #0A66C2; color: white; padding: 10px 20px; 
                            text-decoration: none; border-radius: 6px; font-size: 14px; margin-top: 10px;">
                    Ver Detalhes da Vaga
                  </a>
                </div>
              `).join('')}
            </div>
          `;
        }

        for (const u of filteredUsers) {
          if (u.email) {
            try {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: u.email,
                subject: emailSubject,
                body: `
                  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px;">
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #0A66C2 0%, #004182 100%); border-radius: 12px 12px 0 0; margin: -20px -20px 20px -20px;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">${notification.icon} Emprega Brasil+</h1>
                    </div>
                    
                    <h2 style="color: #0A66C2; margin-bottom: 15px; font-size: 24px;">${dynamicTitle}</h2>
                    <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 20px;">${dynamicMessage}</p>
                    
                    ${jobListHtml}
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://empregabrasil.app/jobs" 
                         style="display: inline-block; background: #0A66C2; color: white; padding: 14px 32px; 
                                text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                        Ver Todas as Vagas
                      </a>
                    </div>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                      <p style="font-size: 12px; color: #999; margin: 5px 0;">
                        Você recebeu este email porque está cadastrado no Emprega Brasil+
                      </p>
                      <p style="font-size: 12px; color: #999; margin: 5px 0;">
                        Para ajustar suas preferências de notificação, acesse seu perfil no app
                      </p>
                    </div>
                  </div>
                `
              });
              results.email.sent++;
            } catch (emailErr) {
              console.error(`Email failed for ${u.email}:`, emailErr);
              results.email.failed++;
            }
          }
        }
      } catch (err) {
        console.error('Email notification error:', err);
      }
    }

    return Response.json({ 
      success: true, 
      results,
      jobsProcessed: numJobs,
      timestamp: brasiliaTime.toISOString()
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});