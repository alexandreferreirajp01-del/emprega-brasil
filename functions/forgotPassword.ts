import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Receber dados
    const { email } = await req.json();

    // Validar e-mail
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
      return Response.json({ 
        success: false, 
        error: 'E-mail não encontrado' 
      }, { status: 404 });
    }

    const user = users[0];
    
    // Gerar código temporário (6 dígitos)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Salvar código no usuário (expira em 1 hora)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.User.update(user.id, {
      reset_password_code: resetCode,
      reset_password_expires: expiresAt
    });

    // Enviar e-mail com código
    await base44.integrations.Core.SendEmail({
      to: email.toLowerCase(),
      subject: 'Redefinir Senha - Vagas Abertas Paraíba',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0056ff 0%, #0044cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Vagas Abertas Paraíba</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Redefinir Senha</h2>
            
            <p style="color: #555; line-height: 1.6;">
              Olá, <strong>${user.full_name || 'usuário'}</strong>!
            </p>
            
            <p style="color: #555; line-height: 1.6;">
              Você solicitou a redefinição de senha. Use o código abaixo para criar uma nova senha:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #0056ff;">
              <h1 style="color: #0056ff; margin: 0; font-size: 36px; letter-spacing: 5px;">
                ${resetCode}
              </h1>
            </div>
            
            <p style="color: #888; font-size: 14px; line-height: 1.6;">
              Este código expira em <strong>1 hora</strong>.<br>
              Se você não solicitou esta alteração, ignore este e-mail.
            </p>
            
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

    return Response.json({
      success: true,
      message: 'Código enviado por e-mail!'
    });

  } catch (error) {
    console.error('Erro ao enviar código:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Erro ao enviar e-mail. Tente novamente.' 
    }, { status: 500 });
  }
});