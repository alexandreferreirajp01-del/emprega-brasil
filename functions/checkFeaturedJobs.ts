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
    
    const featuredJobs = allJobs.filter(job => job.is_featured === true);
    
    const byStatus = {
      ativa: featuredJobs.filter(j => j.status === 'ativa'),
      expirada: featuredJobs.filter(j => j.status === 'expirada'),
      archived: featuredJobs.filter(j => j.status === 'archived'),
      pending_contact: featuredJobs.filter(j => j.status === 'pending_contact'),
      outros: featuredJobs.filter(j => !['ativa', 'expirada', 'archived', 'pending_contact'].includes(j.status))
    };

    return Response.json({
      success: true,
      total_featured: featuredJobs.length,
      by_status: {
        ativa: byStatus.ativa.length,
        expirada: byStatus.expirada.length,
        archived: byStatus.archived.length,
        pending_contact: byStatus.pending_contact.length,
        outros: byStatus.outros.length
      },
      sample_ativas: byStatus.ativa.slice(0, 10).map(j => ({
        id: j.id,
        title: j.title,
        city: j.city,
        status: j.status,
        is_featured: j.is_featured,
        created_date: j.created_date
      })),
      sample_expiradas: byStatus.expirada.slice(0, 5).map(j => ({
        id: j.id,
        title: j.title,
        status: j.status
      }))
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});