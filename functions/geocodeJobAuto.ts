import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Coordenadas de fallback por estado (capitais)
const fallbackCoords = {
  'AC': { lat: -8.77, lon: -70.55 }, 'AL': { lat: -9.66, lon: -35.73 },
  'AP': { lat: 0.034934, lon: -51.066 }, 'AM': { lat: -3.12, lon: -60.02 },
  'BA': { lat: -12.97, lon: -38.51 }, 'CE': { lat: -3.71, lon: -38.54 },
  'DF': { lat: -15.83, lon: -47.86 }, 'ES': { lat: -20.32, lon: -40.34 },
  'GO': { lat: -16.68, lon: -49.25 }, 'MA': { lat: -2.53, lon: -44.30 },
  'MT': { lat: -15.60, lon: -56.10 }, 'MS': { lat: -20.51, lon: -54.54 },
  'MG': { lat: -19.92, lon: -43.94 }, 'PA': { lat: -1.46, lon: -48.50 },
  'PB': { lat: -7.12, lon: -34.86 }, 'PR': { lat: -25.42, lon: -49.27 },
  'PE': { lat: -8.05, lon: -34.90 }, 'PI': { lat: -5.09, lon: -42.80 },
  'RJ': { lat: -22.91, lon: -43.17 }, 'RN': { lat: -5.79, lon: -35.21 },
  'RS': { lat: -30.03, lon: -51.23 }, 'RO': { lat: -8.76, lon: -63.90 },
  'RR': { lat: 2.82, lon: -60.67 }, 'SC': { lat: -27.59, lon: -48.55 },
  'SP': { lat: -23.55, lon: -46.63 }, 'SE': { lat: -10.95, lon: -37.07 },
  'TO': { lat: -10.25, lon: -48.25 }
};

async function geocodeCity(city, state) {
  try {
    const query = `${city}, ${state}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EmpregaBrasil/1.0' }
    });

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é chamada de automação (entity event)
    const payload = await req.json();
    
    // Se for automação, processar apenas essa vaga
    if (payload?.event?.type === 'create' && payload?.event?.entity_id) {
      const jobId = payload.event.entity_id;
      console.log(`🔄 Automação: Geocodificando vaga ${jobId}`);
      
      const job = await base44.asServiceRole.entities.Job.get(jobId);
      
      // Verificar se já tem coordenadas válidas
      if (job.latitude && job.longitude && job.latitude !== 0 && job.longitude !== 0) {
        console.log(`✅ Vaga ${jobId} já tem coordenadas`);
        return Response.json({ success: true, message: 'Job already has coordinates' });
      }

      let coords = null;

      // Tentar geocodificar se tiver cidade e estado
      if (job.city && job.state) {
        coords = await geocodeCity(job.city, job.state);
      }

      // Fallback para centro do estado
      if (!coords && job.state && fallbackCoords[job.state]) {
        const fb = fallbackCoords[job.state];
        coords = { latitude: fb.lat, longitude: fb.lon };
        console.log(`⚠️ Usando fallback para ${job.state}`);
      }

      // Atualizar se encontrou coordenadas
      if (coords) {
        await base44.asServiceRole.entities.Job.update(jobId, {
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        console.log(`✅ Vaga ${jobId} geocodificada: ${coords.latitude}, ${coords.longitude}`);
        return Response.json({ success: true, coordinates: coords });
      }

      console.log(`❌ Não foi possível geocodificar vaga ${jobId}`);
      return Response.json({ success: false, message: 'Could not geocode' });
    }

    // Se não for automação, exige autenticação admin
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔄 Modo manual: Geocodificando todas as vagas sem coordenadas');

    // Buscar todas as vagas ativas sem coordenadas
    const jobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    
    const jobsToGeocode = jobs.filter(j => 
      j.status === 'ativa' && 
      j.city && 
      j.state && 
      (!j.latitude || !j.longitude || j.latitude === 0 || j.longitude === 0)
    );

    let successCount = 0;
    let fallbackCount = 0;
    let failCount = 0;

    for (const job of jobsToGeocode) {
      try {
        let coords = null;

        // Tentar geocodificar
        if (job.city && job.state) {
          coords = await geocodeCity(job.city, job.state);
        }

        // Fallback para centro do estado
        if (!coords && job.state && fallbackCoords[job.state]) {
          const fb = fallbackCoords[job.state];
          coords = { latitude: fb.lat, longitude: fb.lon };
          fallbackCount++;
        }

        // Atualizar se encontrou coordenadas
        if (coords) {
          await base44.asServiceRole.entities.Job.update(job.id, {
            latitude: coords.latitude,
            longitude: coords.longitude
          });
          
          if (!fallbackCount) successCount++;
        } else {
          failCount++;
        }

        // Rate limiting - 1 request/sec
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failCount++;
        console.error(`Erro ao geocodificar ${job.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      totalJobs: jobsToGeocode.length,
      successCount,
      fallbackCount,
      failCount,
      message: `✅ ${successCount} geocodificadas | ⚠️ ${fallbackCount} fallback | ❌ ${failCount} falhas`
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});