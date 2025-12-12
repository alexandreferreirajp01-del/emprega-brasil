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

    for (const notification of notifications) {
      // Pular se já tem reference_type e reference_id
      if (notification.reference_type && notification.reference_id) {
        skipped++;
        continue;
      }

      const updateData = {};

      // 1. Se tem job_id, configurar para job
      if (notification.job_id) {
        updateData.reference_type = 'job';
        updateData.reference_id = notification.job_id;
      }
      // 2. Se tem link com /jobs?id=, extrair ID
      else if (notification.link && notification.link.includes('/jobs?id=')) {
        const jobId = notification.link.split('id=')[1]?.split('&')[0];
        if (jobId) {
          updateData.job_id = jobId;
          updateData.reference_type = 'job';
          updateData.reference_id = jobId;
        }
      }
      // 3. Se tem link com /news, é notícia
      else if (notification.link && notification.link.includes('/news')) {
        const newsId = notification.link.split('id=')[1]?.split('&')[0];
        if (newsId) {
          updateData.reference_type = 'news';
          updateData.reference_id = newsId;
        }
      }
      // 4. Se tipo é admin ou user
      else if (notification.type === 'admin' || notification.type === 'user') {
        updateData.reference_type = 'user';
        // reference_id pode ficar vazio para notificações gerais de admin
      }
      // 5. Se tipo é feed
      else if (notification.type === 'feed') {
        updateData.reference_type = 'feed_post';
        // reference_id pode ficar vazio para notificações gerais de feed
      }

      // Atualizar se tiver algo para atualizar
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.Notification.update(notification.id, updateData);
        updated++;
      } else {
        skipped++;
      }
    }

    return Response.json({ 
      success: true, 
      total: notifications.length,
      updated,
      skipped,
      message: `Migração concluída: ${updated} notificações atualizadas, ${skipped} ignoradas`
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});