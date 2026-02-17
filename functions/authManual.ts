import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

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
        const verificationLink = `${new URL(req.url).origin}/?page=VerifyEmail&token=${verificationToken}`;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email.toLowerCase(),
          subject: 'Confirme seu cadastro - Vagas Abertas PB',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1D4371 0%, #0F2744 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Vagas Abertas PB</h1>
                <p style="color: #e0e0e0; margin: 10px 0 0 0;">Empregos na Paraíba</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333;">Olá, ${nome}! 👋</h2>
                
                <p style="color: #555; line-height: 1.6;">
                  Obrigado por se cadastrar no <strong>Vagas Abertas PB</strong>! 
                </p>
                
                <p style="color: #555; line-height: 1.6;">
                  Para ativar sua conta, clique no botão abaixo:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationLink}" style="background-color: #1D4371; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                    Ativar Minha Conta
                  </a>
                </div>
                
                <p style="color: #888; font-size: 14px;">
                  ⏰ Este link expira em 24 horas.<br>
                  🔒 Se você não se cadastrou, ignore este email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #888; font-size: 12px; text-align: center;">
                  Equipe Vagas Abertas PB<br>
                  CNPJ: 62.874.724/0001-11
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
    console.error('[authManual] Erro:', error);
    return Response.json({ 
      success: false, 
      error: 'Erro no servidor. Tente novamente.' 
    }, { status: 500 });
  }
});