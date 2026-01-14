import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todas as vagas
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);

    // Filtrar vagas sem contato (application_link vazio ou null)
    const jobsWithoutContact = allJobs.filter(job => 
      !job.application_link || job.application_link.trim() === ''
    );

    // Excluir vagas sem contato em lotes de 10 por vez
    let deleted = 0;
    const batchSize = 10;
    
    for (let i = 0; i < jobsWithoutContact.length; i += batchSize) {
      const batch = jobsWithoutContact.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (job) => {
          try {
            await base44.asServiceRole.entities.Job.delete(job.id);
            deleted++;
          } catch (err) {
            console.error(`Erro ao deletar vaga ${job.id}:`, err);
          }
        })
      );
      
      // Pequeno delay entre lotes para evitar rate limit
      if (i + batchSize < jobsWithoutContact.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return Response.json({
      success: true,
      message: `${deleted} vagas sem contato foram excluídas com sucesso`,
      total_vagas_analisadas: allJobs.length,
      vagas_excluidas: deleted,
      vagas_com_erro: jobsWithoutContact.length - deleted
    });

  } catch (error) {
    console.error('Erro na função:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});