import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { jobIds, mode } = await req.json();
    
    // Modo de listagem - retornar vagas expiradas
    if (mode === 'list') {
      const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
      const expired = allJobs.filter(j => j.status === 'expirada');
      return Response.json({
        success: true,
        jobs: expired,
        count: expired.length
      });
    }
    
    let jobsToUpdate = [];
    
    if (mode === 'all') {
      // Buscar todas as vagas expiradas
      const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
      jobsToUpdate = allJobs.filter(j => j.status === 'expirada');
    } else if (mode === 'selected' && jobIds?.length > 0) {
      // Reativar apenas selecionadas
      jobsToUpdate = jobIds.map(id => ({ id }));
    } else {
      return Response.json({ error: 'Invalid mode or jobIds' }, { status: 400 });
    }

    if (jobsToUpdate.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Nenhuma vaga para reativar',
        updated: 0 
      });
    }

    // Atualizar cada vaga
    let updated = 0;
    for (const job of jobsToUpdate) {
      try {
        await base44.asServiceRole.entities.Job.update(job.id, {
          status: 'ativa',
          expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 dias
        });
        updated++;
      } catch (err) {
        console.error(`Erro ao reativar ${job.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      message: `${updated} vagas reativadas com sucesso`,
      updated
    });

  } catch (error) {
    console.error('Reactivate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});