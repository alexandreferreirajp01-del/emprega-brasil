import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar admin
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar todas as vagas sem estado preenchido
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    
    // Buscar todas as cidades do banco
    const allCities = await base44.asServiceRole.entities.City.list('name', 6000);
    
    // Criar mapa cidade -> estado
    const cityToState = {};
    allCities.forEach(city => {
      if (!cityToState[city.name]) {
        cityToState[city.name] = city.state;
      }
    });

    let updated = 0;
    let errors = 0;

    for (const job of allJobs) {
      try {
        // Se já tem estado, pular
        if (job.state && job.city) continue;

        // Tentar extrair cidade do título ou descrição
        const text = `${job.title || ''} ${job.city || ''} ${job.description || ''}`.toLowerCase();
        
        let detectedCity = null;
        let detectedState = null;

        // Procurar cidade conhecida no texto
        for (const [cityName, state] of Object.entries(cityToState)) {
          if (text.includes(cityName.toLowerCase())) {
            detectedCity = cityName;
            detectedState = state;
            break;
          }
        }

        // Se detectou cidade/estado, atualizar
        if (detectedCity || detectedState) {
          await base44.asServiceRole.entities.Job.update(job.id, {
            city: detectedCity || job.city,
            state: detectedState || job.state
          });
          updated++;
        }
      } catch (err) {
        errors++;
        console.error(`Erro ao atualizar job ${job.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      message: `Atualização concluída: ${updated} vagas atualizadas, ${errors} erros`,
      total_jobs: allJobs.length,
      updated,
      errors
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});