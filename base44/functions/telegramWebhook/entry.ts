import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error('Erro ao enviar mensagem Telegram:', err.message);
  }
}

Deno.serve(async (req) => {
  try {
    // GET - Validação do webhook (Telegram pede isso)
    if (req.method === 'GET') {
      return Response.json({ ok: true });
    }

    // POST - Receber mensagens
    if (req.method !== 'POST') {
      return Response.json({ ok: true });
    }

    const body = await req.json();
    console.log('[Telegram Webhook] Recebido:', JSON.stringify(body, null, 2));

    const message = body.message || body.channel_post;
    if (!message) {
      return Response.json({ ok: true });
    }

    const chatId = message.chat.id;
    const messageText = message.text || message.caption || '';

    // Ignorar mensagens vazias
    if (!messageText || messageText.trim().length === 0) {
      console.log('[Telegram] Mensagem vazia, ignorando');
      return Response.json({ ok: true });
    }

    console.log('[Telegram] Chat ID:', chatId, 'Texto:', messageText.substring(0, 100));

    // Usar LLM para extrair dados da vaga do texto/mensagem
    const base44 = createClientFromRequest(req);
    
    const extractResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Extraia os dados de uma vaga de emprego do seguinte texto em português:

"${messageText}"

Retorne APENAS um JSON válido (sem markdown) com esses campos (deixe em branco se não encontrar):
{
  "title": "Cargo/Função",
  "company": "Nome da empresa",
  "city": "Cidade",
  "state": "UF (ex: PB)",
  "salary_range": "Faixa salarial se houver",
  "job_type": "CLT, PJ, Estágio, Freelancer, Home Office, Temporário ou Jovem Aprendiz",
  "work_mode": "Presencial, Híbrido ou Remoto",
  "description": "Descrição completa da vaga (resumo do que encontrar)",
  "contact_phone": "Telefone se houver",
  "contact_whatsapp": "WhatsApp se houver",
  "contact_email": "Email se houver",
  "category": "Categoria da vaga se identificar"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          salary_range: { type: 'string' },
          job_type: { type: 'string' },
          work_mode: { type: 'string' },
          description: { type: 'string' },
          contact_phone: { type: 'string' },
          contact_whatsapp: { type: 'string' },
          contact_email: { type: 'string' },
          category: { type: 'string' }
        }
      }
    });

    console.log('[Telegram] Dados extraídos:', JSON.stringify(extractResponse, null, 2));

    // Validar se tem título (obrigatório)
    if (!extractResponse.title || extractResponse.title.trim().length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Não consegui extrair uma vaga válida dessa mensagem.\n\nEnvie uma mensagem com:\n- Cargo/Função\n- Empresa\n- Localização\n- Tipo de contrato\n\nExemplo:\n"Vaga: Desenvolvedor React. Empresa: TechXYZ. João Pessoa, PB. CLT. Salário: R$ 5000. WhatsApp: 83999999999"'
      );
      return Response.json({ ok: true });
    }

    // Salvar no banco como pending_review
    const job = await base44.asServiceRole.entities.Job.create({
      title: extractResponse.title,
      company: extractResponse.company || 'Não informada',
      city: extractResponse.city || 'Não informada',
      state: extractResponse.state || '',
      salary_range: extractResponse.salary_range || '',
      job_type: extractResponse.job_type || '',
      work_mode: extractResponse.work_mode || 'Presencial',
      category: extractResponse.category || 'Geral',
      description: extractResponse.description || 'Vaga disponível',
      contact_phone: extractResponse.contact_phone || '',
      contact_whatsapp: extractResponse.contact_whatsapp || '',
      contact_email: extractResponse.contact_email || '',
      status: 'pending_review',
      origem: 'telegram_bot',
      nivel_localizacao: 'pendente',
      geocode_status: 'pending'
    });

    console.log('[Telegram] Vaga criada:', job.id);

    // Confirmar ao usuário
    await sendTelegramMessage(
      chatId,
      `✅ <b>Vaga recebida!</b>\n\n<b>${extractResponse.title}</b>\n🏢 ${extractResponse.company}\n📍 ${extractResponse.city}${extractResponse.state ? ', ' + extractResponse.state : ''}\n\n<i>Sua vaga está em análise. Você receberá uma notificação quando for publicada!</i>`
    );

    return Response.json({ ok: true });

  } catch (error) {
    console.error('[Telegram Webhook] Erro:', error.message);
    
    // Tentar enviar mensagem de erro ao usuário
    try {
      const body = await req.json();
      const chatId = body.message?.chat?.id || body.channel_post?.chat?.id;
      if (chatId) {
        await sendTelegramMessage(chatId, '❌ Erro ao processar sua mensagem. Tente novamente.');
      }
    } catch {}

    return Response.json({ ok: true });
  }
});