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

    // Excluir vagas sem contato
    let deleted = 0;
    for (const job of jobsWithoutContact) {
      await base44.asServiceRole.entities.Job.delete(job.id);
      deleted++;
    }

    return Response.json({
      success: true,
      message: `${deleted} vagas sem contato foram excluídas`,
      total_vagas_analisadas: allJobs.length,
      vagas_excluidas: deleted
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});