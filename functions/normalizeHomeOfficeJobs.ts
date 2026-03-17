import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Normaliza vagas Home Office / Remoto:
 * - job_type === 'Home Office' → work_mode = 'Remoto', is_remote = true
 * - work_mode === 'Remoto' → is_remote = true, job_type = 'Home Office' (se não tiver tipo)
 * - title/description com "home office" ou "remoto" → is_remote = true, work_mode = 'Remoto'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    let page = 0;
    const pageSize = 100;
    let updated = 0;
    let processed = 0;

    while (true) {
      const jobs = await base44.asServiceRole.entities.Job.list('-created_date', pageSize, pageSize * page);
      if (!jobs || jobs.length === 0) break;

      for (const job of jobs) {
        processed++;
        const titleLower = (job.title || '').toLowerCase();
        const descLower = (job.description || '').toLowerCase();

        const isHomeOfficeByType = job.job_type === 'Home Office';
        const isRemotoByMode = job.work_mode === 'Remoto';
        const isRemotoByField = job.is_remote === true;
        const hasHomeOfficeInTitle = titleLower.includes('home office') || titleLower.includes('remoto') || titleLower.includes('remote');
        const hasHomeOfficeInDesc = descLower.includes('home office') || descLower.includes('trabalho remoto');
        const hasInContractTypes = Array.isArray(job.contract_types) && job.contract_types.includes('Home Office');

        const shouldBeRemote = isHomeOfficeByType || isRemotoByMode || isRemotoByField || hasHomeOfficeInTitle || hasHomeOfficeInDesc || hasInContractTypes;

        if (shouldBeRemote) {
          const needsUpdate =
            job.is_remote !== true ||
            job.work_mode !== 'Remoto' ||
            job.geocode_status === 'pending';

          if (needsUpdate) {
            await base44.asServiceRole.entities.Job.update(job.id, {
              is_remote: true,
              work_mode: 'Remoto',
              geocode_status: 'remote',
              exibir_no_mapa: false,
            });
            updated++;
          }
        }
      }

      if (jobs.length < pageSize) break;
      page++;
    }

    return Response.json({
      success: true,
      processed,
      updated,
      message: `${updated} vagas normalizadas como Home Office/Remoto de ${processed} processadas.`
    });

  } catch (error) {
    console.error('[normalizeHomeOfficeJobs] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});