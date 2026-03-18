import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Obter dados da requisição
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return Response.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // URL do webhook N8N (configurável via ambiente)
    const N8N_WEBHOOK_URL = Deno.env.get('N8N_ASSISTANT_WEBHOOK_URL');
    const API_KEY = Deno.env.get('API_KEY_N8N') || Deno.env.get('API_KEY_N8N_VagasPB');

    if (!N8N_WEBHOOK_URL) {
      return Response.json({ 
        error: 'Webhook N8N não configurado. Configure a secret N8N_ASSISTANT_WEBHOOK_URL.' 
      }, { status: 500 });
    }

    // Enviar para N8N
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY || ''
      },
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory || [],
        user: {
          email: user.email,
          name: user.full_name,
          subscription_type: user.subscription_type
        }
      })
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('Erro N8N:', errorText);
      return Response.json({ 
        error: 'Erro ao comunicar com assistente de IA' 
      }, { status: 500 });
    }

    const n8nData = await n8nResponse.json();

    // Retornar resposta do assistente
    return Response.json({
      success: true,
      response: n8nData.response || n8nData.message || n8nData,
      usage: n8nData.usage || null
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});