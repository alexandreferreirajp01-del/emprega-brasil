import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json();
    const { action } = body;

    // ===== REGISTRO =====
    if (action === 'register') {
      const { nome, sobrenome, idade, localidade, username, email, telefone, password } = body;

      // Validações
      if (!nome || !sobrenome || !idade || !localidade || !username || !email || !telefone || !password) {
        return Response.json({ success: false, error: 'Todos os campos são obrigatórios' }, { status: 400 });
      }

      if (idade < 14) {
        return Response.json({ success: false, error: 'Você precisa ter pelo menos 14 anos' }, { status: 400 });
      }

      if (username.length < 3 || /\s/.test(username)) {
        return Response.json({ success: false, error: 'Username deve ter no mínimo 3 caracteres e não pode conter espaços' }, { status: 400 });
      }

      if (password.length < 6) {
        return Response.json({ success: false, error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }

      // Verificar se username já existe
      const existingUsername = await base44.asServiceRole.entities.User.filter({ username });
      if (existingUsername.length > 0) {
        return Response.json({ success: false, error: 'Esse nome de usuário já está em uso. Tente outro.' }, { status: 400 });
      }

      // Verificar se email já existe
      const existingEmail = await base44.asServiceRole.entities.User.filter({ email });
      if (existingEmail.length > 0) {
        const user = existingEmail[0];
        if (user.authProvider !== 'password') {
          return Response.json({ 
            success: false, 
            error: `Esse email já possui conta via ${user.authProvider}. Faça login por ${user.authProvider} ou use outro email.` 
          }, { status: 400 });
        } else {
          return Response.json({ success: false, error: 'Email já cadastrado' }, { status: 400 });
        }
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(password, 10);

      // Gerar token de verificação
      const verificationToken = crypto.randomUUID();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

      // Criar usuário no sistema Base44 (email, full_name, role são built-in)
      const newUser = await base44.asServiceRole.entities.User.create({
        nome,
        sobrenome,
        idade,
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

      // Enviar email de verificação
      const verificationLink = `${new URL(req.url).origin}/verify-email?token=${verificationToken}`;
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: 'Emprega Brasil+ - Confirme seu cadastro',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/704fcb47f_file_000000001aec71f583d94b71860e2dbd.png" alt="Emprega Brasil+" style="width: 100px; height: 100px;">
              <h1 style="color: #0A66C2; margin-top: 20px;">Emprega Brasil+</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Olá, ${nome}!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Obrigado por se cadastrar no <strong>Emprega Brasil+</strong>! 
              </p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Para ativar sua conta e começar a procurar vagas de emprego, por favor confirme seu email clicando no botão abaixo:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #0A66C2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Validar meu cadastro
                </a>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px;">
                <h3 style="color: #333; font-size: 14px; margin-bottom: 10px;">📋 Seus dados:</h3>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>Nome:</strong> ${nome} ${sobrenome}</p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>Username:</strong> ${username}</p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>Localidade:</strong> ${localidade}</p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>Telefone:</strong> ${telefone}</p>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
                ⚠️ Este link expira em 24 horas. Se você não solicitou este cadastro, ignore este email.
              </p>
            </div>
            
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
              © ${new Date().getFullYear()} Emprega Brasil+ - Todos os direitos reservados
            </p>
          </div>
        `
      });

      return Response.json({ 
        success: true, 
        message: 'Cadastro realizado! Verifique seu email para ativar sua conta.',
        userId: newUser.id 
      });
    }

    // ===== LOGIN =====
    if (action === 'login') {
      const { identifier, password } = body; // identifier pode ser email ou username

      if (!identifier || !password) {
        return Response.json({ success: false, error: 'Preencha todos os campos' }, { status: 400 });
      }

      // Buscar usuário por email ou username
      const users = await base44.asServiceRole.entities.User.filter({
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      });

      if (users.length === 0) {
        return Response.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
      }

      const user = users[0];

      // Verificar se é conta por senha
      if (user.authProvider !== 'password' || !user.senhaHash) {
        return Response.json({ 
          success: false, 
          error: `Esta conta usa login via ${user.authProvider}. Use o botão "${user.authProvider}" para entrar.` 
        }, { status: 400 });
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, user.senhaHash);
      if (!passwordMatch) {
        return Response.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
      }

      // Verificar se email foi verificado
      if (!user.emailVerified) {
        return Response.json({ 
          success: false, 
          error: 'Email não verificado. Verifique seu email ou solicite um novo link.',
          needsVerification: true 
        }, { status: 403 });
      }

      // Verificar se conta está ativa
      if (user.accountStatus !== 'active') {
        return Response.json({ 
          success: false, 
          error: 'Conta bloqueada ou pendente. Entre em contato com o suporte.' 
        }, { status: 403 });
      }

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

    // ===== VERIFICAR USERNAME DISPONÍVEL =====
    if (action === 'check_username') {
      const { username } = body;
      const existing = await base44.asServiceRole.entities.User.filter({ username });
      return Response.json({ available: existing.length === 0 });
    }

    // ===== REENVIAR EMAIL DE VERIFICAÇÃO =====
    if (action === 'resend_verification') {
      const { email } = body;

      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users.length === 0) {
        return Response.json({ success: false, error: 'Email não encontrado' }, { status: 404 });
      }

      const user = users[0];

      if (user.emailVerified) {
        return Response.json({ success: false, error: 'Email já verificado' }, { status: 400 });
      }

      // Gerar novo token
      const verificationToken = crypto.randomUUID();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await base44.asServiceRole.entities.User.update(user.id, {
        verificationToken,
        verificationTokenExpiry
      });

      const verificationLink = `${new URL(req.url).origin}/verify-email?token=${verificationToken}`;
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: 'Emprega Brasil+ - Novo link de verificação',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Olá, ${user.nome}!</h2>
            <p>Aqui está seu novo link de verificação:</p>
            <a href="${verificationLink}" style="background-color: #0A66C2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
              Validar meu cadastro
            </a>
            <p style="color: #999; font-size: 12px;">Este link expira em 24 horas.</p>
          </div>
        `
      });

      return Response.json({ success: true, message: 'Email de verificação reenviado!' });
    }

    return Response.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro em authManual:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});