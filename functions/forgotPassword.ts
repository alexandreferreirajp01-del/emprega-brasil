import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    console.log('[forgotPassword] Iniciando recuperação para:', email);

    if (!email || !email.trim()) {
      return Response.json({ success: false, error: 'Digite seu e-mail' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ success: false, error: 'E-mail inválido' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.ManualUser.filter({ email: email.toLowerCase() });

    if (users.length === 0) {
      console.log('[forgotPassword] Email não encontrado:', email);
      return Response.json({ success: false, error: 'E-mail não cadastrado' }, { status: 404 });
    }

    const user = users[0];
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.ManualUser.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: expiresAt
    });

    const resetLink = `https://vagasabertaspb.com.br/ResetPassword?token=${resetToken}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vagas Abertas PB <noreply@vagasabertaspb.com.br>',
        to: [email.toLowerCase()],
        subject: 'Recuperar Senha - Vagas Abertas PB',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1D4371 0%, #0F2744 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Vagas Abertas PB</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Recuperar Senha</h2>
              <p style="color: #555; line-height: 1.6;">Olá, <strong>${user.full_name || user.nome || 'usuário'}</strong>!</p>
              <p style="color: #555; line-height: 1.6;">Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #1D4371; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Redefinir Minha Senha
                </a>
              </div>
              <p style="color: #888; font-size: 14px;">⏰ Este link expira em <strong>1 hora</strong>.</p>
            </div>
          </div>
        `
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Resend error: ${JSON.stringify(err)}`);
    }

    console.log('[forgotPassword] Email enviado com sucesso');
    return Response.json({ success: true, message: 'Email enviado! Verifique sua caixa de entrada.' });

  } catch (error) {
    console.error('[forgotPassword] Erro:', error);
    return Response.json({ success: false, error: 'Erro ao enviar e-mail. Tente novamente.' }, { status: 500 });
  }
});