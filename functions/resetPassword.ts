import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import bcryptjs from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, token, newPassword } = await req.json();

    console.log('[resetPassword] Action:', action);

    if (action === 'validate_token') {
      if (!token) {
        return Response.json({ success: false, error: 'Token inválido' }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.ManualUser.filter({ resetPasswordToken: token });

      if (users.length === 0) {
        return Response.json({ success: false, error: 'Link inválido ou já utilizado' }, { status: 404 });
      }

      const user = users[0];

      if (new Date(user.resetPasswordExpiry) < new Date()) {
        return Response.json({ success: false, error: 'Link expirado', expired: true }, { status: 400 });
      }

      return Response.json({ success: true, email: user.email });
    }

    if (action === 'reset_password') {
      if (!token || !newPassword) {
        return Response.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return Response.json({ success: false, error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.ManualUser.filter({ resetPasswordToken: token });

      if (users.length === 0) {
        return Response.json({ success: false, error: 'Link inválido' }, { status: 404 });
      }

      const user = users[0];

      if (new Date(user.resetPasswordExpiry) < new Date()) {
        return Response.json({ success: false, error: 'Link expirado' }, { status: 400 });
      }

      const senhaHash = await bcryptjs.hash(newPassword, 6);

      await base44.asServiceRole.entities.ManualUser.update(user.id, {
        senhaHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      });

      console.log('[resetPassword] Senha atualizada para:', user.email);
      return Response.json({ success: true, message: 'Senha alterada com sucesso!' });
    }

    return Response.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('[resetPassword] Erro:', error);
    return Response.json({ success: false, error: 'Erro ao processar solicitação' }, { status: 500 });
  }
});