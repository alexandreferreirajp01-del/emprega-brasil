import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { targetEmail, targetName, messageContent } = await req.json();

    if (!targetEmail || !messageContent) {
      return Response.json({ error: 'Parâmetros obrigatórios: targetEmail, messageContent' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1D4371, #2B5A8F); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💬 Nova Mensagem</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Vagas Abertas PB</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #475569; font-size: 16px;">Olá, <strong>${targetName || 'usuário'}</strong>!</p>
          <p style="color: #475569;">Você recebeu uma mensagem do Administrador da plataforma:</p>
          <div style="background: #f1f5f9; border-left: 4px solid #1D4371; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e293b; margin: 0; font-size: 15px; line-height: 1.6;">${messageContent}</p>
          </div>
          <p style="color: #475569;">Para responder, acesse sua caixa de mensagens na plataforma.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://vagasabertaspb.com.br/Mensagens" style="background: #1D4371; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Ver Mensagem
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">
            Vagas Abertas PB — contato@vagasabertaspb.com.br
          </p>
        </div>
      </div>
    `;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vagas Abertas PB <contato@vagasabertaspb.com.br>',
        to: [targetEmail],
        subject: '💬 Você recebeu uma mensagem do Administrador - Vagas Abertas PB',
        html: htmlBody,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
      return Response.json({ error: 'Falha ao enviar email', details: errText }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro em sendAdminMessage:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});