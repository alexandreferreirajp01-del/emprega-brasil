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
    const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                   user.role === 'admin' || 
                   user.subscription_type === 'admin';
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('🔧 Iniciando correção de created_at nas vagas...');

    // Buscar todas as vagas
    const allJobs = await base44.asServiceRole.entities.Job.list('id', 10000);
    
    let fixed = 0;
    let alreadyOk = 0;
    let errors = 0;

    for (const job of allJobs) {
      try {
        // Verificar se created_at está válido
        if (!job.created_at) {
          // Usar published_at, updated_at ou created_date como fallback
          const fallbackDate = job.published_at || job.updated_at || job.created_date || new Date().toISOString();
          
          await base44.asServiceRole.entities.Job.update(job.id, {
            created_at: fallbackDate
          });
          
          fixed++;
          console.log(`✅ Vaga ${job.id} corrigida: ${fallbackDate}`);
        } else {
          alreadyOk++;
        }
      } catch (error) {
        errors++;
        console.error(`❌ Erro na vaga ${job.id}:`, error.message);
      }
    }

    const summary = {
      success: true,
      total: allJobs.length,
      fixed,
      alreadyOk,
      errors,
      message: `Migração concluída: ${fixed} vagas corrigidas, ${alreadyOk} já estavam OK, ${errors} erros`
    };

    console.log('📊 Resumo:', summary);

    return Response.json(summary);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});