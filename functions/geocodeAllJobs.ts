import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all active jobs without coordinates
    const jobs = await base44.asServiceRole.entities.Job.filter({
      status: 'ativa',
      latitude: { $exists: false }
    }, '', 1000);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const job of jobs) {
      if (!job.city || !job.state) {
        failCount++;
        continue;
      }

      try {
        let searchQuery = `${job.city}, ${job.state}, Brasil`;
        if (job.neighborhood) {
          searchQuery = `${job.neighborhood}, ${job.city}, ${job.state}, Brasil`;
        }

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': 'EmpregaBrasilPlus/1.0' }
        });

        const data = await response.json();

        if (data && data.length > 0) {
          const location = data[0];
          
          await base44.asServiceRole.entities.Job.update(job.id, {
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon)
          });

          successCount++;
        } else {
          failCount++;
          errors.push(`${job.title} - Localização não encontrada`);
        }

        // Rate limiting - 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failCount++;
        errors.push(`${job.title} - ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      totalJobs: jobs.length,
      successCount,
      failCount,
      errors: errors.slice(0, 10) // Only first 10 errors
    });

  } catch (error) {
    console.error('Batch geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});