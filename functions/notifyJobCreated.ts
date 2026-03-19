import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Esta função é disparada pela automação de entidade Job (evento: create)
// Objetivo: notificar APENAS admins quando uma nova vaga é criada (seja qual for o status)
// A notificação para usuários é enviada pela notifyNewJob quando status muda para 'ativa'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const job = data;
    if (!job || !job.title) return Response.json({ ok: true });

    const origem = job.origem || 'manual';
    const isPending = job.status === 'pending_review';
    const isAtiva = job.status === 'ativa';

    // Ícone e label conforme origem
    const origemLabel = origem.includes('telegram') ? '🤖 Telegram Bot' :
                        origem.includes('n8n') ? '⚙️ N8N/WhatsApp' :
                        origem.includes('whatsapp') ? '📱 WhatsApp' :
                        '✏️ Manual';

    const statusLabel = isPending ? '⏳ Aguardando revisão' : isAtiva ? '✅ Ativa' : job.status;

    // Notificar ADMINS sobre toda vaga criada
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }).catch(() => []);

    await Promise.allSettled(admins.map(admin =>
      base44.asServiceRole.entities.Notification.create({
        title: isPending ? `📥 Nova vaga pendente` : `💼 Nova vaga criada`,
        message: `${job.title}${job.company ? ` · ${job.company}` : ''}${job.city ? ` · ${job.city}` : ''} — ${origemLabel} · ${statusLabel}`,
        type: 'admin',
        reference_type: 'job',
        reference_id: job.id,
        job_id: job.id,
        user_email: admin.email,
        redirect_page: isPending ? 'VagasPendentesIA' : 'JobDetail',
        redirect_params: isPending ? {} : { id: job.id },
        is_read: false
      })
    ));

    console.log(`[notifyJobCreated] Admins notificados sobre vaga ${job.id} (${origemLabel}) - status: ${job.status}`);

    // Se a vaga já foi criada como 'ativa' (ex: PostarVaga manual), notificar usuários também
    // mas NÃO para pending_review (essas são notificadas depois quando aprovadas)
    if (isAtiva) {
      await base44.asServiceRole.entities.Notification.create({
        title: `💼 Nova vaga publicada!`,
        message: `${job.title}${job.company ? ` · ${job.company}` : ''}${job.city ? ` em ${job.city}` : ''}`,
        type: 'job',
        reference_type: 'job',
        reference_id: job.id,
        job_id: job.id,
        redirect_page: 'JobDetail',
        redirect_params: { id: job.id },
        sent_to_all: true,
        is_read: false
      });
      console.log(`[notifyJobCreated] Notificação global criada para vaga ativa ${job.id}`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyJobCreated]', error.message);
    return Response.json({ ok: true });
  }
});