import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Geocoding automático com fallback para coordenadas da cidade
async function geocodeLocation(city, state, neighborhood, address) {
  try {
    // Tentar com endereço completo primeiro
    let searchQuery = '';
    if (address && address.trim()) {
      searchQuery = `${address}, ${city}, ${state}, Brasil`;
    } else if (neighborhood && neighborhood.trim()) {
      searchQuery = `${neighborhood}, ${city}, ${state}, Brasil`;
    } else {
      searchQuery = `${city}, ${state}, Brasil`;
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EmpregaBrasilPlus/1.0' }
    });

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        success: true
      };
    }

    // Fallback: usar só cidade se falhou com bairro/endereço
    if (neighborhood || address) {
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${city}, ${state}, Brasil`)}&format=json&limit=1`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'EmpregaBrasilPlus/1.0' }
      });
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData && fallbackData.length > 0) {
        return {
          latitude: parseFloat(fallbackData[0].lat),
          longitude: parseFloat(fallbackData[0].lon),
          success: true,
          fallback: true
        };
      }
    }

    return { success: false, error: 'Localização não encontrada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar TODAS vagas ativas sem coordenadas
    const jobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    
    const jobsToGeocode = jobs.filter(j => 
      j.status === 'ativa' && 
      j.city && 
      j.state && 
      (!j.latitude || !j.longitude || isNaN(j.latitude) || isNaN(j.longitude))
    );

    let successCount = 0;
    let fallbackCount = 0;
    let failCount = 0;
    const errors = [];

    for (const job of jobsToGeocode) {
      try {
        const result = await geocodeLocation(
          job.city, 
          job.state, 
          job.neighborhood, 
          job.additional_info // pode ter endereço aqui
        );

        if (result.success) {
          await base44.asServiceRole.entities.Job.update(job.id, {
            latitude: result.latitude,
            longitude: result.longitude
          });

          if (result.fallback) {
            fallbackCount++;
          } else {
            successCount++;
          }
        } else {
          failCount++;
          errors.push(`${job.title} (${job.city}/${job.state}) - ${result.error}`);
        }

        // Rate limiting - 1 request/sec para respeitar Nominatim
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failCount++;
        errors.push(`${job.title} - ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      totalJobs: jobsToGeocode.length,
      successCount,
      fallbackCount,
      failCount,
      errors: errors.slice(0, 20),
      message: `✅ ${successCount} geocodificadas | ⚠️ ${fallbackCount} fallback | ❌ ${failCount} falhas`
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});