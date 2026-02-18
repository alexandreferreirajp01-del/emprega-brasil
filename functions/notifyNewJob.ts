import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = "BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q";
const VAPID_PRIVATE_KEY = "3jK8_LCcooMHF3xjb8sSjT3u5qXkwkdmewCzTolOjDA";
const VAPID_EMAIL = 'mailto:alexandreferreirajp01@gmail.com';
const APP_URL = 'https://vagasabertasparaiba.info';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// ============================================================
// 30 TEMPLATES DE NOTIFICAÇÃO - escolhidos aleatoriamente
// Variáveis disponíveis: {titulo}, {empresa}, {cidade}, {emoji}
// ============================================================
const TEMPLATES = [
  {
    subject: (v) => `🚨 Nova Vaga: ${v.titulo}${v.homeOffice ? ' 🏠' : ''}`,
    title: (v) => `🚨 Nova vaga disponível!`,
    body: (v) => `${v.titulo} em ${v.empresa || 'Empresa'}${v.cidade ? ` · ${v.cidade}` : ''}. Clique e candidate-se agora!`,
    email: (v) => `<p>🚨 Uma nova vaga acabou de ser publicada!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `✅ Oportunidade: ${v.titulo} — Vagas Abertas PB`,
    title: (v) => `✅ Oportunidade para você!`,
    body: (v) => `${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}. Veja os detalhes e candidate-se!`,
    email: (v) => `<p>✅ Encontramos uma oportunidade que pode ser sua!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `💼 Vaga Nova: ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}`,
    title: (v) => `💼 Nova vaga publicada`,
    body: (v) => `${v.empresa || 'Empresa'} busca ${v.titulo}. Não perca!`,
    email: (v) => `<p>💼 Uma empresa está contratando agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🔥 Corre! Vaga de ${v.titulo} acabou de sair`,
    title: (v) => `🔥 Vaga quentinha!`,
    body: (v) => `${v.titulo} — ${v.empresa || 'Confira'}. Candidate-se antes que feche!`,
    email: (v) => `<p>🔥 Esta vaga acabou de ser publicada. Corra!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🎯 ${v.titulo} — Vaga nova no Vagas Abertas PB`,
    title: (v) => `🎯 Vaga no seu perfil!`,
    body: (v) => `${v.titulo} disponível${v.cidade ? ` em ${v.cidade}` : ''}. Veja os detalhes agora.`,
    email: (v) => `<p>🎯 Uma nova vaga foi publicada para você!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `⭐ Vaga em Destaque: ${v.titulo}`,
    title: (v) => `⭐ Vaga recém-publicada!`,
    body: (v) => `${v.empresa || 'Empresa'} está contratando ${v.titulo}. Veja agora!`,
    email: (v) => `<p>⭐ Nova vaga disponível para candidatura!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `📢 Novo anúncio: ${v.titulo}${v.homeOffice ? ' (Home Office)' : ''}`,
    title: (v) => `📢 Novo anúncio de vaga`,
    body: (v) => `${v.titulo} — ${v.empresa || 'Veja quem está contratando!'}`,
    email: (v) => `<p>📢 Nova oportunidade publicada agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `👀 Ei! Tem vaga nova: ${v.titulo}`,
    title: (v) => `👀 Olha essa vaga!`,
    body: (v) => `${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''} — ${v.empresa || ''}. Acesse já!`,
    email: (v) => `<p>👀 Ei! Apareceu uma vaga nova que pode te interessar.</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🌟 Sua próxima oportunidade: ${v.titulo}`,
    title: (v) => `🌟 Pode ser a sua chance!`,
    body: (v) => `${v.empresa || 'Uma empresa'} publicou a vaga de ${v.titulo}. Não deixe passar!`,
    email: (v) => `<p>🌟 Sua próxima oportunidade pode ser esta!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🏃 Corra! Vaga aberta: ${v.titulo}`,
    title: (v) => `🏃 Vaga recém-aberta!`,
    body: (v) => `${v.titulo} em ${v.empresa || 'empresa'}${v.cidade ? ` (${v.cidade})` : ''}. Candidate-se!`,
    email: (v) => `<p>🏃 Não perca tempo, uma nova vaga acabou de abrir!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `💡 Oportunidade de Emprego: ${v.titulo}`,
    title: (v) => `💡 Nova oportunidade!`,
    body: (v) => `Vaga de ${v.titulo} disponível${v.cidade ? ` em ${v.cidade}` : ''}. Veja e candidate-se!`,
    email: (v) => `<p>💡 Uma nova oportunidade de emprego está disponível!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `📌 Vaga fixada: ${v.titulo} — Candidate-se agora`,
    title: (v) => `📌 Não perca esta vaga!`,
    body: (v) => `${v.titulo} — ${v.empresa || 'empresa'}${v.cidade ? ` · ${v.cidade}` : ''}`,
    email: (v) => `<p>📌 Uma nova vaga foi publicada agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🆕 Acabou de sair: vaga de ${v.titulo}`,
    title: (v) => `🆕 Vaga nova no ar!`,
    body: (v) => `${v.empresa || 'Empresa'} está recrutando ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}!`,
    email: (v) => `<p>🆕 Acabou de ser publicada uma nova vaga!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🎉 Vagas Abertas: ${v.titulo}${v.homeOffice ? ' 🏠 Home Office' : ''}`,
    title: (v) => `🎉 Novidade no Vagas Abertas PB`,
    body: (v) => `${v.titulo} — ${v.empresa || ''}. Entre e veja os detalhes!`,
    email: (v) => `<p>🎉 Novidade! Uma vaga acabou de ser publicada.</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `📣 Atenção! Nova vaga de ${v.titulo} publicada`,
    title: (v) => `📣 Nova vaga publicada agora!`,
    body: (v) => `${v.titulo} em ${v.empresa || 'empresa'}${v.cidade ? ` — ${v.cidade}` : ''}. Candidate-se!`,
    email: (v) => `<p>📣 Atenção! Nova vaga publicada agora.</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🤝 ${v.empresa || 'Empresa'} está contratando: ${v.titulo}`,
    title: (v) => `🤝 Empresa contratando agora!`,
    body: (v) => `${v.empresa || 'Uma empresa'} busca ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}. Veja!`,
    email: (v) => `<p>🤝 Uma empresa está contratando agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `✨ Conquiste sua vaga de ${v.titulo}!`,
    title: (v) => `✨ Esta vaga pode ser sua!`,
    body: (v) => `${v.titulo} disponível${v.cidade ? ` em ${v.cidade}` : ''}. Candidate-se e conquiste!`,
    email: (v) => `<p>✨ Uma nova vaga foi publicada. Conquiste essa oportunidade!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `⚡ Flash: Vaga de ${v.titulo} disponível agora!`,
    title: (v) => `⚡ Vaga disponível agora!`,
    body: (v) => `${v.titulo} — ${v.empresa || ''}${v.cidade ? ` (${v.cidade})` : ''}. Acesse já!`,
    email: (v) => `<p>⚡ Flash! Vaga nova acabou de entrar no ar.</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🏆 Oportunidade top: ${v.titulo}`,
    title: (v) => `🏆 Vaga top publicada!`,
    body: (v) => `${v.titulo} em ${v.empresa || 'empresa'}${v.cidade ? ` — ${v.cidade}` : ''}. Não perca!`,
    email: (v) => `<p>🏆 Nova vaga publicada no Vagas Abertas PB!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🔔 Alerta de vaga: ${v.titulo}${v.homeOffice ? ' — Home Office' : ''}`,
    title: (v) => `🔔 Alerta de nova vaga!`,
    body: (v) => `${v.empresa || 'Empresa'} publicou: ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}`,
    email: (v) => `<p>🔔 Alerta de nova vaga para você!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `💪 Vai encarar? Vaga de ${v.titulo} aberta!`,
    title: (v) => `💪 Vaga aberta para você!`,
    body: (v) => `${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''} — ${v.empresa || ''}. Candidature-se!`,
    email: (v) => `<p>💪 Uma nova vaga foi aberta. Você vai encarar?</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🌈 Boa notícia: vaga de ${v.titulo} publicada!`,
    title: (v) => `🌈 Boa notícia para você!`,
    body: (v) => `${v.titulo} — ${v.empresa || 'empresa'}${v.cidade ? ` em ${v.cidade}` : ''}. Veja agora!`,
    email: (v) => `<p>🌈 Boa notícia! Uma nova vaga foi publicada.</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🎁 Presente do dia: vaga de ${v.titulo}!`,
    title: (v) => `🎁 Nova vaga para você!`,
    body: (v) => `${v.titulo} disponível em ${v.empresa || 'empresa'}${v.cidade ? ` (${v.cidade})` : ''}!`,
    email: (v) => `<p>🎁 Uma nova vaga foi publicada especialmente para você!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `📊 Novo processo seletivo: ${v.titulo}`,
    title: (v) => `📊 Processo seletivo aberto!`,
    body: (v) => `${v.empresa || 'Empresa'} abriu processo seletivo para ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}`,
    email: (v) => `<p>📊 Novo processo seletivo publicado!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🚀 Decole na carreira: vaga de ${v.titulo}`,
    title: (v) => `🚀 Decole na sua carreira!`,
    body: (v) => `${v.titulo} em ${v.empresa || 'empresa'}${v.cidade ? ` — ${v.cidade}` : ''}. Candidate-se já!`,
    email: (v) => `<p>🚀 Uma nova vaga pode alavancar sua carreira!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🧲 Você pode ser a pessoa certa: ${v.titulo}`,
    title: (v) => `🧲 Você pode ser o escolhido!`,
    body: (v) => `${v.titulo} — ${v.empresa || ''}${v.cidade ? ` em ${v.cidade}` : ''}. Acesse e candidate-se!`,
    email: (v) => `<p>🧲 Você pode ser exatamente quem essa empresa procura!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `📬 Chegou vaga nova: ${v.titulo}${v.homeOffice ? ' 🏠' : ''}`,
    title: (v) => `📬 Chegou vaga nova!`,
    body: (v) => `${v.titulo} — ${v.empresa || ''}${v.cidade ? ` (${v.cidade})` : ''}. Veja detalhes!`,
    email: (v) => `<p>📬 Uma nova vaga chegou para você!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🌍 Oportunidade na ${v.cidade || 'Paraíba'}: ${v.titulo}`,
    title: (v) => `🌍 Vaga na sua região!`,
    body: (v) => `${v.titulo} em ${v.cidade || 'Paraíba'} — ${v.empresa || ''}. Candidate-se!`,
    email: (v) => `<p>🌍 Vaga publicada na sua região!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `🏅 Destaque do dia: vaga de ${v.titulo}`,
    title: (v) => `🏅 Vaga destaque publicada!`,
    body: (v) => `${v.titulo} em ${v.empresa || 'empresa'}${v.cidade ? ` — ${v.cidade}` : ''}. Não perca!`,
    email: (v) => `<p>🏅 Destaque do dia: nova vaga publicada!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  },
  {
    subject: (v) => `📝 Inscrições abertas: ${v.titulo}`,
    title: (v) => `📝 Inscrições abertas!`,
    body: (v) => `Inscrições abertas para ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}. Candidate-se!`,
    email: (v) => `<p>📝 Inscrições abertas para uma nova vaga!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>`
  }
];

function pickTemplate(seed) {
  const idx = seed % TEMPLATES.length;
  return TEMPLATES[idx];
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

    if (body.event && body.data) {
      // Chamada via automação de entidade
      const job = body.data;
      if (!job || job.status !== 'ativa') {
        return Response.json({ skipped: true, reason: 'Vaga não ativa, notificação ignorada' });
      }
      jobId = body.event.entity_id || job.id;
      jobTitle = job.title;
      jobCompany = job.company;
      jobCity = job.city;
      isHomeOffice = (job.work_mode === 'Remoto' || job.is_remote === true);
    } else {
      // Chamada direta
      jobId = body.jobId;
      jobTitle = body.jobTitle;
      jobCompany = body.jobCompany;
      jobCity = body.jobCity;
      isHomeOffice = body.isHomeOffice;
    }

    if (!jobId || !jobTitle) {
      return Response.json({ error: 'jobId and jobTitle are required' }, { status: 400 });
    }

    // Semente para seleção de template: usa parte do jobId
    const seed = parseInt(jobId.replace(/\D/g, '').slice(-4) || '0', 10) || Math.floor(Math.random() * TEMPLATES.length);
    const template = pickTemplate(seed);

    const vars = {
      titulo: jobTitle,
      empresa: jobCompany || '',
      cidade: jobCity || '',
      homeOffice: !!isHomeOffice
    };

    const jobUrl = `${APP_URL}/JobDetail?id=${jobId}`;

    // 1. Criar notificação global no sininho (para TODOS os usuários)
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

    // 2. Buscar todos os usuários para email
    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    let emailsSent = 0, emailErrors = 0, pushSent = 0, pushErrors = 0;

    // 3. Enviar emails sequencialmente com delay para evitar rate limit
    const BATCH = 5;
    const DELAY_MS = 1200; // 1.2s entre batches = ~4 emails/seg
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.filter(u => u.email).map(async (user) => {
          try {
            const userSeed = (seed + i) % TEMPLATES.length;
            const userTemplate = pickTemplate(userSeed);
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: user.email,
              subject: userTemplate.subject(vars),
              body: buildEmailHtml(userTemplate, vars, jobUrl)
            });
            emailsSent++;
          } catch (e) {
            emailErrors++;
          }
        })
      );
      if (i + BATCH < users.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    // 4. Enviar push notification para todos os inscritos
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
            return { ok: true, id: sub.id };
          } catch (e) {
            if (e.statusCode === 404 || e.statusCode === 410) failedSubs.push(sub.id);
            return { ok: false, id: sub.id };
          }
        })
      );
      results.forEach(r => r.status === 'fulfilled' && r.value.ok ? pushSent++ : pushErrors++);
    }

    // Limpar subscriptions inválidas
    await Promise.allSettled(failedSubs.map(id => base44.asServiceRole.entities.PushSubscription.delete(id)));

    return Response.json({
      success: true,
      templateUsed: seed % TEMPLATES.length,
      emailsSent,
      emailErrors,
      pushSent,
      pushErrors,
      totalUsers: users.length,
      totalPushSubs: subscriptions.length
    });

  } catch (error) {
    console.error('notifyNewJob error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});