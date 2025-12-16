import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = user.role === 'admin' || 
                    user.subscription_type === 'admin' ||
                    user.email === 'alexandreferreirajp01@gmail.com';
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar todas as vagas
    const allJobs = await base44.asServiceRole.entities.Job.list('created_date', 10000);
    
    // Buscar todas as cidades para mapear city -> state
    const allCities = await base44.asServiceRole.entities.City.list('name', 6000);
    
    const cityToStateMap = {};
    allCities.forEach(city => {
      cityToStateMap[city.name] = city.state;
    });

    let updated = 0;
    let skipped = 0;

    // Atualizar vagas que não têm state definido
    for (const job of allJobs) {
      if (!job.state && job.city && cityToStateMap[job.city]) {
        try {
          await base44.asServiceRole.entities.Job.update(job.id, {
            state: cityToStateMap[job.city]
          });
          updated++;
        } catch (e) {
          console.error(`Erro ao atualizar vaga ${job.id}:`, e);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      message: `Atualização concluída: ${updated} vagas atualizadas, ${skipped} ignoradas`,
      updated,
      skipped,
      total: allJobs.length
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});