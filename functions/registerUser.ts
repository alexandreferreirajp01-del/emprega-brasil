import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { full_name, username, email, phone, city, state, password } = await req.json();

    // Validações
    if (!full_name || !username || !email || !password) {
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

    // Validar username único
    const usernameCheck = await base44.asServiceRole.entities.User.filter({ 
      username: username.toLowerCase() 
    });
    
    if (usernameCheck.length > 0) {
      return Response.json({ 
        success: false, 
        error: 'Nome de usuário já está em uso' 
      }, { status: 400 });
    }

    // Validar email único
    const emailCheck = await base44.asServiceRole.entities.User.filter({ 
      email: email.toLowerCase() 
    });
    
    if (emailCheck.length > 0) {
      return Response.json({ 
        success: false, 
        error: 'E-mail já está cadastrado' 
      }, { status: 400 });
    }

    // Criar usuário no banco
    const newUser = await base44.asServiceRole.entities.User.create({
      full_name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone: phone || '',
      city: city || '',
      state: state || 'PB',
      subscription_type: 'basic',
      basic_activated_at: new Date().toISOString(),
      theme: 'light'
    });

    // Enviar email de boas-vindas
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: 'Bem-vindo ao Vagas Abertas Paraíba!',
        body: `
          <h2>Olá, ${full_name}!</h2>
          <p>Sua conta foi criada com sucesso!</p>
          <p><strong>Login:</strong> ${username}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>Você pode entrar usando seu login ou email + senha.</p>
          <p>Acesse: https://vagasabertasparaiba.info</p>
        `
      });
    } catch (emailError) {
      console.log('Erro ao enviar email:', emailError);
    }

    return Response.json({ 
      success: true, 
      user: newUser,
      message: 'Conta criada com sucesso!' 
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Erro ao criar conta' 
    }, { status: 500 });
  }
});