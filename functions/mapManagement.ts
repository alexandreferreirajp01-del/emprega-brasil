import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Cache de coordenadas por cidade
const cityCache = new Map();

// Função para geocodificar usando OpenStreetMap Nominatim (free, sem API key)
async function geocodeAddress(city, state) {
  const cacheKey = `${city}-${state}`;
  
  if (cityCache.has(cacheKey)) {
    return cityCache.get(cacheKey);
  }

  try {
    const query = `${city}, ${state}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EmpregaBrasil/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Geocoding API error');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        source: 'nominatim'
      };
      
      cityCache.set(cacheKey, result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Coordenadas de fallback (centro das cidades)
const fallbackCoords = {
  'AC': { lat: -8.77, lon: -70.55 }, // Rio Branco
  'AL': { lat: -9.66, lon: -35.73 }, // Maceió
  'AP': { lat: 0.034934, lon: -51.066 }, // Macapá
  'AM': { lat: -3.12, lon: -60.02 }, // Manaus
  'BA': { lat: -12.97, lon: -38.51 }, // Salvador
  'CE': { lat: -3.71, lon: -38.54 }, // Fortaleza
  'DF': { lat: -15.83, lon: -47.86 }, // Brasília
  'ES': { lat: -20.32, lon: -40.34 }, // Vitória
  'GO': { lat: -16.68, lon: -49.25 }, // Goiânia
  'MA': { lat: -2.53, lon: -44.30 }, // São Luís
  'MT': { lat: -15.60, lon: -56.10 }, // Cuiabá
  'MS': { lat: -20.51, lon: -54.54 }, // Campo Grande
  'MG': { lat: -19.92, lon: -43.94 }, // Belo Horizonte
  'PA': { lat: -1.46, lon: -48.50 }, // Belém
  'PB': { lat: -7.12, lon: -34.86 }, // João Pessoa
  'PR': { lat: -25.42, lon: -49.27 }, // Curitiba
  'PE': { lat: -8.05, lon: -34.90 }, // Recife
  'PI': { lat: -5.09, lon: -42.80 }, // Teresina
  'RJ': { lat: -22.91, lon: -43.17 }, // Rio de Janeiro
  'RN': { lat: -5.79, lon: -35.21 }, // Natal
  'RS': { lat: -30.03, lon: -51.23 }, // Porto Alegre
  'RO': { lat: -8.76, lon: -63.90 }, // Porto Velho
  'RR': { lat: 2.82, lon: -60.67 }, // Boa Vista
  'SC': { lat: -27.59, lon: -48.55 }, // Florianópolis
  'SP': { lat: -23.55, lon: -46.63 }, // São Paulo
  'SE': { lat: -10.95, lon: -37.07 }, // Aracaju
  'TO': { lat: -10.25, lon: -48.25 }  // Palmas
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, mode, jobIds } = await req.json();

    // Action: Stats
    if (action === 'stats') {
      const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
      const activeJobs = allJobs.filter(j => j.status === 'ativa');
      
      const stats = {
        total: allJobs.length,
        ativas: activeJobs.length,
        ativasComCoords: activeJobs.filter(j => 
          j.latitude && j.longitude && 
          j.latitude !== 0 && j.longitude !== 0
        ).length,
        ativasSemCoords: activeJobs.filter(j => 
          !j.latitude || !j.longitude || 
          j.latitude === 0 || j.longitude === 0
        ).length,
        coordsInvalidas: activeJobs.filter(j => 
          j.latitude === 0 && j.longitude === 0
        ).length,
        semCidade: activeJobs.filter(j => !j.city || !j.state).length,
        expiradas: allJobs.filter(j => j.status === 'expirada').length
      };

      const jobsWithoutCoords = activeJobs.filter(j => 
        !j.latitude || !j.longitude || 
        j.latitude === 0 || j.longitude === 0
      );

      return Response.json({
        success: true,
        stats,
        jobsWithoutCoords: jobsWithoutCoords.map(j => ({
          id: j.id,
          title: j.title,
          company: j.company,
          city: j.city,
          state: j.state,
          latitude: j.latitude,
          longitude: j.longitude
        }))
      });
    }

    // Action: Geocode
    if (action === 'geocode') {
      let jobsToGeocode = [];
      
      if (mode === 'all') {
        const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
        jobsToGeocode = allJobs.filter(j => 
          j.status === 'ativa' && 
          (!j.latitude || !j.longitude || j.latitude === 0 || j.longitude === 0)
        );
      } else if (mode === 'selected' && jobIds?.length > 0) {
        for (const id of jobIds) {
          try {
            const job = await base44.asServiceRole.entities.Job.get(id);
            if (job) jobsToGeocode.push(job);
          } catch (err) {
            console.error(`Erro ao buscar job ${id}:`, err);
          }
        }
      }

      let successCount = 0;
      let fallbackCount = 0;
      let failCount = 0;

      for (const job of jobsToGeocode) {
        try {
          let coords = null;

          // Tentar geocodificar se tiver cidade e estado
          if (job.city && job.state) {
            coords = await geocodeAddress(job.city, job.state);
            
            // Delay para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Fallback: usar coordenadas do centro do estado
          if (!coords && job.state) {
            const fallback = fallbackCoords[job.state];
            if (fallback) {
              coords = {
                latitude: fallback.lat,
                longitude: fallback.lon,
                source: 'fallback'
              };
              fallbackCount++;
            }
          }

          // Atualizar se encontrou coordenadas
          if (coords) {
            await base44.asServiceRole.entities.Job.update(job.id, {
              latitude: coords.latitude,
              longitude: coords.longitude
            });
            
            if (coords.source === 'nominatim') {
              successCount++;
            }
          } else {
            failCount++;
          }

        } catch (err) {
          console.error(`Erro ao geocodificar ${job.id}:`, err);
          failCount++;
        }
      }

      return Response.json({
        success: true,
        message: `Geocodificação concluída: ${successCount} precisas, ${fallbackCount} fallback, ${failCount} falhas`,
        successCount,
        fallbackCount,
        failCount,
        totalProcessed: jobsToGeocode.length
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Map management error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});