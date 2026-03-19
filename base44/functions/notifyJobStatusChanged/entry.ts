import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = "BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q";
const VAPID_PRIVATE_KEY = "3jK8_LCcooMHF3xjb8sSjT3u5qXkwkdmewCzTolOjDA";
const VAPID_EMAIL = 'mailto:alexandreferreirajp01@gmail.com';
const APP_URL = 'https://vagasabertasparaiba.info';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Esta função é disparada pela automação de entidade Job (evento: update)
// Objetivo: quando vaga muda de pending_review → ativa, notificar TODOS os usuários no sininho + push

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event?.type !== 'update') return Response.json({ ok: true });

    const job = data;
    const oldJob = old_data;

    if (!job || !job.title) return Response.json({ ok: true });

    const newStatus = job.status;
    const oldStatus = oldJob?.status;

    console.log(`[notifyJobStatusChanged] ${job.title}: ${oldStatus} → ${newStatus}`);

    // ── Caso 1: Vaga APROVADA (pending_review/hidden/draft → ativa) ──────────────
    if (newStatus === 'ativa' && oldStatus && oldStatus !== 'ativa') {
      const jobId = event.entity_id || job.id;
      const isHomeOffice = job.work_mode === 'Remoto' || job.is_remote === true;
      const jobUrl = `${APP_URL}/JobDetail?id=${jobId}`;

      const title = `🚨 Nova vaga disponível!`;
      const body = `${job.title}${job.company ? ` · ${job.company}` : ''}${job.city ? ` · ${job.city}` : ''}. Clique e candidate-se agora!`;

      // 1. Notificação global no sininho (clicável, redireciona para a vaga)
      await base44.asServiceRole.entities.Notification.create({
        title,
        message: body,
        type: 'job',
        reference_type: 'job',
        reference_id: jobId,
        job_id: jobId,
        redirect_page: 'JobDetail',
        redirect_params: { id: jobId },
        sent_to_all: true,
        is_read: false
      });

      console.log(`[notifyJobStatusChanged] Notificação global criada para vaga ${jobId}`);

      // 2. Push notification para todos os inscritos
      const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ is_active: true }, '-created_date', 10000).catch(() => []);
      const pushPayload = JSON.stringify({
        title,
        body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        url: jobUrl,
        data: { url: jobUrl },
        timestamp: Date.now()
      });

      const failedSubs = [];
      const BATCH = 50;
      for (let i = 0; i < subscriptions.length; i += BATCH) {
        const batch = subscriptions.slice(i, i + BATCH);
        await Promise.allSettled(
          batch.map(async (sub) => {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                pushPayload
              );
            } catch (e) {
              if (e.statusCode === 404 || e.statusCode === 410) failedSubs.push(sub.id);
            }
          })
        );
      }

      if (failedSubs.length > 0) {
        await Promise.allSettled(failedSubs.map(id => base44.asServiceRole.entities.PushSubscription.delete(id)));
      }

      console.log(`[notifyJobStatusChanged] Push enviado para ${subscriptions.length} subs. ${failedSubs.length} inválidas removidas.`);

      // 3. Notificar admins sobre a aprovação
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }).catch(() => []);
      await Promise.allSettled(admins.map(admin =>
        base44.asServiceRole.entities.Notification.create({
          title: `✅ Vaga publicada`,
          message: `${job.title}${job.city ? ` em ${job.city}` : ''} — foi aprovada e está no ar`,
          type: 'admin',
          reference_type: 'job',
          reference_id: jobId,
          job_id: jobId,
          user_email: admin.email,
          redirect_page: 'JobDetail',
          redirect_params: { id: jobId },
          is_read: false
        })
      ));
    }

    // ── Caso 2: Vaga EXPIRADA ─────────────────────────────────────────────────────
    if (newStatus === 'expirada' && oldStatus === 'ativa') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }).catch(() => []);
      await Promise.allSettled(admins.map(admin =>
        base44.asServiceRole.entities.Notification.create({
          title: `⏰ Vaga expirada`,
          message: `${job.title}${job.company ? ` · ${job.company}` : ''} foi marcada como expirada`,
          type: 'admin',
          reference_type: 'job',
          reference_id: event.entity_id || job.id,
          user_email: admin.email,
          redirect_page: 'GerenciarVagas',
          redirect_params: {},
          is_read: false
        })
      ));
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyJobStatusChanged]', error.message);
    return Response.json({ ok: true });
  }
});