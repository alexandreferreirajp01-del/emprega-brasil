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
            updateData = { status: 'ativa', exibir_no_mapa: true };
            break;
          case 'delete':
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