import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json();
    const { action } = body;

    // ===== SOLICITAR RESET =====
    if (action === 'request_reset') {
      const { email } = body;

      if (!email) {
        return Response.json({ success: false, error: 'Email é obrigatório' }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.User.filter({ email });

      if (users.length === 0) {
        // Por segurança, retornar sucesso mesmo se email não existir
        return Response.json({ 
          success: true, 
          message: 'Se esse email existe, você receberá um link de recuperação.' 
        });
      }

      const user = users[0];

      // Verificar se é conta por senha
      if (user.authProvider !== 'password') {
        return Response.json({ 
          success: false, 
          error: `Esta conta usa login via ${user.authProvider}. Use o botão "${user.authProvider}" para entrar.` 
        }, { status: 400 });
      }

      // Gerar token de reset
      const resetToken = crypto.randomUUID();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

      await base44.asServiceRole.entities.User.update(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry
      });

      const resetLink = `${new URL(req.url).origin}/reset-password?token=${resetToken}`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: 'Emprega Brasil+ - Redefinir senha',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/704fcb47f_file_000000001aec71f583d94b71860e2dbd.png" alt="Emprega Brasil+" style="width: 100px; height: 100px;">
              <h1 style="color: #0A66C2; margin-top: 20px;">Emprega Brasil+</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">🔑 Redefinir senha</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Olá, ${user.nome}! Recebemos uma solicitação para redefinir sua senha.
              </p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #0A66C2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Redefinir minha senha
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px;">
                ⚠️ Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este email e sua senha permanecerá inalterada.
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
        message: 'Se esse email existe, você receberá um link de recuperação.' 
      });
    }

    // ===== VALIDAR TOKEN =====
    if (action === 'validate_token') {
      const { token } = body;

      const users = await base44.asServiceRole.entities.User.filter({ resetPasswordToken: token });

      if (users.length === 0) {
        return Response.json({ success: false, error: 'Token inválido' }, { status: 404 });
      }

      const user = users[0];
      const now = new Date();
      const expiry = new Date(user.resetPasswordExpiry);

      if (now > expiry) {
        return Response.json({ success: false, error: 'Token expirado', expired: true }, { status: 410 });
      }

      return Response.json({ success: true, email: user.email });
    }

    // ===== RESETAR SENHA =====
    if (action === 'reset_password') {
      const { token, newPassword } = body;

      if (!newPassword || newPassword.length < 6) {
        return Response.json({ success: false, error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.User.filter({ resetPasswordToken: token });

      if (users.length === 0) {
        return Response.json({ success: false, error: 'Token inválido' }, { status: 404 });
      }

      const user = users[0];
      const now = new Date();
      const expiry = new Date(user.resetPasswordExpiry);

      if (now > expiry) {
        return Response.json({ success: false, error: 'Token expirado', expired: true }, { status: 410 });
      }

      // Hash nova senha
      const senhaHash = await bcrypt.hash(newPassword, 10);

      await base44.asServiceRole.entities.User.update(user.id, {
        senhaHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      });

      // Enviar confirmação por email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Emprega Brasil+ - Senha alterada',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>✅ Senha alterada com sucesso</h2>
            <p>Olá, ${user.nome}!</p>
            <p>Sua senha foi alterada com sucesso. Agora você já pode fazer login com sua nova senha.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">Se você não fez essa alteração, entre em contato com o suporte imediatamente.</p>
          </div>
        `
      });

      return Response.json({ success: true, message: 'Senha alterada com sucesso!' });
    }

    return Response.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro em resetPassword:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});