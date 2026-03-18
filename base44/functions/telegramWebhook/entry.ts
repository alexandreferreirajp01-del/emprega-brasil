import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch (err) {
    console.error('[Telegram] Erro ao enviar mensagem:', err.message);
  }
}

async function extractJobData(base44, text) {
  try {
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
  } catch (err) {
    console.error('[Telegram] Erro ao extrair dados com IA:', err.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    console.log('[Telegram] Recebido:', req.method);
    
    // Telegram sempre faz um GET simples para verificar o webhook
    if (req.method === 'GET') {
      return Response.json({ ok: true });
    }

    if (req.method !== 'POST') {
      return Response.json({ ok: true });
    }

    const body = await req.json();
    console.log('[Telegram] Body recebido:', JSON.stringify(body).substring(0, 200));
    
    const message = body?.message || body?.channel_post;

    if (!message) {
      console.log('[Telegram] Nenhuma mensagem encontrada');
      return Response.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const text = message.text || message.caption || '';
    const chatTitle = message.chat?.title || 'Chat privado';
    const chatType = message.chat?.type || 'private';

    console.log('[Telegram] Chat ID:', chatId, 'Type:', chatType, 'Text length:', text.length);

    // Ignorar mensagens muito curtas
    if (!text || text.trim().length < 30) {
      console.log('[Telegram] Mensagem muito curta, ignorando');
      return Response.json({ ok: true });
    }

    // Webhook vem sem auth de usuário — usar service role
    const base44 = createClientFromRequest(req);

    // Extrair dados da vaga com IA
    const jobData = await extractJobData(base44, text);
    console.log('[Telegram] IA resultado is_job:', jobData?.is_job, 'title:', jobData?.title);

    if (!jobData || !jobData.is_job) {
      if (chatType === 'private') {
        await sendTelegramMessage(chatId,
          '⚠️ Não consegui identificar uma vaga de emprego nessa mensagem.\n\nEnvie o texto completo da vaga com título, empresa, localização e contato.'
        );
      }
      return Response.json({ ok: true });
    }

    // Salvar vaga como pending_review usando service role
    console.log('[Telegram] Salvando vaga:', jobData.title);
    try {
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
        needs_review: true
      });
      
      console.log('[Telegram] Vaga criada com ID:', newJob?.id);

      // Confirmar no chat privado
      if (chatType === 'private') {
        await sendTelegramMessage(chatId,
          `✅ <b>Vaga recebida com sucesso!</b>\n\n` +
          `📋 <b>${jobData.title || 'Vaga'}</b>\n` +
          `🏢 ${jobData.company || 'Empresa não informada'}\n` +
          `📍 ${jobData.city || 'Cidade não informada'}${jobData.state ? ', ' + jobData.state : ''}\n\n` +
          `A vaga foi enviada para revisão e será publicada em breve!`
        );
      }
    } catch (err) {
      console.error('[Telegram] ERRO ao criar vaga:', err.message);
      if (chatType === 'private') {
        await sendTelegramMessage(chatId,
          '❌ Erro ao salvar a vaga. Tente novamente.'
        );
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[Telegram] Erro geral:', error.message);
    return Response.json({ ok: true });
  }
});