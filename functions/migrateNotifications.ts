import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin' && user.email !== 'alexandreferreirajp01@gmail.com')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar todas as notificações
    const notifications = await base44.asServiceRole.entities.Notification.list('-created_date', 10000);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const notification of notifications) {
      try {
        const updateData = {};

        // 1. Se tem job_id mas não tem reference configurado
        if (notification.job_id && !notification.reference_type) {
          updateData.reference_type = 'job';
          updateData.reference_id = notification.job_id;
        }
        // 2. Se tem link com /jobs?id=, extrair ID
        else if (notification.link && notification.link.includes('/jobs?id=') && !notification.reference_type) {
          const jobId = notification.link.split('id=')[1]?.split('&')[0];
          if (jobId) {
            if (!notification.job_id) updateData.job_id = jobId;
            updateData.reference_type = 'job';
            updateData.reference_id = jobId;
          }
        }
        // 3. Se tem link com /news, é notícia
        else if (notification.link && notification.link.includes('/news') && !notification.reference_type) {
          const newsId = notification.link.split('id=')[1]?.split('&')[0];
          if (newsId) {
            updateData.reference_type = 'news';
            updateData.reference_id = newsId;
          }
        }
        // 4. Se tipo é job mas não tem reference
        else if (notification.type === 'job' && !notification.reference_type && !notification.job_id) {
          // Tentar extrair do link ou pular
          if (notification.link && notification.link.includes('id=')) {
            const jobId = notification.link.split('id=')[1]?.split('&')[0];
            if (jobId) {
              updateData.job_id = jobId;
              updateData.reference_type = 'job';
              updateData.reference_id = jobId;
            }
          }
        }
        // 5. Se tipo é admin ou user
        else if ((notification.type === 'admin' || notification.type === 'user') && !notification.reference_type) {
          updateData.reference_type = 'user';
        }
        // 6. Se tipo é feed
        else if (notification.type === 'feed' && !notification.reference_type) {
          updateData.reference_type = 'feed_post';
        }

        // Atualizar se tiver algo para atualizar
        if (Object.keys(updateData).length > 0) {
          await base44.asServiceRole.entities.Notification.update(notification.id, updateData);
          updated++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Erro na notificação ${notification.id}:`, err);
        errors++;
      }
    }

    return Response.json({ 
      success: true, 
      total: notifications.length,
      updated,
      skipped,
      errors,
      message: `Migração concluída: ${updated} atualizadas, ${skipped} ignoradas, ${errors} erros`
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});