import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { jobId, city, state, neighborhood } = await req.json();

    if (!city || !state) {
      return Response.json({ error: 'Cidade e estado são obrigatórios' }, { status: 400 });
    }

    // Build search query
    let searchQuery = `${city}, ${state}, Brasil`;
    if (neighborhood) {
      searchQuery = `${neighborhood}, ${city}, ${state}, Brasil`;
    }

    // Use Nominatim (OpenStreetMap) for geocoding
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EmpregaBrasilPlus/1.0'
      }
    });

    const data = await response.json();

    if (data && data.length > 0) {
      const location = data[0];
      const latitude = parseFloat(location.lat);
      const longitude = parseFloat(location.lon);

      if (jobId) {
        // Update specific job
        await base44.asServiceRole.entities.Job.update(jobId, {
          latitude,
          longitude
        });

        return Response.json({
          success: true,
          latitude,
          longitude,
          message: 'Localização atualizada com sucesso'
        });
      } else {
        // Just return coordinates
        return Response.json({
          success: true,
          latitude,
          longitude
        });
      }
    } else {
      return Response.json({
        success: false,
        error: 'Localização não encontrada'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});