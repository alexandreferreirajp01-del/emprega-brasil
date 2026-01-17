import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const jobs = await base44.asServiceRole.entities.Job.list('', 10000);
    let processed = 0;
    let errors = 0;

    for (const job of jobs) {
      try {
        // Se for remoto, marcar e pular
        if (job.is_remote || job.work_mode === 'Remoto' || 
            job.job_type === 'Home Office') {
          await base44.asServiceRole.entities.Job.update(job.id, {
            is_remote: true,
            geocode_status: 'remote',
            nivel_localizacao: 'remoto',
            exibir_no_mapa: false
          });
          processed++;
          continue;
        }

        // Normalizar dados
        const cidade = job.city?.trim();
        const uf = job.state?.trim()?.toUpperCase();
        const bairro = job.neighborhood?.trim();

        // Validar dados mínimos
        if (!cidade || !uf) {
          await base44.asServiceRole.entities.Job.update(job.id, {
            geocode_status: 'failed',
            needs_review: true,
            review_notes: 'Faltam dados de localização (cidade ou UF)'
          });
          errors++;
          continue;
        }

        // Construir query de busca
        let query = '';
        if (bairro) {
          query = `${bairro}, ${cidade}, ${uf}, Brasil`;
        } else {
          query = `${cidade}, ${uf}, Brasil`;
        }

        // Aqui você pode integrar com uma API de geocoding real
        // Por enquanto, vamos marcar como pendente
        await base44.asServiceRole.entities.Job.update(job.id, {
          cidade_normalizada: cidade,
          uf_normalizada: uf,
          bairro_normalizado: bairro || null,
          geocode_query: query,
          geocode_status: 'pending',
          nivel_localizacao: bairro ? 'aproximada' : 'cidade',
          exibir_no_mapa: true
        });

        processed++;
      } catch (err) {
        errors++;
        console.error(`Erro ao processar vaga ${job.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      message: `${processed} vagas processadas, ${errors} erros`,
      processed,
      errors
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});