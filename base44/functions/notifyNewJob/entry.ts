import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import webpush from 'npm:web-push@3.6.7';
import { Resend } from 'npm:resend@4.0.0';

const VAPID_PUBLIC_KEY = "BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q";
const VAPID_PRIVATE_KEY = "3jK8_LCcooMHF3xjb8sSjT3u5qXkwkdmewCzTolOjDA";
const VAPID_EMAIL = 'mailto:alexandreferreirajp01@gmail.com';
const APP_URL = 'https://vagasabertasparaiba.info';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const TEMPLATES = [
  { subject: (v) => `🚨 Nova Vaga: ${v.titulo}${v.homeOffice ? ' 🏠' : ''}`, title: (v) => `🚨 Nova vaga disponível!`, body: (v) => `${v.titulo} em ${v.empresa || 'Empresa'}${v.cidade ? ` · ${v.cidade}` : ''}. Clique e candidate-se agora!`, email: (v) => `<p>🚨 Uma nova vaga acabou de ser publicada!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `✅ Oportunidade: ${v.titulo} — Vagas Abertas PB`, title: (v) => `✅ Oportunidade para você!`, body: (v) => `${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}. Veja os detalhes e candidate-se!`, email: (v) => `<p>✅ Encontramos uma oportunidade que pode ser sua!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `💼 Vaga Nova: ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}`, title: (v) => `💼 Nova vaga publicada`, body: (v) => `${v.empresa || 'Empresa'} busca ${v.titulo}. Não perca!`, email: (v) => `<p>💼 Uma empresa está contratando agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🔥 Corre! Vaga de ${v.titulo} acabou de sair`, title: (v) => `🔥 Vaga quentinha!`, body: (v) => `${v.titulo} — ${v.empresa || 'Confira'}. Candidate-se antes que feche!`, email: (v) => `<p>🔥 Esta vaga acabou de ser publicada. Corra!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🎯 ${v.titulo} — Vaga nova no Vagas Abertas PB`, title: (v) => `🎯 Vaga no seu perfil!`, body: (v) => `${v.titulo} disponível${v.cidade ? ` em ${v.cidade}` : ''}. Veja os detalhes agora.`, email: (v) => `<p>🎯 Uma nova vaga foi publicada para você!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `📢 Novo anúncio: ${v.titulo}${v.homeOffice ? ' (Home Office)' : ''}`, title: (v) => `📢 Novo anúncio de vaga`, body: (v) => `${v.titulo} — ${v.empresa || 'Veja quem está contratando!'}`, email: (v) => `<p>📢 Nova oportunidade publicada agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🆕 Acabou de sair: vaga de ${v.titulo}`, title: (v) => `🆕 Vaga nova no ar!`, body: (v) => `${v.empresa || 'Empresa'} está recrutando ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}!`, email: (v) => `<p>🆕 Acabou de ser publicada uma nova vaga!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🔔 Alerta de vaga: ${v.titulo}${v.homeOffice ? ' — Home Office' : ''}`, title: (v) => `🔔 Alerta de nova vaga!`, body: (v) => `${v.empresa || 'Empresa'} publicou: ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}`, email: (v) => `<p>🔔 Alerta de nova vaga para você!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🌍 Oportunidade na ${v.cidade || 'Paraíba'}: ${v.titulo}`, title: (v) => `🌍 Vaga na sua região!`, body: (v) => `${v.titulo} em ${v.cidade || 'Paraíba'} — ${v.empresa || ''}. Candidate-se!`, email: (v) => `<p>🌍 Vaga publicada na sua região!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🚀 Decole na carreira: vaga de ${v.titulo}`, title: (v) => `🚀 Decole na sua carreira!`, body: (v) => `${v.titulo} em ${v.empresa || 'empresa'}${v.cidade ? ` — ${v.cidade}` : ''}. Candidate-se já!`, email: (v) => `<p>🚀 Uma nova vaga pode alavancar sua carreira!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
];

function pickTemplate(seed) {
  return TEMPLATES[seed % TEMPLATES.length];
}

