import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Função unificada de autenticação
 * Suporta: manual_register, manual_login, confirm_email
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();
    
    const body = await req.json();

    // ==================== REGISTRO MANUAL ====================
    if (action === 'manual_register') {
      const { custom_full_name, username, email, password, phone, city, state } = body;

      // Validações básicas
      if (!custom_full_name || !email || !password) {
        return Response.json({ 
          success: false, 
          error: 'Nome, e-mail e senha são obrigatórios' 
        }, { status: 400 });
      }

      if (password.length < 6) {
        return Response.json({ 
          success: false, 
          error: 'Senha deve ter no mínimo 6 caracteres' 
        }, { status: 400 });
      }

      // Validação de email mais flexível
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        return Response.json({ 
          success: false, 
          error: 'E-mail inválido' 
        }, { status: 400 });
      }

      // Verificar duplicados
      const existingByEmail = await base44.asServiceRole.entities.User.filter({ 
        email: email.toLowerCase() 
      });
      
      if (existingByEmail && existingByEmail.length > 0) {
        return Response.json({ 
          success: false, 
          error: 'Este e-mail já está cadastrado' 
        }, { status: 400 });
      }

      if (username) {
        const existingByUsername = await base44.asServiceRole.entities.User.filter({ 
          username: username.toLowerCase() 
        });
        if (existingByUsername && existingByUsername.length > 0) {
          return Response.json({ 
            success: false, 
            error: 'Nome de usuário já existe' 
          }, { status: 400 });
        }
      }

      // Gerar token de confirmação
      const confirmToken = crypto.randomUUID();
      const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://empregabrasil.app';

      try {
        // Criar usuário pendente
        const newUser = await base44.asServiceRole.entities.User.create({
          full_name: custom_full_name,
          username: username?.toLowerCase() || null,
          email: email.toLowerCase(),
          phone: phone || null,
          city: city || null,
          state: state || null,
          password: password,
          subscription_type: 'basic',
          access_status: 'pending', // Pendente até confirmar email
          email_confirmed: false,
          confirmation_token: confirmToken
        });

        // Enviar email de confirmação
        const confirmUrl = `${appUrl}/api/functions/auth/confirm_email?token=${confirmToken}`;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email.toLowerCase(),
          subject: '✅ Confirme seu cadastro - Emprega Brasil+',
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #0A66C2 0%, #004182 100%); padding: 40px 20px; text-align: center;">
                          <h1 style="color: white; margin: 0; font-size: 28px;">Emprega Brasil+</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Oportunidades em Todo o País</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${custom_full_name}! 👋</h2>
                          
                          <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                            Você está a apenas <strong>um clique</strong> de ativar sua conta e ter acesso a milhares de vagas de emprego em todo o Brasil.
                          </p>
                          
                          <!-- Dados Cadastrados -->
                          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0A66C2;">
                            <h3 style="color: #0A66C2; margin: 0 0 15px 0; font-size: 18px;">📋 Seus Dados Cadastrados:</h3>
                            <table width="100%" cellpadding="5" cellspacing="0">
                              <tr>
                                <td style="color: #666; font-size: 14px; padding: 5px 0;"><strong>Nome:</strong></td>
                                <td style="color: #333; font-size: 14px; padding: 5px 0;">${custom_full_name}</td>
                              </tr>
                              ${username ? `
                              <tr>
                                <td style="color: #666; font-size: 14px; padding: 5px 0;"><strong>Usuário:</strong></td>
                                <td style="color: #333; font-size: 14px; padding: 5px 0;">${username}</td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="color: #666; font-size: 14px; padding: 5px 0;"><strong>E-mail:</strong></td>
                                <td style="color: #333; font-size: 14px; padding: 5px 0;">${email}</td>
                              </tr>
                              ${phone ? `
                              <tr>
                                <td style="color: #666; font-size: 14px; padding: 5px 0;"><strong>Telefone:</strong></td>
                                <td style="color: #333; font-size: 14px; padding: 5px 0;">${phone}</td>
                              </tr>
                              ` : ''}
                              ${city && state ? `
                              <tr>
                                <td style="color: #666; font-size: 14px; padding: 5px 0;"><strong>Localização:</strong></td>
                                <td style="color: #333; font-size: 14px; padding: 5px 0;">${city} - ${state}</td>
                              </tr>
                              ` : ''}
                            </table>
                          </div>
                          
                          <!-- Botão de Confirmação -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                            <tr>
                              <td align="center">
                                <a href="${confirmUrl}" style="display: inline-block; background: #0A66C2; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(10,102,194,0.3);">
                                  ✅ Confirmar Cadastro
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                            Ou copie e cole este link no seu navegador:<br>
                            <a href="${confirmUrl}" style="color: #0A66C2; word-break: break-all;">${confirmUrl}</a>
                          </p>
                          
                          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0;">
                            <p style="color: #856404; margin: 0; font-size: 13px;">
                              ⏰ Este link expira em 24 horas. Se não foi você quem solicitou, ignore este e-mail.
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                          <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">
                            Equipe Emprega Brasil+
                          </p>
                          <p style="color: #888; font-size: 12px; margin: 0;">
                            CNPJ: 62.874.724/0001-11 | rhvagasabertasparaiba@gmail.com
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        });

        return Response.json({
          success: true,
          message: 'Cadastro criado! Verifique seu e-mail para confirmar.',
          user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name
          }
        });

      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return Response.json({ 
          success: false, 
          error: error.message || 'Erro ao criar conta' 
        }, { status: 500 });
      }
    }

    // ==================== CONFIRMAR EMAIL ====================
    if (action === 'confirm_email') {
      const token = url.searchParams.get('token');
      
      if (!token) {
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Erro - Emprega Brasil+</title>
          </head>
          <body style="font-family: Arial, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px;">
              <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
              <h1 style="color: #dc3545; margin: 0 0 15px 0;">Link Inválido</h1>
              <p style="color: #666; margin-bottom: 30px;">Token de confirmação não encontrado.</p>
            </div>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' },
          status: 400
        });
      }

      try {
        const users = await base44.asServiceRole.entities.User.filter({ 
          confirmation_token: token 
        });

        if (!users || users.length === 0) {
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Erro - Emprega Brasil+</title>
            </head>
            <body style="font-family: Arial, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
              <div style="background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px;">
                <div style="font-size: 60px; margin-bottom: 20px;">⏰</div>
                <h1 style="color: #ffc107; margin: 0 0 15px 0;">Link Expirado</h1>
                <p style="color: #666; margin-bottom: 30px;">Este link já foi usado ou expirou. Tente se cadastrar novamente.</p>
                <a href="${Deno.env.get('BASE44_APP_URL') || 'https://empregabrasil.app'}" style="display: inline-block; background: #0A66C2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Voltar ao Site</a>
              </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        }

        const user = users[0];

        // Ativar conta
        await base44.asServiceRole.entities.User.update(user.id, {
          access_status: 'approved',
          email_confirmed: true,
          confirmation_token: null
        });

        const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://empregabrasil.app';

        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Conta Ativada - Emprega Brasil+</title>
            <script>
              setTimeout(() => {
                window.location.href = '${appUrl}';
              }, 3000);
            </script>
          </head>
          <body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #0A66C2 0%, #004182 100%); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: white; padding: 50px; border-radius: 15px; text-align: center; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
              <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
              <h1 style="color: #28a745; margin: 0 0 15px 0; font-size: 32px;">Conta Ativada!</h1>
              <p style="color: #666; margin-bottom: 10px; font-size: 18px;">Bem-vindo, <strong>${user.full_name}</strong>!</p>
              <p style="color: #888; margin-bottom: 30px;">Redirecionando para o aplicativo...</p>
              <div style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; margin-bottom: 20px;">
                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #0A66C2, #28a745); animation: loading 3s linear;"></div>
              </div>
              <a href="${appUrl}" style="display: inline-block; background: #0A66C2; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Acessar Agora</a>
            </div>
            <style>
              @keyframes loading {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
            </style>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });

      } catch (error) {
        console.error('Erro ao confirmar email:', error);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Erro - Emprega Brasil+</title>
          </head>
          <body style="font-family: Arial, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px;">
              <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
              <h1 style="color: #dc3545; margin: 0 0 15px 0;">Erro</h1>
              <p style="color: #666; margin-bottom: 30px;">Ocorreu um erro ao confirmar seu cadastro. Tente novamente.</p>
            </div>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' },
          status: 500
        });
      }
    }

    // ==================== LOGIN MANUAL ====================
    if (action === 'manual_login') {
      const { username, password } = body;

      if (!username || !password) {
        return Response.json({ 
          success: false, 
          error: 'E-mail/usuário e senha são obrigatórios' 
        }, { status: 400 });
      }

      try {
        // Buscar usuário por email ou username
        let user = null;
        
        // Tentar por email primeiro
        const usersByEmail = await base44.asServiceRole.entities.User.filter({ 
          email: username.toLowerCase() 
        });
        
        if (usersByEmail && usersByEmail.length > 0) {
          user = usersByEmail[0];
        } else {
          // Tentar por username
          const usersByUsername = await base44.asServiceRole.entities.User.filter({ 
            username: username.toLowerCase() 
          });
          if (usersByUsername && usersByUsername.length > 0) {
            user = usersByUsername[0];
          }
        }

        if (!user) {
          return Response.json({ 
            success: false, 
            error: 'Usuário não encontrado' 
          }, { status: 404 });
        }

        // Verificar se email foi confirmado
        if (!user.email_confirmed) {
          return Response.json({ 
            success: false, 
            error: 'Confirme seu e-mail antes de fazer login' 
          }, { status: 403 });
        }

        // Fazer login
        await base44.auth.signIn({
          email: user.email,
          password: password
        });

        return Response.json({
          success: true,
          message: 'Login realizado com sucesso!',
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name
          }
        });

      } catch (loginError) {
        console.error('Erro no login:', loginError);
        return Response.json({ 
          success: false, 
          error: 'Usuário ou senha incorretos' 
        }, { status: 401 });
      }
    }

    return Response.json({ 
      success: false, 
      error: 'Ação inválida' 
    }, { status: 400 });

  } catch (error) {
    console.error('Erro na função auth:', error);
    return Response.json({ 
      success: false, 
      error: 'Erro no servidor. Tente novamente.' 
    }, { status: 500 });
  }
});