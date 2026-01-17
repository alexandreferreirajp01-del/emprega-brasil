import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { jobIds } = await req.json();
    const jobs = jobIds 
      ? await Promise.all(jobIds.map(id => base44.asServiceRole.entities.Job.filter({ id })))
      : await base44.asServiceRole.entities.Job.list('', 10000);

    const jobsList = jobIds ? jobs.flat() : jobs;
    
    let processed = 0;
    let errors = 0;
    let skipped = 0;

    for (const job of jobsList) {
      try {
        // Se for remoto, pular
        if (job.is_remote || job.work_mode === 'Remoto') {
          await base44.asServiceRole.entities.Job.update(job.id, {
            is_remote: true,
            geocode_status: 'remote',
            exibir_no_mapa: false
          });
          skipped++;
          continue;
        }

        const cidade = job.city?.trim();
        const uf = job.state?.trim()?.toUpperCase();

        if (!cidade || !uf) {
          errors++;
          continue;
        }

        // Usar API de geocoding do Nominatim (OpenStreetMap)
        const query = `${cidade}, ${uf}, Brasil`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'VagasApp/1.0'
          }
        });

        const data = await response.json();

        if (data && data.length > 0) {
          const location = data[0];
          await base44.asServiceRole.entities.Job.update(job.id, {
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon),
            geocode_status: 'ok',
            nivel_localizacao: 'cidade',
            exibir_no_mapa: true,
            geocode_query: query,
            fonte_geocode: 'nominatim',
            score: location.importance || 0
          });
          processed++;
        } else {
          await base44.asServiceRole.entities.Job.update(job.id, {
            geocode_status: 'failed',
            geocode_query: query,
            needs_review: true
          });
          errors++;
        }

        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        errors++;
        console.error(`Erro ao geocodificar vaga ${job.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      message: `Geocodificação concluída: ${processed} vagas processadas, ${errors} erros, ${skipped} puladas`,
      processed,
      errors,
      skipped
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});