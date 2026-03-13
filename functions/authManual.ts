import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import bcryptjs from 'npm:bcryptjs@2.4.3';
const bcrypt = bcryptjs;

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
        return Response.json({ 
          success: false, 
          error: 'Preencha todos os campos' 
        }, { status: 400 });
      }

      // Buscar usuário por email ou username
      const users = await base44.asServiceRole.entities.User.filter({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ]
      });

      if (users.length === 0) {
        console.log('[authManual] Usuário não encontrado');
        return Response.json({ 
          success: false, 
          error: 'Email/usuário não encontrado' 
        }, { status: 404 });
      }

      const user = users[0];
      console.log('[authManual] Usuário encontrado:', user.email);

      // Verificar se é conta por senha
      if (user.authProvider !== 'password' || !user.senhaHash) {
        console.log('[authManual] Conta não usa senha');
        return Response.json({ 
          success: false, 
          error: `Esta conta usa login via ${user.authProvider}. Use o botão "${user.authProvider}" para entrar.` 
        }, { status: 400 });
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, user.senhaHash);
      if (!passwordMatch) {
        console.log('[authManual] Senha incorreta');
        return Response.json({ 
          success: false, 
          error: 'Senha incorreta' 
        }, { status: 401 });
      }

      // Verificar se email foi verificado
      if (!user.emailVerified) {
        console.log('[authManual] Email não verificado');
        return Response.json({ 
          success: false, 
          error: 'Email não verificado. Verifique seu email ou solicite um novo link.',
          needsVerification: true,
          email: user.email
        }, { status: 403 });
      }

      // Verificar se conta está ativa
      if (user.accountStatus !== 'active') {
        console.log('[authManual] Conta não ativa:', user.accountStatus);
        return Response.json({ 
          success: false, 
          error: 'Conta bloqueada ou pendente. Entre em contato com o suporte.' 
        }, { status: 403 });
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
      const existing = await base44.asServiceRole.entities.User.filter({ username });
      return Response.json({ available: existing.length === 0 });
    }

    // ===== REGISTRO =====
    if (action === 'register') {
      const { nome, sobrenome, idade, localidade, username, email, telefone, password } = body;

      console.log('[authManual] Registro:', email);

      // Validações
      if (!nome || !sobrenome || !idade || !localidade || !username || !email || !telefone || !password) {
        return Response.json({ 
          success: false, 
          error: 'Todos os campos são obrigatórios'
        }, { status: 400 });
      }

      // Validar idade
      const idadeNum = parseInt(idade);
      if (isNaN(idadeNum) || idadeNum < 14) {
        return Response.json({ 
          success: false, 
          error: 'Você precisa ter pelo menos 14 anos'
        }, { status: 400 });
      }

      // Validar username
      if (username.length < 3 || /\s/.test(username)) {
        return Response.json({ 
          success: false, 
          error: 'Username deve ter no mínimo 3 caracteres e não pode conter espaços'
        }, { status: 400 });
      }

      // Validar email
      if (!/\S+@\S+\.\S+/.test(email)) {
        return Response.json({ 
          success: false, 
          error: 'Email inválido'
        }, { status: 400 });
      }

      // Validar senha
      if (password.length < 6) {
        return Response.json({ 
          success: false, 
          error: 'Senha deve ter no mínimo 6 caracteres'
        }, { status: 400 });
      }

      // Verificar se username já existe
      const existingUsername = await base44.asServiceRole.entities.User.filter({ username });
      if (existingUsername.length > 0) {
        return Response.json({ 
          success: false, 
          error: 'Nome de usuário já cadastrado'
        }, { status: 409 });
      }

      // Verificar se email já existe
      const existingEmail = await base44.asServiceRole.entities.User.filter({ 
        email: email.toLowerCase() 
      });
      if (existingEmail.length > 0) {
        const user = existingEmail[0];
        if (user.authProvider !== 'password') {
          return Response.json({ 
            success: false, 
            error: `Email já cadastrado via ${user.authProvider}. Use o botão ${user.authProvider} para entrar.`
          }, { status: 409 });
        } else {
          return Response.json({ 
            success: false, 
            error: 'Email já cadastrado'
          }, { status: 409 });
        }
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(password, 10);

      // Gerar token de verificação
      const verificationToken = crypto.randomUUID();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Criar usuário
      const newUser = await base44.asServiceRole.entities.User.create({
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
        subscription_type: 'basic'
      });

      console.log('[authManual] Usuário criado:', newUser.id);

      // Enviar email de verificação
      try {
        const verificationLink = `https://vagasabertaspb.com.br/VerifyEmail?token=${verificationToken}`;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email.toLowerCase(),
          subject: '✅ Confirme seu cadastro - Vagas Abertas PB',
          body: `
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
                  Agora, basta confirmar seu e-mail para ativar sua conta e começar a acessar as melhores vagas da Paraíba.
                </p>
                
                <div style="text-align: center; margin: 36px 0;">
                  <a href="${verificationLink}" style="background-color: #1D4371; color: white; padding: 16px 44px; text-decoration: none; border-radius: 8px; font-size: 17px; font-weight: bold; display: inline-block; letter-spacing: 0.3px;">
                    ✅ Confirmar meu e-mail
                  </a>
                </div>

                <div style="background: #f0f7ff; border-left: 4px solid #1D4371; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                  <p style="margin: 0; color: #1D4371; font-size: 14px; line-height: 1.6;">
                    🔗 Após confirmar, você será levado direto para o aplicativo em<br>
                    <a href="https://vagasabertaspb.com.br" style="color: #1D4371; font-weight: bold;">vagasabertaspb.com.br</a>
                  </p>
                </div>
                
                <p style="color: #999; font-size: 13px; line-height: 1.6;">
                  ⏰ Este link expira em <strong>24 horas</strong>.<br>
                  🔒 Se você não se cadastrou neste site, ignore este e-mail com segurança.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;">
                
                <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
                  Equipe Vagas Abertas PB &nbsp;|&nbsp; CNPJ: 62.874.724/0001-11<br>
                  <a href="https://vagasabertaspb.com.br" style="color: #aaa;">vagasabertaspb.com.br</a>
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

      const users = await base44.asServiceRole.entities.User.filter({ 
        email: email.toLowerCase() 
      });
      
      if (users.length === 0) {
        return Response.json({ 
          success: false, 
          error: 'Email não encontrado' 
        }, { status: 404 });
      }

      const user = users[0];

      if (user.emailVerified) {
        return Response.json({ 
          success: false, 
          error: 'Email já verificado' 
        }, { status: 400 });
      }

      // Gerar novo token
      const verificationToken = crypto.randomUUID();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await base44.asServiceRole.entities.User.update(user.id, {
        verificationToken,
        verificationTokenExpiry
      });

      const verificationLink = `${new URL(req.url).origin}/?page=VerifyEmail&token=${verificationToken}`;
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email.toLowerCase(),
        subject: 'Novo link de verificação - Vagas Abertas PB',
        body: `
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

      return Response.json({ 
        success: true, 
        message: 'Email de verificação reenviado!' 
      });
    }

    return Response.json({ 
      success: false, 
      error: 'Ação inválida' 
    }, { status: 400 });

  } catch (error) {
    console.error('[authManual] Erro:', error?.message || error);
    return Response.json({ 
      success: false, 
      error: error?.message || 'Erro no servidor. Tente novamente.' 
    }, { status: 500 });
  }
});