function buildEmailHtml(template, vars, jobUrl) {
  const customBody = template.email(vars);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1D4371, #0A66C2); padding: 28px 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png" alt="Vagas Abertas PB" style="height:60px; margin-bottom:8px;" />
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: bold;">Vagas Abertas Paraíba</h1>
      </div>
      <div style="padding: 32px; background: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        ${customBody}
        ${vars.homeOffice ? '<p><span style="display:inline-block;background:#10b981;color:white;padding:4px 14px;border-radius:20px;font-size:13px;">🏠 Home Office</span></p>' : ''}
        <div style="margin-top: 28px; text-align: center;">
          <a href="${jobUrl}" style="display:inline-block;background:#0A66C2;color:white;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;">
            Ver Vaga Completa
          </a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; background: #f1f5f9; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
        <p style="margin: 0;">Você recebeu este email por estar cadastrado no Vagas Abertas Paraíba.</p>
        <p style="margin: 6px 0 0;">WhatsApp: (83) 99197-1320 · <a href="https://vagasabertasparaiba.info" style="color:#0A66C2;">vagasabertasparaiba.info</a></p>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Suporta chamada direta (jobId, jobTitle...) E automação de entidade (event + data)
    let jobId, jobTitle, jobCompany, jobCity, isHomeOffice;
    // force=true ignora o check anti-duplicata (usado ao aprovar manualmente)
    const force = body.force === true;

    if (body.event && body.data) {
      // Chamada via automação de entidade
      const job = body.data;
      const oldJob = body.old_data;

      // Se o status atual não é 'ativa', ignora sempre
      if (!job || job.status !== 'ativa') {
        return Response.json({ skipped: true, reason: 'Vaga não ativa, notificação ignorada' });
      }

      // Para eventos de update: só notifica se status MUDOU de não-ativa para ativa
      if (body.event.type === 'update') {
        if (oldJob) {
          if (oldJob.status === 'ativa') {
            return Response.json({ skipped: true, reason: 'Vaga já estava ativa, ignorado para evitar duplicata' });
          }
        } else {
          // old_data é null: verifica notificação recente (últimas 30 minutos — janela menor)
          const recentNotifs = await base44.asServiceRole.entities.Notification.filter({
            reference_id: body.event.entity_id,
            type: 'job'
          }, '-created_date', 5);
          if (recentNotifs.length > 0) {
            const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
            const hasRecent = recentNotifs.some(n => new Date(n.created_date) > thirtyMinAgo);
            if (hasRecent) {
              return Response.json({ skipped: true, reason: 'Notificação recente já existe para esta vaga (30min)' });
            }
          }
        }
      }

      jobId = body.event.entity_id || job.id;
      jobTitle = job.title;
      jobCompany = job.company;
      jobCity = job.city;
      isHomeOffice = (job.work_mode === 'Remoto' || job.is_remote === true);
    } else {
      // Chamada direta (aprovação manual)
      jobId = body.jobId;
      jobTitle = body.jobTitle;
      jobCompany = body.jobCompany;
      jobCity = body.jobCity;
      isHomeOffice = body.isHomeOffice;
    }

    if (!jobId || !jobTitle) {
      return Response.json({ error: 'jobId and jobTitle are required' }, { status: 400 });
    }

    // Se não for force, verificar duplicata por 30 min (para chamadas diretas)
    if (!force && !body.event) {
      const recentNotifs = await base44.asServiceRole.entities.Notification.filter({
        reference_id: jobId,
        type: 'job'
      }, '-created_date', 3);
      if (recentNotifs.length > 0) {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
        const hasRecent = recentNotifs.some(n => new Date(n.created_date) > thirtyMinAgo);
        if (hasRecent) {
          console.log('[notifyNewJob] Notificação recente encontrada, pulando (use force=true para forçar)');
          return Response.json({ skipped: true, reason: 'Notificação recente já existe. Use force=true para forçar.' });
        }
      }
    }

    const seed = parseInt(jobId.replace(/\D/g, '').slice(-4) || '0', 10) || Math.floor(Math.random() * TEMPLATES.length);
    const template = pickTemplate(seed);

    const vars = {
      titulo: jobTitle,
      empresa: jobCompany || '',
      cidade: jobCity || '',
      homeOffice: !!isHomeOffice
    };

    const jobUrl = `${APP_URL}/JobDetail?id=${jobId}`;

    // 1. Criar notificação global no sininho (sent_to_all = aparece para todos) — CLICÁVEL
    await base44.asServiceRole.entities.Notification.create({
      title: template.title(vars),
      message: template.body(vars),
      type: 'job',
      reference_type: 'job',
      reference_id: jobId,
      job_id: jobId,
      redirect_page: 'JobDetail',
      redirect_params: { id: jobId },
      sent_to_all: true,
      is_read: false
    });

    console.log(`[notifyNewJob] Notificação criada para vaga ${jobId} - ${jobTitle}`);

    // 2. Email — só envia se sendEmail=true
    let emailsSent = 0, emailErrors = 0, pushSent = 0, pushErrors = 0;

    const sendEmail = body.sendEmail === true;
    if (sendEmail) {
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 10000);
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const emailHtml = buildEmailHtml(template, vars, jobUrl);
      const emailSubject = template.subject(vars);

      const EMAIL_BATCH = 50;
      for (let i = 0; i < allUsers.length; i += EMAIL_BATCH) {
        const batch = allUsers.slice(i, i + EMAIL_BATCH);
        await Promise.allSettled(
          batch.map(async (u) => {
            if (!u.email) return;
            try {
              await resend.emails.send({
                from: 'Vagas Abertas PB <noreply@vagasabertasparaiba.info>',
                to: u.email,
                subject: emailSubject,
                html: emailHtml,
              });
              emailsSent++;
            } catch (e) {
              console.warn('Email error for', u.email, e.message);
              emailErrors++;
            }
          })
        );
      }
    }

    // 3. Push notification para todos os inscritos
    const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ is_active: true }, '-created_date', 10000);
    const pushPayload = JSON.stringify({
      title: template.title(vars),
      body: template.body(vars),
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      url: jobUrl,
      data: { url: jobUrl },
      timestamp: Date.now()
    });

    const failedSubs = [];
    const PUSH_BATCH = 50;
    for (let i = 0; i < subscriptions.length; i += PUSH_BATCH) {
      const batch = subscriptions.slice(i, i + PUSH_BATCH);
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload
            );
            pushSent++;
            return { ok: true };
          } catch (e) {
            if (e.statusCode === 404 || e.statusCode === 410) failedSubs.push(sub.id);
            pushErrors++;
            return { ok: false };
          }
        })
      );
    }

    await Promise.allSettled(failedSubs.map(id => base44.asServiceRole.entities.PushSubscription.delete(id)));

    return Response.json({
      success: true,
      jobId,
      jobTitle,
      templateUsed: seed % TEMPLATES.length,
      emailsSent,
      emailErrors,
      pushSent,
      pushErrors,
      totalPushSubs: subscriptions.length
    });

  } catch (error) {
    console.error('[notifyNewJob] Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});