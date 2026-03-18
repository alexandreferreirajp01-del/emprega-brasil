import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramPost(chatId, jobTitle, jobCompany, jobCity, jobState, jobDescription, jobLink, contactInfo) {
  try {
    // Formatar mensagem
    const message = `📌 <b>${jobTitle}</b>

🏢 <b>Empresa:</b> ${jobCompany || 'Não informada'}
📍 <b>Localização:</b> ${jobCity || 'N/A'}${jobState ? ', ' + jobState : ''}

📝 <b>Descrição:</b>
${jobDescription ? jobDescription.substring(0, 300) : 'Vaga disponível'}

${contactInfo || ''}

#vagas #emprego #${jobState?.toLowerCase() || 'pb'}`;

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
    console.error(`[SendToTelegram] Erro ao enviar para ${chatId}:`, err.message);
    return { success: false, error: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { jobId, chatIds = [] } = body;

    if (!jobId || !Array.isArray(chatIds) || chatIds.length === 0) {
      return Response.json({ 
        error: 'jobId e chatIds (array) são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar job
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: jobId });
    if (!jobs || jobs.length === 0) {
      return Response.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    const job = jobs[0];

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

    // Enviar para cada chat
    const results = [];
    for (const chatId of chatIds) {
      const result = await sendTelegramPost(
        chatId,
        job.title,
        job.company,
        job.city,
        job.state,
        job.description,
        job.application_link,
        contactInfo
      );
      results.push({ chatId, ...result });
    }

    return Response.json({
      success: true,
      jobId,
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('[SendToTelegram] Error:', error.message);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});