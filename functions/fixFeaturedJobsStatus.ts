import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todas as vagas em destaque
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    
    const featuredJobs = allJobs.filter(job => 
      job.is_featured === true && 
      job.status !== 'ativa'
    );

    const updated = [];

    for (const job of featuredJobs) {
      await base44.asServiceRole.entities.Job.update(job.id, {
        status: 'ativa'
      });
      
      updated.push({
        id: job.id,
        title: job.title,
        old_status: job.status,
        new_status: 'ativa'
      });
    }

    return Response.json({
      success: true,
      updated_count: updated.length,
      sample: updated.slice(0, 20)
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});