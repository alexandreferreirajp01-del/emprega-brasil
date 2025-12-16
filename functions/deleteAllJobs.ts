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
    
    let deleted = 0;

    // Deletar todas as vagas
    for (const job of allJobs) {
      try {
        await base44.asServiceRole.entities.Job.delete(job.id);
        deleted++;
      } catch (e) {
        console.error(`Erro ao deletar vaga ${job.id}:`, e);
      }
    }

    return Response.json({
      success: true,
      message: `${deleted} vagas deletadas com sucesso`,
      deleted,
      total: allJobs.length
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});