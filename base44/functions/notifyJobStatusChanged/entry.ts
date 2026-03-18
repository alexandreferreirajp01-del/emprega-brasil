import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type !== 'update') return Response.json({ ok: true });

    const job = data;
    const oldJob = old_data;

    if (!job || !job.title) return Response.json({ ok: true });

    // Notificar admins e usuários se vaga foi aprovada
    if (oldJob?.status !== 'ativa' && job.status === 'ativa') {
      // Notificar ADMINS
      const admins = await base44.asServiceRole.entities.User.filter(
        { role: 'admin' }
      ).catch(() => []);

      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          title: '✅ Vaga Publicada',
          message: `"${job.title}" foi publicada`,
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

      // Notificar USUÁRIOS sobre vaga aprovada
      const users = await base44.asServiceRole.entities.User.list('-created_date', 5000)
        .catch(() => []);

      for (const user of users) {
        if (user.role === 'admin') continue; // Skip admins
        
        await base44.asServiceRole.entities.Notification.create({
          title: '✨ Nova Vaga Aprovada!',
          message: `${job.title} em ${job.city || 'Local não informado'}`,
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

    // Notificar se vaga foi expirada
    if (oldJob?.status !== 'expirada' && job.status === 'expirada') {
      const admins = await base44.asServiceRole.entities.User.filter(
        { role: 'admin' }
      ).catch(() => []);

      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          title: '⏰ Vaga Expirada',
          message: `"${job.title}" expirou`,
          type: 'system',
          reference_type: 'job',
          reference_id: job.id,
          job_id: job.id,
          user_email: admin.email,
          is_read: false
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyJobStatusChanged]', error);
    return Response.json({ ok: true });
  }
});