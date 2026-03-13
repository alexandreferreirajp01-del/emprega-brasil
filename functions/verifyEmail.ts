import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Vagas Abertas PB <noreply@vagasabertaspb.com.br>',
      to: [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) console.error('Email error:', data);
  return data;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ success: false, error: 'Token não fornecido' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.ManualUser.filter({ verificationToken: token });

    if (users.length === 0) {
      return Response.json({ success: false, error: 'Token inválido' }, { status: 404 });
    }

    const user = users[0];

    if (user.emailVerified) {
      return Response.json({ success: false, error: 'Email já verificado' }, { status: 400 });
    }

    const now = new Date();
    const expiry = new Date(user.verificationTokenExpiry);

    if (now > expiry) {
      return Response.json({
        success: false,
        error: 'Token expirado. Solicite um novo email de verificação.',
        expired: true
      }, { status: 410 });
    }

    await base44.asServiceRole.entities.ManualUser.update(user.id, {
      emailVerified: true,
      accountStatus: 'active',
      verificationToken: null,
      verificationTokenExpiry: null
    });

    // Enviar email de boas-vindas
    try {
      await sendEmail({
        to: user.email,
        subject: '🎉 Bem-vindo ao Vagas Abertas PB!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1D4371 0%, #0F2744 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Vagas Abertas PB</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1D4371;">🎉 Bem-vindo(a), ${user.nome}!</h2>
              <p style="color: #555;">Sua conta foi ativada! Acesse agora e encontre as melhores vagas da Paraíba.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vagasabertaspb.com.br" style="background-color: #1D4371; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Começar agora
                </a>
              </div>
            </div>
          </div>
        `
      });
    } catch (e) {
      console.error('Erro ao enviar email de boas-vindas:', e);
    }

    return Response.json({
      success: true,
      message: 'Email verificado com sucesso! Você já pode fazer login.',
      user: {
        email: user.email,
        username: user.username,
        subscription_type: user.subscription_type
      }
    });

  } catch (error) {
    console.error('Erro em verifyEmail:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});