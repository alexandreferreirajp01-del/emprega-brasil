import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Não autenticado' 
      }, { status: 401 });
    }

    // Receber dados
    const { currentPassword, newPassword } = await req.json();

    // Validar campos
    if (!currentPassword || !newPassword) {
      return Response.json({ 
        success: false, 
        error: 'Preencha todos os campos' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ 
        success: false, 
        error: 'Nova senha deve ter no mínimo 6 caracteres' 
      }, { status: 400 });
    }

    // Buscar usuário e verificar senha atual
    const users = await base44.asServiceRole.entities.User.filter({ 
      email: user.email,
      password: currentPassword 
    });

    if (users.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Senha atual incorreta' 
      }, { status: 400 });
    }

    // Atualizar senha
    await base44.asServiceRole.entities.User.update(users[0].id, {
      password: newPassword,
      password_updated_at: new Date().toISOString()
    });

    // Enviar e-mail de confirmação
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Senha Alterada - Vagas Abertas Paraíba',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Vagas Abertas Paraíba</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Senha Alterada!</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Olá, <strong>${user.full_name}</strong>!
              </p>
              
              <p style="color: #555; line-height: 1.6;">
                Sua senha foi alterada com sucesso em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.
              </p>
              
              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46;">
                  ✓ Sua conta está segura
                </p>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6;">
                Se você não fez esta alteração, entre em contato conosco imediatamente.
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
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
    }

    return Response.json({
      success: true,
      message: 'Senha alterada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Erro ao alterar senha. Tente novamente.' 
    }, { status: 500 });
  }
});