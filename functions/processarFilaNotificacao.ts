import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_URL = 'https://vagasabertasparaiba.info';

const TEMPLATES = [
  { subject: (v) => `🚨 Nova Vaga: ${v.titulo}${v.homeOffice ? ' 🏠' : ''}`, title: (v) => `🚨 Nova vaga disponível!`, body: (v) => `${v.titulo} em ${v.empresa || 'Empresa'}${v.cidade ? ` · ${v.cidade}` : ''}. Clique e candidate-se agora!`, email: (v) => `<p>🚨 Uma nova vaga acabou de ser publicada!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `✅ Oportunidade: ${v.titulo} — Vagas Abertas PB`, title: (v) => `✅ Oportunidade para você!`, body: (v) => `${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}. Veja os detalhes e candidate-se!`, email: (v) => `<p>✅ Encontramos uma oportunidade que pode ser sua!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `💼 Vaga Nova: ${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''}`, title: (v) => `💼 Nova vaga publicada`, body: (v) => `${v.empresa || 'Empresa'} busca ${v.titulo}. Não perca!`, email: (v) => `<p>💼 Uma empresa está contratando agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🔥 Corre! Vaga de ${v.titulo} acabou de sair`, title: (v) => `🔥 Vaga quentinha!`, body: (v) => `${v.titulo} — ${v.empresa || 'Confira'}. Candidate-se antes que feche!`, email: (v) => `<p>🔥 Esta vaga acabou de ser publicada. Corra!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🎯 ${v.titulo} — Vaga nova no Vagas Abertas PB`, title: (v) => `🎯 Vaga no seu perfil!`, body: (v) => `${v.titulo} disponível${v.cidade ? ` em ${v.cidade}` : ''}. Veja os detalhes agora.`, email: (v) => `<p>🎯 Uma nova vaga foi publicada para você!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `⭐ Vaga em Destaque: ${v.titulo}`, title: (v) => `⭐ Vaga recém-publicada!`, body: (v) => `${v.empresa || 'Empresa'} está contratando ${v.titulo}. Veja agora!`, email: (v) => `<p>⭐ Nova vaga disponível para candidatura!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `📢 Novo anúncio: ${v.titulo}${v.homeOffice ? ' (Home Office)' : ''}`, title: (v) => `📢 Novo anúncio de vaga`, body: (v) => `${v.titulo} — ${v.empresa || 'Veja quem está contratando!'}`, email: (v) => `<p>📢 Nova oportunidade publicada agora!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `👀 Ei! Tem vaga nova: ${v.titulo}`, title: (v) => `👀 Olha essa vaga!`, body: (v) => `${v.titulo}${v.cidade ? ` em ${v.cidade}` : ''} — ${v.empresa || ''}. Acesse já!`, email: (v) => `<p>👀 Ei! Apareceu uma vaga nova que pode te interessar.</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
  { subject: (v) => `🌟 Sua próxima oportunidade: ${v.titulo}`, title: (v) => `🌟 Pode ser a sua chance!`, body: (v) => `${v.empresa || 'Uma empresa'} publicou a vaga de ${v.titulo}. Não deixe passar!`, email: (v) => `<p>🌟 Sua próxima oportunidade pode ser esta!</p><h3 style="color:#0A66C2">${v.titulo}</h3><p>${v.empresa || ''}${v.cidade ? ` — ${v.cidade}` : ''}</p>` },
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
  // EMAIL DESABILITADO — envio de notificações por email está desativado
  return Response.json({ success: true, message: 'Envio de email desabilitado', processados: 0 });

  try {
    const base44 = createClientFromRequest(req);

    // Buscar os próximos 50 emails pendentes na fila (ordenados por criação)
    const pendentes = await base44.asServiceRole.entities.FilaNotificacao.filter(
      { status: 'pending' },
      'created_date',
      50
    );

    if (!pendentes || pendentes.length === 0) {
      return Response.json({ success: true, message: 'Fila vazia', processados: 0 });
    }

    let enviados = 0;
    let erros = 0;

    for (const item of pendentes) {
      const vars = {
        titulo: item.job_title || '',
        empresa: item.job_company || '',
        cidade: item.job_city || '',
        homeOffice: !!item.is_home_office
      };
      const jobUrl = `${APP_URL}/JobDetail?id=${item.job_id}`;
      const template = pickTemplate(item.template_seed || 0);

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: item.user_email,
          subject: template.subject(vars),
          body: buildEmailHtml(template, vars, jobUrl)
        });

        await base44.asServiceRole.entities.FilaNotificacao.update(item.id, {
          status: 'sent',
          sent_at: new Date().toISOString(),
          attempts: (item.attempts || 0) + 1
        });
        enviados++;
      } catch (e) {
        const attempts = (item.attempts || 0) + 1;
        await base44.asServiceRole.entities.FilaNotificacao.update(item.id, {
          status: attempts >= 3 ? 'failed' : 'pending',
          attempts
        });
        erros++;
      }

      // Pequeno delay entre envios para não estourar rate limit
      await new Promise(r => setTimeout(r, 200));
    }

    return Response.json({
      success: true,
      processados: pendentes.length,
      enviados,
      erros
    });

  } catch (error) {
    console.error('processarFilaNotificacao error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});