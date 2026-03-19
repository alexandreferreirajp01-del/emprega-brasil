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

    const start = new Date(dateStart + 'T00:00:00');
    const end = new Date(dateEnd + 'T23:59:59');

    // Buscar vagas em páginas de 200 para não estourar memória
    const PAGE_SIZE = 200;
    let skip = 0;
    const jobsToDelete = [];

    while (true) {
      const page = await base44.asServiceRole.entities.Job.list('-created_date', PAGE_SIZE, skip);
      const pageArray = Array.isArray(page) ? page : (page?.data || page?.results || []);

      if (!pageArray || pageArray.length === 0) break;

      for (const job of pageArray) {
        const jobDate = new Date(job.published_at || job.created_date);
        if (jobDate >= start && jobDate <= end) {
          jobsToDelete.push(job);
        }
      }

      if (pageArray.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    if (jobsToDelete.length === 0) {
      return Response.json({ success: true, deleted: 0, message: 'Nenhuma vaga encontrada no período' });
    }

    console.log(`Encontradas ${jobsToDelete.length} vagas para excluir no período ${dateStart} - ${dateEnd}`);

    let deleted = 0;
    const BATCH_SIZE = 10; // processar 10 vagas por vez

    for (let i = 0; i < jobsToDelete.length; i += BATCH_SIZE) {
      const batch = jobsToDelete.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (job) => {
        const jobId = job.id;
        try {
          // Apagar registros associados em paralelo
          await Promise.all([
            base44.asServiceRole.entities.FavoriteJob.filter({ job_id: jobId })
              .then(items => Promise.all((Array.isArray(items) ? items : []).map(f => base44.asServiceRole.entities.FavoriteJob.delete(f.id))))
              .catch(() => {}),

            base44.asServiceRole.entities.ViewHistory.filter({ job_id: jobId })
              .then(items => Promise.all((Array.isArray(items) ? items : []).map(v => base44.asServiceRole.entities.ViewHistory.delete(v.id))))
              .catch(() => {}),

            base44.asServiceRole.entities.JobView.filter({ job_id: jobId })
              .then(items => Promise.all((Array.isArray(items) ? items : []).map(v => base44.asServiceRole.entities.JobView.delete(v.id))))
              .catch(() => {}),

            base44.asServiceRole.entities.Notification.filter({ reference_id: jobId })
              .then(items => Promise.all((Array.isArray(items) ? items : []).map(n => base44.asServiceRole.entities.Notification.delete(n.id))))
              .catch(() => {}),

            base44.asServiceRole.entities.JobInteraction.filter({ job_id: jobId })
              .then(items => Promise.all((Array.isArray(items) ? items : []).map(i => base44.asServiceRole.entities.JobInteraction.delete(i.id))))
              .catch(() => {}),
          ]);

          // Apagar a vaga
          await base44.asServiceRole.entities.Job.delete(jobId);
          deleted++;
        } catch (err) {
          console.error(`Erro ao excluir vaga ${jobId}:`, err.message);
        }
      }));

      console.log(`Progresso: ${Math.min(i + BATCH_SIZE, jobsToDelete.length)}/${jobsToDelete.length} processadas, ${deleted} excluídas`);
    }

    return Response.json({
      success: true,
      deleted,
      total: jobsToDelete.length,
      message: `${deleted} vaga(s) excluída(s) com sucesso`
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});