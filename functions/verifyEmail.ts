import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ success: false, error: 'Token não fornecido' }, { status: 400 });
    }

    // Buscar usuário pelo token
    const users = await base44.asServiceRole.entities.User.filter({ verificationToken: token });

    if (users.length === 0) {
      return Response.json({ success: false, error: 'Token inválido' }, { status: 404 });
    }

    const user = users[0];

    // Verificar se já foi verificado
    if (user.emailVerified) {
      return Response.json({ success: false, error: 'Email já verificado' }, { status: 400 });
    }

    // Verificar expiração
    const now = new Date();
    const expiry = new Date(user.verificationTokenExpiry);

    if (now > expiry) {
      return Response.json({ 
        success: false, 
        error: 'Token expirado. Solicite um novo email de verificação.',
        expired: true 
      }, { status: 410 });
    }

    // Ativar conta
    await base44.asServiceRole.entities.User.update(user.id, {
      emailVerified: true,
      accountStatus: 'active',
      verificationToken: null,
      verificationTokenExpiry: null
    });

    // Enviar email de boas-vindas
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Vagas Abertas Paraíba - Bem-vindo! 🎉',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png" alt="Vagas Abertas Paraíba" style="width: 100px; height: 100px;">
            <h1 style="color: #0A66C2; margin-top: 20px;">Vagas Abertas Paraíba</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">🎉 Bem-vindo(a), ${user.nome}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Sua conta foi ativada com sucesso! Agora você tem acesso gratuito ao <strong>Plano Básico</strong> e pode:
            </p>
            
            <ul style="color: #666; font-size: 15px; line-height: 2;">
              <li>✅ Buscar milhares de vagas de emprego</li>
              <li>✅ Salvar suas vagas favoritas</li>
              <li>✅ Receber notificações de novas oportunidades</li>
              <li>✅ Acessar dicas de carreira e notícias</li>
              <li>✅ Participar da comunidade</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${new URL(req.url).origin}" style="background-color: #0A66C2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                Começar agora
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              💡 <strong>Dica:</strong> Para ter acesso a recursos premium como vagas exclusivas, currículo profissional e muito mais, considere fazer upgrade para o <strong>Plano Premium</strong>!
            </p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} Vagas Abertas Paraíba - Todos os direitos reservados
          </p>
        </div>
      `
    });

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