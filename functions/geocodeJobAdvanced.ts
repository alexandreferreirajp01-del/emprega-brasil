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

// Fallback por estado
const stateCoords = {
  'PB': { lat: -7.12, lon: -34.86 },
  'PE': { lat: -8.05, lon: -34.90 },
  'RN': { lat: -5.79, lon: -35.21 },
  'CE': { lat: -3.71, lon: -38.54 },
  'AL': { lat: -9.66, lon: -35.73 }
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
  if (locationType === 'CIDADE') return `${city}|${state}`;
  if (locationType === 'BAIRRO' && neighborhood) return `${neighborhood}|${city}|${state}`;
  if (locationType === 'EXATA' && coords) {
    return `${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`;
  }
  return `${city}|${state}`;
}

async function geocodeJob(job) {
  let coords = null;
  let precision = 'CIDADE';
  let source = 'GEOCODING';

  // Caso REMOTO: sem coordenadas
  if (job.locationType === 'REMOTO') {
    return {
      latitude: null,
      longitude: null,
      geoStatus: 'OK',
      geoSource: 'MANUAL',
      geoPrecision: null,
      locationKey: 'REMOTO'
    };
  }

  // Caso EXATA: tentar endereço completo
  if (job.locationType === 'EXATA' && job.addressText) {
    const query = `${job.addressText}, ${job.city}, ${job.state}, Brasil`;
    coords = await geocodeAddress(query);
    if (coords) {
      precision = 'EXATA';
    }
    await new Promise(r => setTimeout(r, 1000)); // Rate limit
  }

  // Caso BAIRRO: tentar bairro
  if (!coords && job.locationType === 'BAIRRO' && job.neighborhood) {
    const query = `${job.neighborhood}, ${job.city}, ${job.state}, Brasil`;
    coords = await geocodeAddress(query);
    if (coords) {
      precision = 'BAIRRO';
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Caso CIDADE ou fallback: tentar cidade
  if (!coords && job.city && job.state) {
    const query = `${job.city}, ${job.state}, Brasil`;
    coords = await geocodeAddress(query);
    if (coords) {
      precision = 'CIDADE';
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Fallback 1: coordenadas fixas da Paraíba
  if (!coords && job.state === 'PB' && pbCitiesCoords[job.city]) {
    coords = pbCitiesCoords[job.city];
    source = 'FALLBACK';
    precision = 'CIDADE';
  }

  // Fallback 2: capital do estado
  if (!coords && stateCoords[job.state]) {
    coords = stateCoords[job.state];
    source = 'FALLBACK';
    precision = 'CIDADE';
  }

  // Fallback final: João Pessoa
  if (!coords) {
    coords = pbCitiesCoords['João Pessoa'];
    source = 'FALLBACK';
    precision = 'CIDADE';
  }

  const locationKey = generateLocationKey(
    job.locationType, 
    job.city, 
    job.state, 
    job.neighborhood, 
    coords
  );

  return {
    latitude: coords.lat || coords.latitude,
    longitude: coords.lon || coords.longitude,
    geoStatus: 'OK',
    geoSource: source,
    geoPrecision: precision,
    locationKey
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Modo automação: geocodificar vaga específica
    if (payload?.event?.entity_id) {
      const jobId = payload.event.entity_id;
      const job = await base44.asServiceRole.entities.Job.get(jobId);

      if (!job.showOnMap) {
        console.log(`Vaga ${jobId} não será exibida no mapa`);
        return Response.json({ success: true, message: 'Job not shown on map' });
      }

      const result = await geocodeJob(job);
      await base44.asServiceRole.entities.Job.update(jobId, result);

      console.log(`✅ Vaga ${jobId} geocodificada: ${result.geoSource} - ${result.geoPrecision}`);
      return Response.json({ success: true, result });
    }

    // Modo manual: admin geocodifica todas
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { mode, jobIds } = payload;

    let jobsToGeocode = [];
    if (mode === 'all') {
      const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
      jobsToGeocode = allJobs.filter(j => 
        j.status === 'ativa' && 
        j.showOnMap !== false &&
        (j.geoStatus !== 'OK' || !j.latitude || !j.longitude)
      );
    } else if (mode === 'selected' && jobIds?.length > 0) {
      for (const id of jobIds) {
        const job = await base44.asServiceRole.entities.Job.get(id);
        if (job) jobsToGeocode.push(job);
      }
    }

    let success = 0, failed = 0;
    for (const job of jobsToGeocode) {
      try {
        const result = await geocodeJob(job);
        await base44.asServiceRole.entities.Job.update(job.id, result);
        success++;
      } catch (err) {
        console.error(`Erro geocodificando ${job.id}:`, err);
        failed++;
      }
    }

    return Response.json({
      success: true,
      message: `✅ ${success} geocodificadas, ❌ ${failed} falhas`,
      total: jobsToGeocode.length,
      successCount: success,
      failCount: failed
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});