import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    console.log('[forgotPassword] Iniciando recuperação para:', email);

    // Validar email
    if (!email || !email.trim()) {
      return Response.json({ 
        success: false, 
        error: 'Digite seu e-mail' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ 
        success: false, 
        error: 'E-mail inválido' 
      }, { status: 400 });
    }

    // Buscar usuário
    const users = await base44.asServiceRole.entities.User.filter({ 
      email: email.toLowerCase() 
    });
    
    if (users.length === 0) {
      console.log('[forgotPassword] Email não encontrado:', email);
      return Response.json({ 
        success: false, 
        error: 'E-mail não cadastrado' 
      }, { status: 404 });
    }

    const user = users[0];
    console.log('[forgotPassword] Usuário encontrado:', user.id);
    
    // Gerar token único
    const resetToken = crypto.randomUUID();
    
    // Expira em 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    // Salvar token no usuário
    await base44.asServiceRole.entities.User.update(user.id, {
      reset_password_token: resetToken,
      reset_password_expires: expiresAt
    });

    console.log('[forgotPassword] Token salvo:', resetToken);

    // Gerar link de recuperação
    const resetLink = `${new URL(req.url).origin}/?page=ResetPassword&token=${resetToken}`;

    // Enviar e-mail
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email.toLowerCase(),
      subject: 'Recuperar Senha - Vagas Abertas PB',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1D4371 0%, #0F2744 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Vagas Abertas PB</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0;">Empregos na Paraíba</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Recuperar Senha</h2>
            
            <p style="color: #555; line-height: 1.6;">
              Olá, <strong>${user.full_name || user.nome || 'usuário'}</strong>!
            </p>
            
            <p style="color: #555; line-height: 1.6;">
              Você solicitou a recuperação de senha. Clique no botão abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #1D4371; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                Redefinir Minha Senha
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; line-height: 1.6; text-align: center;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${resetLink}" style="color: #1D4371; word-break: break-all; font-size: 12px;">${resetLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #888; font-size: 14px; line-height: 1.6;">
              ⏰ Este link expira em <strong>1 hora</strong>.<br>
              🔒 Se você não solicitou esta alteração, ignore este e-mail.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #888; font-size: 12px; text-align: center;">
              Equipe Vagas Abertas PB<br>
              CNPJ: 62.874.724/0001-11<br>
              contato@vagasabertaspb.com.br
            </p>
          </div>
        </div>
      `
    });

    console.log('[forgotPassword] Email enviado com sucesso');

    return Response.json({
      success: true,
      message: 'Email enviado! Verifique sua caixa de entrada.'
    });

  } catch (error) {
    console.error('[forgotPassword] Erro:', error);
    return Response.json({ 
      success: false, 
      error: 'Erro ao enviar e-mail. Tente novamente.' 
    }, { status: 500 });
  }
});