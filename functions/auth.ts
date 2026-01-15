import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Função unificada de autenticação
 * Suporta: manual_register, manual_login
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop(); // manual_register ou manual_login
    
    const body = await req.json();

    // ==================== REGISTRO MANUAL ====================
    if (action === 'manual_register') {
      const { custom_full_name, username, email, password } = body;

      // Validações
      if (!custom_full_name || !email || !password) {
        return Response.json({ 
          success: false, 
          error: 'Todos os campos obrigatórios devem ser preenchidos' 
        }, { status: 400 });
      }

      if (password.length < 6) {
        return Response.json({ 
          success: false, 
          error: 'Senha deve ter no mínimo 6 caracteres' 
        }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json({ 
          success: false, 
          error: 'E-mail inválido' 
        }, { status: 400 });
      }

      // Verificar se e-mail já existe
      const existingUsers = await base44.asServiceRole.entities.User.filter({ 
        email: email.toLowerCase() 
      });
      
      if (existingUsers && existingUsers.length > 0) {
        return Response.json({ 
          success: false, 
          error: 'Este e-mail já está cadastrado. Faça login.' 
        }, { status: 400 });
      }

      // Verificar se username já existe
      if (username) {
        const existingUsername = await base44.asServiceRole.entities.User.filter({ 
          username: username.toLowerCase() 
        });
        if (existingUsername && existingUsername.length > 0) {
          return Response.json({ 
            success: false, 
            error: 'Nome de usuário já existe. Escolha outro.' 
          }, { status: 400 });
        }
      }

      // Criar usuário usando signup do Base44
      try {
        // Usar o signup nativo do Base44
        const signupData = {
          email: email.toLowerCase(),
          password: password,
          full_name: custom_full_name
        };

        // Criar conta
        await base44.auth.signUp(signupData);

        // Buscar usuário criado
        const newUsers = await base44.asServiceRole.entities.User.filter({ 
          email: email.toLowerCase() 
        });
        
        if (newUsers && newUsers.length > 0) {
          const newUser = newUsers[0];
          
          // Atualizar com dados adicionais
          await base44.asServiceRole.entities.User.update(newUser.id, {
            username: username?.toLowerCase(),
            subscription_type: 'basic',
            access_status: 'approved'
          });

          // Enviar e-mail de boas-vindas
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: email.toLowerCase(),
              subject: '🎉 Bem-vindo ao Emprega Brasil+!',
              body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #0A66C2 0%, #004182 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Emprega Brasil+</h1>
                  </div>
                  
                  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Olá, ${custom_full_name}! 👋</h2>
                    
                    <p style="color: #555; line-height: 1.6;">
                      Sua conta foi criada com sucesso! Agora você tem acesso a milhares de oportunidades de emprego em todo o Brasil.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0A66C2;">
                      <h3 style="color: #0A66C2; margin-top: 0;">✅ Conta Ativada</h3>
                      <p style="margin: 5px 0;"><strong>Nome:</strong> ${custom_full_name}</p>
                      <p style="margin: 5px 0;"><strong>E-mail:</strong> ${email}</p>
                      <p style="margin: 5px 0;"><strong>Plano:</strong> Básico (Gratuito)</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${Deno.env.get('BASE44_APP_URL') || 'https://empregabrasil.app'}" 
                         style="background: #0A66C2; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                        🚀 Acessar Plataforma
                      </a>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6; font-size: 14px;">
                      Você pode fazer login usando seu e-mail e senha, ou através da sua conta Google/Apple.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p style="color: #888; font-size: 12px; text-align: center;">
                      Equipe Emprega Brasil+<br>
                      CNPJ: 62.874.724/0001-11<br>
                      rhvagasabertasparaiba@gmail.com
                    </p>
                  </div>
                </div>
              `
            });
          } catch (emailError) {
            console.error('Erro ao enviar e-mail:', emailError);
          }

          return Response.json({
            success: true,
            message: 'Conta criada com sucesso! Verifique seu e-mail.',
            user: {
              id: newUser.id,
              email: newUser.email,
              full_name: newUser.full_name
            }
          });
        }

        return Response.json({
          success: true,
          message: 'Conta criada! Faça login para continuar.'
        });

      } catch (signupError) {
        console.error('Erro no signup:', signupError);
        
        if (signupError.message?.includes('already registered')) {
          return Response.json({ 
            success: false, 
            error: 'Este e-mail já está cadastrado. Faça login.' 
          }, { status: 400 });
        }
        
        return Response.json({ 
          success: false, 
          error: signupError.message || 'Erro ao criar conta. Tente novamente.' 
        }, { status: 500 });
      }
    }

    // ==================== LOGIN MANUAL ====================
    if (action === 'manual_login') {
      const { email, password } = body;

      if (!email || !password) {
        return Response.json({ 
          success: false, 
          error: 'E-mail e senha são obrigatórios' 
        }, { status: 400 });
      }

      try {
        // Tentar fazer login
        await base44.auth.signIn({
          email: email.toLowerCase(),
          password: password
        });

        // Buscar dados do usuário
        const users = await base44.asServiceRole.entities.User.filter({ 
          email: email.toLowerCase() 
        });

        if (users && users.length > 0) {
          return Response.json({
            success: true,
            message: 'Login realizado com sucesso!',
            user: users[0]
          });
        }

        return Response.json({
          success: true,
          message: 'Login realizado com sucesso!'
        });

      } catch (loginError) {
        console.error('Erro no login:', loginError);
        return Response.json({ 
          success: false, 
          error: 'E-mail ou senha incorretos' 
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
      error: error.message || 'Erro no servidor. Tente novamente.' 
    }, { status: 500 });
  }
});