import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const job = data;
    if (!job || !job.title) return Response.json({ ok: true });

    // Notificar ADMINS sobre TODA vaga criada
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    ).catch(() => []);

    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        title: '💼 Nova Vaga Criada',
        message: `${job.title} em ${job.city || 'Local não informado'}`,
        type: 'job',
        reference_type: 'job',
        reference_id: job.id,
        job_id: job.id,
        user_email: admin.email,
        redirect_page: 'JobDetail',
        redirect_params: { id: job.id },
        is_read: false
      });
    }

    // Notificar USUÁRIOS sobre vagas ativas
    if (job.status === 'ativa') {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 5000)
        .catch(() => []);

      for (const user of users) {
        if (user.email === 'admin@example.com') continue; // Skip admins
        
        await base44.asServiceRole.entities.Notification.create({
          title: '✨ Nova Vaga!',
          message: `${job.title} em ${job.city}`,
          type: 'job',
          reference_type: 'job',
          reference_id: job.id,
          job_id: job.id,
          user_email: user.email,
          redirect_page: 'JobDetail',
          redirect_params: { id: job.id },
          is_read: false
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyJobCreated]', error);
    return Response.json({ ok: true });
  }
});