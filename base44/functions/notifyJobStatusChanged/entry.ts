import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type !== 'update') return Response.json({ ok: true });

    const job = data;
    const oldJob = old_data;

    if (!job || !job.title) return Response.json({ ok: true });

    // Notificar admins se vaga foi publicada
    if (oldJob?.status !== 'ativa' && job.status === 'ativa') {
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