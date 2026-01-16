import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Coordenadas de fallback por cidade da Paraíba
const pbCitiesCoords = {
  'João Pessoa': { lat: -7.1195, lon: -34.845 },
  'Campina Grande': { lat: -7.2306, lon: -35.8811 },
  'Santa Rita': { lat: -7.1139, lon: -34.9781 },
  'Patos': { lat: -7.0242, lon: -37.2803 },
  'Bayeux': { lat: -7.1256, lon: -34.9322 },
  'Sousa': { lat: -6.7614, lon: -38.2275 },
  'Cajazeiras': { lat: -6.8906, lon: -38.5556 },
  'Cabedelo': { lat: -6.9811, lon: -34.8336 },
  'Guarabira': { lat: -6.8553, lon: -35.4903 },
  'Mamanguape': { lat: -6.8389, lon: -35.1253 }
};

// Fallback por estado (capitais)
const stateCoords = {
  'PB': { lat: -7.12, lon: -34.86 },
  'PE': { lat: -8.05, lon: -34.90 },
  'RN': { lat: -5.79, lon: -35.21 },
  'CE': { lat: -3.71, lon: -38.54 },
  'AL': { lat: -9.66, lon: -35.73 },
  'SE': { lat: -10.95, lon: -37.07 },
  'BA': { lat: -12.97, lon: -38.51 },
  'PI': { lat: -5.09, lon: -42.80 },
  'MA': { lat: -2.53, lon: -44.30 }
};

async function geocodeAddress(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EmpregaBrasil/1.0' }
    });
    const data = await response.json();
    if (data?.[0]) {
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

function generateLocationKey(locationType, city, state, neighborhood, coords) {
  if (locationType === 'REMOTO') return 'REMOTO';
  if (locationType === 'CIDADE' || !locationType) return `${city}|${state}`;
  if (locationType === 'BAIRRO' && neighborhood) return `${neighborhood}|${city}|${state}`;
  if (locationType === 'EXATA' && coords) {
    return `${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`;
  }
  return `${city}|${state}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🚀 Iniciando geocodificação FORÇADA de todas as vagas ativas...');

    // Buscar TODAS as vagas (sem limite)
    let allJobs = [];
    let skip = 0;
    const limit = 1000;
    
    while (true) {
      const batch = await base44.asServiceRole.entities.Job.filter(
        { status: 'ativa' },
        '-created_date',
        limit,
        skip
      );
      
      if (batch.length === 0) break;
      allJobs = allJobs.concat(batch);
      skip += batch.length;
      console.log(`📦 Carregadas ${allJobs.length} vagas até agora...`);
      
      if (batch.length < limit) break;
    }

    console.log(`📊 Total de vagas ativas no banco: ${allJobs.length}`);

    // Filtrar vagas que precisam de geocodificação
    const jobsToProcess = allJobs.filter(j => j.city && j.state);
    console.log(`📍 Vagas com cidade/estado: ${jobsToProcess.length}`);

    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < jobsToProcess.length; i++) {
      const job = jobsToProcess[i];
      
      try {
        if (i % 50 === 0) {
          console.log(`\n📊 Progresso: ${i}/${jobsToProcess.length} (${Math.round(i/jobsToProcess.length*100)}%)`);
        }
        
        let coords = null;
        let source = 'GEOCODING';
        let precision = 'CIDADE';
        const locationType = job.locationType || 'CIDADE';

        // REMOTO
        if (locationType === 'REMOTO') {
          await base44.asServiceRole.entities.Job.update(job.id, {
            latitude: null,
            longitude: null,
            geoStatus: 'OK',
            geoSource: 'MANUAL',
            geoPrecision: null,
            locationKey: 'REMOTO',
            locationType: 'REMOTO',
            showOnMap: true
          });
          success++;
          continue;
        }

        // Tentar geocoding por cidade (com timeout curto)
        try {
          const cityQuery = `${job.city}, ${job.state}, Brasil`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          coords = await geocodeAddress(cityQuery);
          clearTimeout(timeoutId);
          
          // Rate limit reduzido para acelerar
          await new Promise(r => setTimeout(r, 500));
        } catch (geoError) {
          console.log(`⚠️ Geocoding timeout para ${job.city}, usando fallback`);
        }

        // Fallback 1: Cidades PB
        if (!coords && job.state === 'PB' && pbCitiesCoords[job.city]) {
          coords = pbCitiesCoords[job.city];
          source = 'FALLBACK';
        }

        // Fallback 2: Capital do estado
        if (!coords && stateCoords[job.state]) {
          coords = stateCoords[job.state];
          source = 'FALLBACK';
        }

        // Fallback 3: João Pessoa
        if (!coords) {
          coords = pbCitiesCoords['João Pessoa'];
          source = 'FALLBACK';
        }

        const locationKey = generateLocationKey(locationType, job.city, job.state, job.neighborhood, coords);

        await base44.asServiceRole.entities.Job.update(job.id, {
          latitude: coords.lat || coords.latitude,
          longitude: coords.lon || coords.longitude,
          geoStatus: 'OK',
          geoSource: source,
          geoPrecision: precision,
          locationKey,
          locationType,
          showOnMap: true
        });

        success++;

      } catch (err) {
        failed++;
        errors.push(`${job.id}: ${err.message}`);
        console.error(`❌ Vaga ${job.id}:`, err.message);
        // Continuar mesmo com erro
        continue;
      }
    }

    const message = `
✅ GEOCODIFICAÇÃO CONCLUÍDA

📊 Estatísticas:
- Total processado: ${activeJobs.length}
- Sucesso: ${success}
- Falhas: ${failed}

${errors.length > 0 ? `\n⚠️ Erros:\n${errors.slice(0, 10).join('\n')}` : ''}
    `.trim();

    console.log(message);

    return Response.json({
      success: true,
      message,
      stats: {
        total: activeJobs.length,
        success,
        failed,
        errors: errors.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});