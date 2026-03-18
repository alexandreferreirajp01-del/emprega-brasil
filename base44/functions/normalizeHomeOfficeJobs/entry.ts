import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const skip = body.skip || 0;
    const limit = 50; // processa 50 por vez

    const jobs = await base44.asServiceRole.entities.Job.list('-created_date', limit, skip);

    if (!jobs || jobs.length === 0) {
      return Response.json({ success: true, updated: 0, processed: 0, done: true });
    }

    let updated = 0;

    for (const job of jobs) {
      const titleLower = (job.title || '').toLowerCase();
      const descLower = (job.description || '').toLowerCase();

      const shouldBeRemote =
        job.is_remote === true ||
        job.work_mode === 'Remoto' ||
        job.job_type === 'Home Office' ||
        (Array.isArray(job.contract_types) && job.contract_types.includes('Home Office')) ||
        titleLower.includes('home office') ||
        titleLower.includes('remoto') ||
        descLower.includes('home office') ||
        descLower.includes('trabalho remoto');

      if (shouldBeRemote) {
        const needsUpdate = job.is_remote !== true || job.work_mode !== 'Remoto';

        if (needsUpdate) {
          await base44.asServiceRole.entities.Job.update(job.id, {
            is_remote: true,
            work_mode: 'Remoto',
            geocode_status: 'remote',
            exibir_no_mapa: false,
          });
          updated++;
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }

    return Response.json({
      success: true,
      processed: jobs.length,
      updated,
      skip,
      nextSkip: skip + limit,
      done: jobs.length < limit,
    });

  } catch (error) {
    console.error('[normalizeHomeOfficeJobs] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});