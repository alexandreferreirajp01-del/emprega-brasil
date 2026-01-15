import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);

  try {
    // ==================== CONFIRMAR EMAIL (GET) ====================
    if (req.method === 'GET' && url.pathname.includes('confirm_email')) {
      const token = url.searchParams.get('token');
      
      if (!token) {
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Erro - Emprega Brasil+</title>
          </head>
          <body style="font-family: Arial, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px;">
              <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
              <h1 style="color: #dc3545; margin: 0 0 15px 0;">Link Inválido</h1>
              <p style="color: #666;">Token de confirmação não encontrado.</p>
            </div>
          </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' }, status: 400 });
      }

      const users = await base44.asServiceRole.entities.User.filter({ confirmation_token: token });

      if (!users || users.length === 0) {
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Link Expirado - Emprega Brasil+</title>
          </head>
          <body style="font-family: Arial, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px;">
              <div style="font-size: 60px; margin-bottom: 20px;">⏰</div>
              <h1 style="color: #ffc107; margin: 0 0 15px 0;">Link Expirado</h1>
              <p style="color: #666; margin-bottom: 30px;">Este link já foi usado ou expirou.</p>
              <a href="https://empregabrasil.app" style="display: inline-block; background: #0A66C2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Voltar ao Site</a>
            </div>
          </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      const user = users[0];

      await base44.asServiceRole.entities.User.update(user.id, {
        access_status: 'approved',
        email_confirmed: true,
        confirmation_token: null
      });

      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Conta Ativada - Emprega Brasil+</title>
          <script>
            setTimeout(() => { window.location.href = 'https://empregabrasil.app'; }, 3000);
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #0A66C2 0%, #004182 100%); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
          <div style="background: white; padding: 50px; border-radius: 15px; text-align: center; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
            <h1 style="color: #28a745; margin: 0 0 15px 0; font-size: 32px;">Conta Ativada!</h1>
            <p style="color: #666; margin-bottom: 10px; font-size: 18px;">Bem-vindo, <strong>${user.full_name}</strong>!</p>
            <p style="color: #888; margin-bottom: 30px;">Redirecionando...</p>
            <a href="https://empregabrasil.app" style="display: inline-block; background: #0A66C2; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">Acessar Agora</a>
          </div>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // ==================== POST REQUESTS ====================
    if (req.method !== 'POST') {
      return Response.json({ success: false, error: 'Método não permitido' }, { status: 405 });
    }

    const body = await req.json();
    const action = body.action;

    // ==================== REGISTRO MANUAL ====================
    if (action === 'manual_register') {
      const { custom_full_name, username, email, password, phone, city, state } = body;

      if (!custom_full_name || !email || !password) {
        return Response.json({ success: false, error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 });
      }

      if (password.length < 6) {
        return Response.json({ success: false, error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        return Response.json({ success: false, error: 'E-mail inválido' }, { status: 400 });
      }

      const existingByEmail = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
      if (existingByEmail && existingByEmail.length > 0) {
        return Response.json({ success: false, error: 'Este e-mail já está cadastrado' }, { status: 400 });
      }

      if (username) {
        const existingByUsername = await base44.asServiceRole.entities.User.filter({ username: username.toLowerCase() });
        if (existingByUsername && existingByUsername.length > 0) {
          return Response.json({ success: false, error: 'Nome de usuário já existe' }, { status: 400 });
        }
      }

      const confirmToken = crypto.randomUUID();

      const newUser = await base44.asServiceRole.entities.User.create({
        full_name: custom_full_name,
        username: username?.toLowerCase() || null,
        email: email.toLowerCase(),
        phone: phone || null,
        city: city || null,
        state: state || null,
        password: password,
        subscription_type: 'basic',
        access_status: 'pending',
        email_confirmed: false,
        confirmation_token: confirmToken
      });

      const confirmUrl = `https://empregabrasil.app/api/functions/auth/confirm_email?token=${confirmToken}`;
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email.toLowerCase(),
        subject: '✅ Confirme seu cadastro - Emprega Brasil+',
        body: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #0A66C2 0%, #004182 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Emprega Brasil+</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0;">Olá, ${custom_full_name}! 👋</h2>
                <p style="color: #555; line-height: 1.6;">Você está a apenas um clique de ativar sua conta.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmUrl}" style="display: inline-block; background: #0A66C2; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">✅ Confirmar Cadastro</a>
                </div>
                <p style="color: #666; font-size: 14px;">Ou copie e cole este link: <a href="${confirmUrl}" style="color: #0A66C2;">${confirmUrl}</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      return Response.json({
        success: true,
        message: 'Cadastro criado! Verifique seu e-mail.',
        user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name }
      });
    }

    // ==================== LOGIN MANUAL ====================
    if (action === 'manual_login') {
      const { username, password } = body;

      if (!username || !password) {
        return Response.json({ success: false, error: 'E-mail/usuário e senha são obrigatórios' }, { status: 400 });
      }

      let user = null;
      
      const usersByEmail = await base44.asServiceRole.entities.User.filter({ email: username.toLowerCase() });
      if (usersByEmail && usersByEmail.length > 0) {
        user = usersByEmail[0];
      } else {
        const usersByUsername = await base44.asServiceRole.entities.User.filter({ username: username.toLowerCase() });
        if (usersByUsername && usersByUsername.length > 0) {
          user = usersByUsername[0];
        }
      }

      if (!user) {
        return Response.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
      }

      if (!user.email_confirmed) {
        return Response.json({ success: false, error: 'Confirme seu e-mail antes de fazer login' }, { status: 403 });
      }

      await base44.auth.signIn({ email: user.email, password: password });

      return Response.json({
        success: true,
        message: 'Login realizado com sucesso!',
        user: { id: user.id, email: user.email, full_name: user.full_name }
      });
    }

    return Response.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na função auth:', error);
    return Response.json({ success: false, error: error.message || 'Erro no servidor' }, { status: 500 });
  }
});