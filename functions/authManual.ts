import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import bcryptjs from 'npm:bcryptjs@2.4.3';
const bcrypt = bcryptjs;

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
  if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json();
    const { action } = body;

    console.log('[authManual] Action:', action);

    // ===== LOGIN =====
    if (action === 'login') {
      const { identifier, password } = body;
      console.log('[authManual] Login attempt:', identifier);

      if (!identifier || !password) {
        return Response.json({ success: false, error: 'Preencha todos os campos' }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.ManualUser.filter({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ]
      });

      if (users.length === 0) {
        console.log('[authManual] Usuário não encontrado');
        return Response.json({ success: false, error: 'Email/usuário não encontrado' }, { status: 404 });
      }

      const user = users[0];
      console.log('[authManual] Usuário encontrado:', user.email);

      if (!user.senhaHash) {
        return Response.json({ success: false, error: 'Esta conta não usa senha. Use login social.' }, { status: 400 });
      }

      const passwordMatch = await bcrypt.compare(password, user.senhaHash);
      if (!passwordMatch) {
        console.log('[authManual] Senha incorreta');
        return Response.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
      }

      if (!user.emailVerified) {
        console.log('[authManual] Email não verificado');
        return Response.json({
          success: false,
          error: 'Email não verificado. Verifique seu email ou solicite um novo link.',
          needsVerification: true,
          email: user.email
        }, { status: 403 });
      }

      if (user.accountStatus !== 'active') {
        return Response.json({ success: false, error: 'Conta bloqueada ou pendente. Entre em contato com o suporte.' }, { status: 403 });
      }

      console.log('[authManual] Login bem-sucedido');
      return Response.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          subscription_type: user.subscription_type,
          role: user.role
        }
      });
    }

    // ===== VERIFICAR USERNAME =====
    if (action === 'check_username') {
      const { username } = body;
      if (!username || username.length < 3) {
        return Response.json({ available: false });
      }
      const existing = await base44.asServiceRole.entities.ManualUser.filter({ username });
      return Response.json({ available: existing.length === 0 });
    }

    // ===== REGISTRO =====
    if (action === 'register') {
      const { nome, sobrenome, idade, localidade, username, email, telefone, password } = body;
      console.log('[authManual] Registro:', email);

      if (!nome || !sobrenome || !idade || !localidade || !username || !email || !telefone || !password) {
        return Response.json({ success: false, error: 'Todos os campos são obrigatórios' }, { status: 400 });
      }

      const idadeNum = parseInt(idade);
      if (isNaN(idadeNum) || idadeNum < 14) {
        return Response.json({ success: false, error: 'Você precisa ter pelo menos 14 anos' }, { status: 400 });
      }

      if (username.length < 3 || /\s/.test(username)) {
        return Response.json({ success: false, error: 'Username deve ter no mínimo 3 caracteres e não pode conter espaços' }, { status: 400 });
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return Response.json({ success: false, error: 'Email inválido' }, { status: 400 });
      }

      if (password.length < 6) {
        return Response.json({ success: false, error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }

      const existingUsername = await base44.asServiceRole.entities.ManualUser.filter({ username });
      if (existingUsername.length > 0) {
        return Response.json({ success: false, error: 'Nome de usuário já cadastrado' }, { status: 409 });
      }

      const existingEmail = await base44.asServiceRole.entities.ManualUser.filter({ email: email.toLowerCase() });
      if (existingEmail.length > 0) {
        return Response.json({ success: false, error: 'Email já cadastrado' }, { status: 409 });
      }

      const senhaHash = await bcrypt.hash(password, 6);
      const verificationToken = crypto.randomUUID();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const newUser = await base44.asServiceRole.entities.ManualUser.create({
        email: email.toLowerCase(),
        full_name: `${nome} ${sobrenome}`,
        nome,
        sobrenome,
        idade: idadeNum,
        localidade,
        username,
        telefone,
        senhaHash,
        authProvider: 'password',
        emailVerified: false,
        accountStatus: 'pending_verification',
        verificationToken,
        verificationTokenExpiry,
        subscription_type: 'basic',
        role: 'user'
      });

      console.log('[authManual] Usuário criado em ManualUser:', newUser.id);

      try {
        const verificationLink = `https://vagasabertaspb.com.br/VerifyEmail?token=${verificationToken}`;
        await sendEmail({
          to: email.toLowerCase(),
          subject: '✅ Confirme seu cadastro - Vagas Abertas PB',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1D4371 0%, #0F2744 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png" alt="Vagas Abertas PB" style="height: 60px; margin-bottom: 10px;" />
                <h1 style="color: white; margin: 0; font-size: 22px;">Vagas Abertas PB</h1>
                <p style="color: #c8d8e8; margin: 6px 0 0 0; font-size: 14px;">Empregos na Paraíba</p>
              </div>
              <div style="background: #ffffff; padding: 36px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
                <h2 style="color: #1D4371; margin-top: 0;">Olá, ${nome}! 👋</h2>
                <p style="color: #555; line-height: 1.7; font-size: 15px;">
                  Seu cadastro no <strong>Vagas Abertas PB</strong> foi realizado com sucesso!<br>
                  Confirme seu e-mail para ativar sua conta.
                </p>
                <div style="text-align: center; margin: 36px 0;">
                  <a href="${verificationLink}" style="background-color: #1D4371; color: white; padding: 16px 44px; text-decoration: none; border-radius: 8px; font-size: 17px; font-weight: bold; display: inline-block;">
                    ✅ Confirmar meu e-mail
                  </a>
                </div>
                <p style="color: #999; font-size: 13px; line-height: 1.6;">
                  ⏰ Este link expira em <strong>24 horas</strong>.<br>
                  🔒 Se você não se cadastrou, ignore este e-mail.
                </p>
              </div>
            </div>
          `
        });
        console.log('[authManual] Email de verificação enviado');
      } catch (emailError) {
        console.error('[authManual] Erro ao enviar email:', emailError);
      }

      return Response.json({
        success: true,
        message: 'Cadastro realizado! Verifique seu email para ativar sua conta.',
        userId: newUser.id
      });
    }

    // ===== REENVIAR VERIFICAÇÃO =====
    if (action === 'resend_verification') {
      const { email } = body;

      const users = await base44.asServiceRole.entities.ManualUser.filter({ email: email.toLowerCase() });
      if (users.length === 0) {
        return Response.json({ success: false, error: 'Email não encontrado' }, { status: 404 });
      }

      const user = users[0];
      if (user.emailVerified) {
        return Response.json({ success: false, error: 'Email já verificado' }, { status: 400 });
      }

      const verificationToken = crypto.randomUUID();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await base44.asServiceRole.entities.ManualUser.update(user.id, {
        verificationToken,
        verificationTokenExpiry
      });

      const verificationLink = `https://vagasabertaspb.com.br/VerifyEmail?token=${verificationToken}`;
      await sendEmail({
        to: email.toLowerCase(),
        subject: 'Novo link de verificação - Vagas Abertas PB',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Olá, ${user.nome}!</h2>
            <p>Aqui está seu novo link de verificação:</p>
            <a href="${verificationLink}" style="background-color: #1D4371; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
              Ativar Minha Conta
            </a>
            <p style="color: #999; font-size: 12px;">Este link expira em 24 horas.</p>
          </div>
        `
      });

      return Response.json({ success: true, message: 'Email de verificação reenviado!' });
    }

    return Response.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('[authManual] Erro:', error?.message || error);
    return Response.json({ success: false, error: error?.message || 'Erro no servidor. Tente novamente.' }, { status: 500 });
  }
});