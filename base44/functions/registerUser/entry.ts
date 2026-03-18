import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Receber dados do formulário
    const { full_name, email, phone, city, state, password } = await req.json();

    // Validar campos obrigatórios
    if (!full_name || !email || !phone || !city || !password) {
      return Response.json({ 
        success: false, 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      }, { status: 400 });
    }

    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ 
        success: false, 
        error: 'E-mail inválido' 
      }, { status: 400 });
    }

    // Validar senha
    if (password.length < 6) {
      return Response.json({ 
        success: false, 
        error: 'Senha deve ter no mínimo 6 caracteres' 
      }, { status: 400 });
    }

    // Verificar se e-mail já existe
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
    if (existingUsers.length > 0) {
      return Response.json({ 
        success: false, 
        error: 'Este e-mail já está cadastrado' 
      }, { status: 400 });
    }

    // Criar usuário
    const newUser = await base44.asServiceRole.entities.User.create({
      full_name: full_name,
      email: email.toLowerCase(),
      phone: phone,
      city: city,
      state: state || 'PB',
      password: password,
      subscription_type: 'basic',
      access_status: 'approved'
    });

    // Ativar plano básico automaticamente
    await base44.asServiceRole.entities.Subscription.create({
      user_email: email.toLowerCase(),
      plan_type: 'basic',
      status: 'active',
      start_date: new Date().toISOString(),
      billing_cycle: 'monthly',
      auto_renew: true,
      amount: 0
    });

    // Notificar admins sobre novo usuário
    try {
      await base44.asServiceRole.functions.invoke('notifyNewUser', {
        user_email: email.toLowerCase(),
        user_name: full_name,
        user_type: 'basic',
        user_id: newUser.id,
        created_date: new Date().toISOString()
      });
    } catch (notifError) {
      console.error('Erro ao notificar admins:', notifError);
      // Não falhar o cadastro se a notificação falhar
    }

    // Enviar e-mail de boas-vindas
    try {
      await base44.integrations.Core.SendEmail({
        to: email.toLowerCase(),
        subject: 'Bem-vindo ao Vagas Abertas Paraíba!',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0056ff 0%, #0044cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Vagas Abertas Paraíba</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Olá, ${full_name}!</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Seja muito bem-vindo à maior plataforma de empregos da Paraíba! 🎉
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0056ff;">
                <h3 style="color: #0056ff; margin-top: 0;">Seus Dados de Cadastro:</h3>
                <p style="margin: 5px 0;"><strong>Nome:</strong> ${full_name}</p>
                <p style="margin: 5px 0;"><strong>E-mail:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Telefone:</strong> ${phone}</p>
                <p style="margin: 5px 0;"><strong>Cidade:</strong> ${city} - ${state || 'PB'}</p>
              </div>
              
              <p style="color: #555; line-height: 1.6;">
                Para acessar o aplicativo, faça login com sua conta Google usando o mesmo e-mail cadastrado.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vagas-abertas-paraiba-2af288b2.base44.app" 
                   style="background: #0056ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Acessar Agora
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center;">
                Equipe Vagas Abertas PB<br>
                CNPJ: 62.874.724/0001-11<br>
                rhvagasabertasparaiba@gmail.com
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
      // Não falhar o cadastro se o e-mail falhar
    }

    return Response.json({
      success: true,
      message: 'Conta criada com sucesso!',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name
      }
    });

  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Erro ao criar conta. Tente novamente.' 
    }, { status: 500 });
  }
});