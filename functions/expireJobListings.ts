import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Apenas admin pode executar
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[expireJobListings] Iniciando verificação de vagas expiradas em ${now.toISOString()}`);

    // Buscar todas as vagas com status 'ativa'
    const activeJobs = await base44.asServiceRole.entities.Job.filter({ status: 'ativa' }, '-created_date', 1000);
    
    if (!activeJobs || activeJobs.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Nenhuma vaga ativa encontrada',
        expiredCount: 0,
        timestamp: now.toISOString()
      });
    }

    let expiredCount = 0;
    const expiredJobs = [];

    // Verificar cada vaga
    for (const job of activeJobs) {
      if (!job.expiration_date) {
        console.warn(`[expireJobListings] Vaga ${job.id} sem data de expiração, pulando`);
        continue;
      }

      const expirationDate = new Date(job.expiration_date);

      // Se a data de expiração é <= agora, marcar como expirada
      if (expirationDate <= now) {
        try {
          await base44.asServiceRole.entities.Job.update(job.id, {
            status: 'expirada',
            excluida_auto: true
          });
          
          expiredJobs.push({
            id: job.id,
            title: job.title,
            company: job.company,
            expirationDate: job.expiration_date
          });
          
          expiredCount++;
          console.log(`[expireJobListings] Vaga ${job.id} (${job.title}) marcada como expirada`);
        } catch (err) {
          console.error(`[expireJobListings] Erro ao expirar vaga ${job.id}:`, err.message);
        }
      }
    }

    console.log(`[expireJobListings] Processo concluído: ${expiredCount} vagas expiradas`);

    return Response.json({ 
      success: true, 
      message: `${expiredCount} vagas marcadas como expiradas`,
      expiredCount,
      expiredJobs,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('[expireJobListings] Erro geral:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});