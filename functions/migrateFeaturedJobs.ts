import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todas as vagas
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    
    // Identificar vagas que podem estar marcadas como destaque na função antiga
    // (vagas com is_featured = true ou qualquer variação)
    const jobsToCheck = allJobs.filter(job => 
      job.is_featured === true || 
      job.featured === true ||
      job.destaque === true
    );

    const migratedJobs = [];
    const alreadyCorrect = [];

    for (const job of jobsToCheck) {
      // Se já está com is_featured correto, apenas registra
      if (job.is_featured === true) {
        alreadyCorrect.push({
          id: job.id,
          title: job.title,
          status: 'already_correct'
        });
      } else {
        // Migrar: garantir que is_featured = true
        await base44.asServiceRole.entities.Job.update(job.id, {
          is_featured: true
        });
        
        migratedJobs.push({
          id: job.id,
          title: job.title,
          old_value: job.featured || job.destaque,
          new_value: true
        });
      }
    }

    return Response.json({
      success: true,
      summary: {
        total_checked: jobsToCheck.length,
        already_correct: alreadyCorrect.length,
        migrated: migratedJobs.length
      },
      details: {
        already_correct: alreadyCorrect.slice(0, 20),
        migrated: migratedJobs
      }
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});