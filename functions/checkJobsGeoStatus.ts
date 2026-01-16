import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Buscar TODAS as vagas
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    
    const stats = {
      total: allJobs.length,
      ativas: 0,
      ativasComCoords: 0,
      ativasSemCoords: 0,
      expiradas: 0,
      semCidade: 0,
      coordsInvalidas: 0,
      samples: {
        comCoords: [],
        semCoords: []
      }
    };

    allJobs.forEach(job => {
      if (job.status === 'ativa') {
        stats.ativas++;
        
        if (!job.city || !job.state) {
          stats.semCidade++;
        }
        
        const lat = job.latitude;
        const lng = job.longitude;
        
        if (lat != null && lng != null) {
          const latNum = typeof lat === 'string' ? parseFloat(lat.trim()) : parseFloat(lat);
          const lngNum = typeof lng === 'string' ? parseFloat(lng.trim()) : parseFloat(lng);
          
          if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
            stats.ativasComCoords++;
            if (stats.samples.comCoords.length < 3) {
              stats.samples.comCoords.push({
                id: job.id,
                title: job.title,
                city: job.city,
                lat: latNum,
                lng: lngNum
              });
            }
          } else {
            stats.coordsInvalidas++;
            stats.ativasSemCoords++;
            if (stats.samples.semCoords.length < 5) {
              stats.samples.semCoords.push({
                id: job.id,
                title: job.title,
                city: job.city,
                state: job.state,
                lat: job.latitude,
                lng: job.longitude
              });
            }
          }
        } else {
          stats.ativasSemCoords++;
          if (stats.samples.semCoords.length < 5) {
            stats.samples.semCoords.push({
              id: job.id,
              title: job.title,
              city: job.city,
              state: job.state,
              lat: job.latitude,
              lng: job.longitude
            });
          }
        }
      } else {
        stats.expiradas++;
      }
    });

    return Response.json({
      success: true,
      stats,
      message: `✅ ${stats.ativasComCoords} vagas com coordenadas | ❌ ${stats.ativasSemCoords} sem coordenadas`
    });

  } catch (error) {
    console.error('Check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});