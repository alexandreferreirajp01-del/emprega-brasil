import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { action, webhook_url } = await req.json();

    if (!TELEGRAM_BOT_TOKEN) {
      return Response.json({ error: 'TELEGRAM_BOT_TOKEN não configurado' }, { status: 400 });
    }

    // Obter informações do bot
    if (action === 'get_bot_info') {
      const res = await fetch(`${TELEGRAM_API}/getMe`);
      const data = await res.json();
      return Response.json(data);
    }

    // Obter status do webhook atual
    if (action === 'get_webhook_info') {
      const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
      const data = await res.json();
      return Response.json(data);
    }

    // Registrar/atualizar webhook
    if (action === 'set_webhook') {
      if (!webhook_url) {
        return Response.json({ error: 'webhook_url é obrigatório' }, { status: 400 });
      }
      const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhook_url })
      });
      const data = await res.json();
      return Response.json(data);
    }

    // Remover webhook
    if (action === 'delete_webhook') {
      const res = await fetch(`${TELEGRAM_API}/deleteWebhook`);
      const data = await res.json();
      return Response.json(data);
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});