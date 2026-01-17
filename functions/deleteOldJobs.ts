import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { days } = await req.json();
    
    if (!days || days < 1) {
      return Response.json({ error: 'Dias inválidos' }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allJobs = await base44.asServiceRole.entities.Job.list('', 10000);
    const oldJobs = allJobs.filter(job => {
      const createdDate = new Date(job.created_date);
      return createdDate < cutoffDate;
    });

    let deleted = 0;
    for (const job of oldJobs) {
      try {
        await base44.asServiceRole.entities.Job.delete(job.id);
        deleted++;
      } catch (err) {
        console.error(`Erro ao excluir vaga ${job.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      message: `${deleted} vagas excluídas`,
      deleted,
      total: oldJobs.length
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});