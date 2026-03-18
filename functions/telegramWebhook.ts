import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}

async function extractJobData(base44, text) {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Analise o texto abaixo e extraia os dados de uma vaga de emprego.
Se o texto NÃO for uma vaga de emprego, retorne { "is_job": false }.
Se for uma vaga, retorne { "is_job": true } com todos os campos encontrados.

Texto:
${text}`,
    response_json_schema: {
      type: "object",
      properties: {
        is_job: { type: "boolean" },
        title: { type: "string" },
        company: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        neighborhood: { type: "string" },
        salary_range: { type: "string" },
        job_type: { type: "string" },
        work_mode: { type: "string", enum: ["Presencial", "Híbrido", "Remoto"] },
        description: { type: "string" },
        contact_phone: { type: "string" },
        contact_whatsapp: { type: "string" },
        contact_email: { type: "string" },
        application_link: { type: "string" },
        is_pcd: { type: "boolean" }
      }
    }
  });
  return result;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ ok: true });
  }

  const body = await req.json();
  const message = body?.message || body?.channel_post;

  if (!message) {
    return Response.json({ ok: true });
  }

  const chatId = message.chat?.id;
  const text = message.text || message.caption || '';
  const chatTitle = message.chat?.title || 'Chat privado';
  const chatType = message.chat?.type || 'private';
  const fromName = message.from?.first_name || message.from?.username || 'Usuário';

  // Ignorar mensagens muito curtas
  if (!text || text.length < 30) {
    return Response.json({ ok: true });
  }

  const base44 = createClientFromRequest(req);

  // Extrair dados da vaga com IA
  const jobData = await extractJobData(base44, text);

  if (!jobData.is_job) {
    // Se for chat privado, responder que não é uma vaga
    if (chatType === 'private') {
      await sendTelegramMessage(chatId,
        '⚠️ Não consegui identificar uma vaga de emprego nessa mensagem.\n\nEnvie o texto completo da vaga com título, empresa, localização e contato.'
      );
    }
    return Response.json({ ok: true });
  }

  // Salvar vaga como pending_review
  const newJob = await base44.asServiceRole.entities.Job.create({
    title: jobData.title || 'Vaga sem título',
    company: jobData.company || '',
    city: jobData.city || '',
    state: jobData.state || 'PB',
    neighborhood: jobData.neighborhood || '',
    salary_range: jobData.salary_range || '',
    job_type: jobData.job_type || '',
    work_mode: jobData.work_mode || 'Presencial',
    description: jobData.description || text,
    contact_phone: jobData.contact_phone || '',
    contact_whatsapp: jobData.contact_whatsapp || '',
    contact_email: jobData.contact_email || '',
    application_link: jobData.application_link || '',
    is_pcd: jobData.is_pcd || false,
    is_premium: false,
    is_featured: false,
    status: 'pending_review',
    origem: 'telegram_bot',
    origin_group_name: chatTitle,
    origin_channel: `telegram_${chatType}`
  });

  // Confirmar no chat privado, ou silencioso em grupos
  if (chatType === 'private') {
    await sendTelegramMessage(chatId,
      `✅ <b>Vaga recebida com sucesso!</b>\n\n` +
      `📋 <b>${jobData.title || 'Vaga'}</b>\n` +
      `🏢 ${jobData.company || 'Empresa não informada'}\n` +
      `📍 ${jobData.city || 'Cidade não informada'}${jobData.state ? ', ' + jobData.state : ''}\n\n` +
      `A vaga foi enviada para revisão e será publicada em breve!`
    );
  }

  return Response.json({ ok: true });
});