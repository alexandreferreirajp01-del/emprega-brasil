import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// IDs dos grupos do Telegram onde postar vagas
// Formato: -100 + ID do grupo
const TELEGRAM_GROUP_IDS = [
  -1001234567890,  // Substitua pelos IDs reais dos seus grupos
];

async function sendTelegramPost(chatId, job) {
  try {
    // Formatar contato
    let contactInfo = '';
    if (job.contact_whatsapp) {
      contactInfo += `📲 WhatsApp: ${job.contact_whatsapp}`;
    }
    if (job.contact_phone) {
      contactInfo += (contactInfo ? '\n' : '') + `☎️ Telefone: ${job.contact_phone}`;
    }
    if (job.contact_email) {
      contactInfo += (contactInfo ? '\n' : '') + `✉️ Email: ${job.contact_email}`;
    }
    if (job.application_link) {
      contactInfo += (contactInfo ? '\n' : '') + `🔗 Candidatar: ${job.application_link}`;
    }

    // Formatar mensagem
    const message = `📌 <b>${job.title}</b>

🏢 <b>Empresa:</b> ${job.company || 'Não informada'}
📍 <b>Localização:</b> ${job.city || 'N/A'}${job.state ? ', ' + job.state : ''}
${job.salary_range ? `💰 <b>Salário:</b> ${job.salary_range}\n` : ''}${job.job_type ? `📋 <b>Tipo:</b> ${job.job_type}\n` : ''}${job.work_mode ? `🏠 <b>Modalidade:</b> ${job.work_mode}\n` : ''}
<b>Descrição:</b>
${job.description ? job.description.substring(0, 300) : 'Vaga disponível'}

${contactInfo}

#vagas #emprego #${job.state?.toLowerCase() || 'pb'}`;

    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    return { success: true, messageId: data.result.message_id };
  } catch (err) {
    console.error(`[AutoPostTelegram] Erro ao enviar para ${chatId}:`, err.message);
    return { success: false, error: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const event = body.event || {};
    const job = body.data || {};

    console.log('[AutoPostTelegram] Event type:', event.type, 'Job ID:', job.id, 'Status:', job.status);

    // Só postar se a vaga está publicada
    if (job.status !== 'ativa' && job.status !== 'published') {
      console.log('[AutoPostTelegram] Vaga não está publicada, ignorando');
      return Response.json({ ok: true });
    }

    // Só postar se é uma vaga válida
    if (!job.title || !job.city) {
      console.log('[AutoPostTelegram] Vaga incompleta, ignorando');
      return Response.json({ ok: true });
    }

    // Não repostar se já foi enviada
    if (job.origem === 'telegram_bot' || job.origem?.includes('telegram')) {
      console.log('[AutoPostTelegram] Vaga veio do Telegram, não reenviando');
      return Response.json({ ok: true });
    }

    // Enviar para cada grupo configurado
    let sentCount = 0;
    for (const chatId of TELEGRAM_GROUP_IDS) {
      const result = await sendTelegramPost(chatId, job);
      if (result.success) {
        sentCount++;
        console.log(`[AutoPostTelegram] Vaga postada no grupo ${chatId}`);
      } else {
        console.error(`[AutoPostTelegram] Falha ao postar no grupo ${chatId}:`, result.error);
      }
    }

    console.log(`[AutoPostTelegram] Vaga ${job.id} enviada para ${sentCount}/${TELEGRAM_GROUP_IDS.length} grupos`);

    return Response.json({ ok: true, sentCount });

  } catch (error) {
    console.error('[AutoPostTelegram] Error:', error.message);
    return Response.json({ ok: true });
  }
});