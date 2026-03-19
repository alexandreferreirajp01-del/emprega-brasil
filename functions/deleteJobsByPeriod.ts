import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { dateStart, dateEnd } = await req.json();

    if (!dateStart || !dateEnd) {
      return Response.json({ error: 'dateStart e dateEnd são obrigatórios' }, { status: 400 });
    }

    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    end.setHours(23, 59, 59, 999);

    // Buscar todas as vagas no período pela data de publicação (published_at ou created_date)
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    const jobsToDelete = allJobs.filter(job => {
      const jobDate = new Date(job.published_at || job.created_date);
      return jobDate >= start && jobDate <= end;
    });

    if (jobsToDelete.length === 0) {
      return Response.json({ success: true, deleted: 0, message: 'Nenhuma vaga encontrada no período' });
    }

    let deleted = 0;
    const errors = [];

    for (const job of jobsToDelete) {
      try {
        const jobId = job.id;

        // Apagar FavoriteJob
        try {
          const favs = await base44.asServiceRole.entities.FavoriteJob.filter({ job_id: jobId });
          await Promise.all(favs.map(f => base44.asServiceRole.entities.FavoriteJob.delete(f.id)));
        } catch (e) { console.log('Aviso FavoriteJob:', e.message); }

        // Apagar ViewHistory
        try {
          const views = await base44.asServiceRole.entities.ViewHistory.filter({ job_id: jobId });
          await Promise.all(views.map(v => base44.asServiceRole.entities.ViewHistory.delete(v.id)));
        } catch (e) { console.log('Aviso ViewHistory:', e.message); }

        // Apagar JobView
        try {
          const jobViews = await base44.asServiceRole.entities.JobView.filter({ job_id: jobId });
          await Promise.all(jobViews.map(v => base44.asServiceRole.entities.JobView.delete(v.id)));
        } catch (e) { console.log('Aviso JobView:', e.message); }

        // Apagar Notifications referenciando a vaga
        try {
          const notifs = await base44.asServiceRole.entities.Notification.filter({ reference_id: jobId });
          await Promise.all(notifs.map(n => base44.asServiceRole.entities.Notification.delete(n.id)));
        } catch (e) { console.log('Aviso Notification:', e.message); }

        // Apagar JobInteraction se existir
        try {
          const interactions = await base44.asServiceRole.entities.JobInteraction.filter({ job_id: jobId });
          await Promise.all(interactions.map(i => base44.asServiceRole.entities.JobInteraction.delete(i.id)));
        } catch (e) { /* ignora se não existir */ }

        // Apagar a vaga
        await base44.asServiceRole.entities.Job.delete(jobId);
        deleted++;
      } catch (err) {
        errors.push({ jobId: job.id, error: err.message });
      }
    }

    return Response.json({
      success: true,
      deleted,
      total: jobsToDelete.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${deleted} vaga(s) excluída(s) com sucesso`
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});