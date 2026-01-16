import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔄 Iniciando migração de vagas antigas...');

    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    const activeJobs = allJobs.filter(j => j.status === 'ativa');

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of activeJobs) {
      try {
        // Pular se já tem tudo configurado
        if (job.showOnMap !== undefined && job.locationType && job.geoStatus === 'OK') {
          skipped++;
          continue;
        }

        // Definir valores padrão
        const updates = {
          showOnMap: job.showOnMap ?? true,
          geoStatus: job.geoStatus || 'PENDENTE'
        };

        // Determinar tipo de localização
        if (job.addressText) {
          updates.locationType = 'EXATA';
        } else if (job.neighborhood) {
          updates.locationType = 'BAIRRO';
        } else {
          updates.locationType = 'CIDADE';
        }

        // Se não tem coordenadas válidas, marcar para geocodificação
        if (!job.latitude || !job.longitude || job.latitude === 0 || job.longitude === 0) {
          updates.geoStatus = 'PENDENTE';
          updates.latitude = null;
          updates.longitude = null;
        } else {
          // Tem coordenadas, marcar como OK
          updates.geoStatus = 'OK';
          updates.geoSource = updates.geoSource || 'FALLBACK';
          updates.geoPrecision = updates.geoPrecision || updates.locationType;
          
          // Gerar locationKey
          if (updates.locationType === 'CIDADE') {
            updates.locationKey = `${job.city}|${job.state}`;
          } else if (updates.locationType === 'BAIRRO' && job.neighborhood) {
            updates.locationKey = `${job.neighborhood}|${job.city}|${job.state}`;
          } else if (updates.locationType === 'EXATA') {
            updates.locationKey = `${job.latitude.toFixed(5)},${job.longitude.toFixed(5)}`;
          }
        }

        await base44.asServiceRole.entities.Job.update(job.id, updates);
        updated++;

      } catch (err) {
        console.error(`Erro ao migrar ${job.id}:`, err);
        failed++;
      }
    }

    // Agora geocodificar as pendentes
    console.log('🔄 Geocodificando vagas pendentes...');
    const response = await base44.functions.invoke('geocodeJobAdvanced', {
      mode: 'all'
    });

    return Response.json({
      success: true,
      message: `✅ Migração concluída: ${updated} atualizadas, ${skipped} já OK, ${failed} falhas`,
      stats: {
        totalActive: activeJobs.length,
        updated,
        skipped,
        failed
      },
      geocodingResult: response.data
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});