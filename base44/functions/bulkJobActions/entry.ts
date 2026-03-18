import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { jobIds, action } = await req.json();

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return Response.json({ error: 'IDs de vagas inválidos' }, { status: 400 });
    }

    let updated = 0;
    const errors = [];

    for (const jobId of jobIds) {
      try {
        const job = await base44.asServiceRole.entities.Job.get(jobId);
        
        let updateData = {};
        
        switch (action) {
          case 'hide':
            updateData = { status: 'hidden', exibir_no_mapa: false };
            break;
          case 'activate':
            updateData = { status: 'ativa', exibir_no_mapa: true, published_at: new Date().toISOString() };
            break;
          case 'delete':
            // Apagar favoritos relacionados à vaga
            try {
              const favoriteJobs = await base44.asServiceRole.entities.FavoriteJob.filter({ job_id: jobId });
              for (const fav of favoriteJobs) {
                await base44.asServiceRole.entities.FavoriteJob.delete(fav.id);
              }
            } catch (e) {
              console.log(`Aviso ao apagar favoritos da vaga ${jobId}:`, e.message);
            }
            
            // Apagar visualizações relacionadas à vaga
            try {
              const jobViews = await base44.asServiceRole.entities.JobView.filter({ job_id: jobId });
              for (const view of jobViews) {
                await base44.asServiceRole.entities.JobView.delete(view.id);
              }
            } catch (e) {
              console.log(`Aviso ao apagar visualizações da vaga ${jobId}:`, e.message);
            }

            // Apagar histórico de visualizações relacionado à vaga
            try {
              const viewHistory = await base44.asServiceRole.entities.ViewHistory.filter({ job_id: jobId });
              for (const historyItem of viewHistory) {
                await base44.asServiceRole.entities.ViewHistory.delete(historyItem.id);
              }
            } catch (e) {
              console.log(`Aviso ao apagar histórico da vaga ${jobId}:`, e.message);
            }

            // Finalmente, apagar a vaga em si
            await base44.asServiceRole.entities.Job.delete(jobId);
            updated++;
            continue;
          case 'reprocess':
            updateData = { 
              geocode_status: 'pending',
              needs_review: false
            };
            break;
          case 'mark_remote':
            updateData = {
              is_remote: true,
              work_mode: 'Remoto',
              geocode_status: 'remote',
              exibir_no_mapa: false
            };
            break;
          default:
            continue;
        }

        await base44.asServiceRole.entities.Job.update(jobId, updateData);
        
        // Se foi ativada, enviar notificações
        if (action === 'activate') {
          try {
            const updatedJob = await base44.asServiceRole.entities.Job.get(jobId);
            await base44.asServiceRole.functions.invoke('createNotification', {
              title: '✨ Nova Vaga Aprovada!',
              message: `${updatedJob.title} em ${updatedJob.city || 'local não informado'}`,
              type: 'job',
              reference_type: 'job',
              reference_id: updatedJob.id,
              job_id: updatedJob.id,
              sent_to_all: true,
              redirect_page: 'JobDetail',
              redirect_params: { id: updatedJob.id }
            });
          } catch (notifyErr) {
            console.error('Erro ao notificar vaga ativada:', notifyErr);
          }
        }
        
        updated++;
      } catch (err) {
        errors.push({ jobId, error: err.message });
      }
    }

    return Response.json({
      success: true,
      updated,
      total: jobIds.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});