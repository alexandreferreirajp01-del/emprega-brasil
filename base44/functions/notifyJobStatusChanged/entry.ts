import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type !== 'update') return Response.json({ ok: true });

    const job = data;
    const oldJob = old_data;

    if (!job || !job.title) return Response.json({ ok: true });

    // Notificar se vaga foi aprovada (status mudou para 'ativa')
    if (oldJob?.status !== 'ativa' && job.status === 'ativa') {
      // UMA notificação global (sent_to_all) — sem loop por usuário
      await base44.asServiceRole.entities.Notification.create({
        title: '🚨 Nova Vaga Disponível!',
        message: `${job.title}${job.company ? ` · ${job.company}` : ''}${job.city ? ` em ${job.city}` : ''}`,
        type: 'job',
        reference_type: 'job',
        reference_id: job.id,
        job_id: job.id,
        sent_to_all: true,
        redirect_page: 'JobDetail',
        redirect_params: { id: job.id },
        is_read: false
      });

      console.log(`[notifyJobStatusChanged] ✅ Notificação global criada para vaga: ${job.title}`);
    }

    // Notificar admins se vaga expirou
    if (oldJob?.status !== 'expirada' && job.status === 'expirada') {
      await base44.asServiceRole.entities.Notification.create({
        title: '⏰ Vaga Expirada',
        message: `"${job.title}" expirou automaticamente`,
        type: 'system',
        reference_type: 'job',
        reference_id: job.id,
        job_id: job.id,
        sent_to_all: false,
        user_email: 'alexandreferreirajp01@gmail.com',
        is_read: false
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyJobStatusChanged]', error.message);
    return Response.json({ ok: true });
  }
});