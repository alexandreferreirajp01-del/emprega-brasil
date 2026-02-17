import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, token, newPassword } = await req.json();

    console.log('[resetPassword] Action:', action);

    // ===== VALIDAR TOKEN =====
    if (action === 'validate_token') {
      if (!token) {
        return Response.json({ 
          success: false, 
          error: 'Token inválido' 
        }, { status: 400 });
      }

      console.log('[resetPassword] Validando token:', token);

      const users = await base44.asServiceRole.entities.User.filter({ 
        reset_password_token: token 
      });

      if (users.length === 0) {
        console.log('[resetPassword] Token não encontrado');
        return Response.json({ 
          success: false, 
          error: 'Link inválido ou já utilizado' 
        }, { status: 404 });
      }

      const user = users[0];

      // Verificar se expirou
      if (new Date(user.reset_password_expires) < new Date()) {
        console.log('[resetPassword] Token expirado');
        return Response.json({ 
          success: false, 
          error: 'Link expirado',
          expired: true 
        }, { status: 400 });
      }

      console.log('[resetPassword] Token válido para:', user.email);

      return Response.json({ 
        success: true,
        email: user.email
      });
    }

    // ===== RESETAR SENHA =====
    if (action === 'reset_password') {
      if (!token || !newPassword) {
        return Response.json({ 
          success: false, 
          error: 'Dados incompletos' 
        }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return Response.json({ 
          success: false, 
          error: 'Senha deve ter no mínimo 6 caracteres' 
        }, { status: 400 });
      }

      console.log('[resetPassword] Resetando senha com token:', token);

      const users = await base44.asServiceRole.entities.User.filter({ 
        reset_password_token: token 
      });

      if (users.length === 0) {
        return Response.json({ 
          success: false, 
          error: 'Link inválido' 
        }, { status: 404 });
      }

      const user = users[0];

      // Verificar expiração
      if (new Date(user.reset_password_expires) < new Date()) {
        return Response.json({ 
          success: false, 
          error: 'Link expirado' 
        }, { status: 400 });
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(newPassword, 10);

      // Atualizar senha e limpar token
      await base44.asServiceRole.entities.User.update(user.id, {
        senhaHash,
        reset_password_token: null,
        reset_password_expires: null
      });

      console.log('[resetPassword] Senha atualizada para:', user.email);

      return Response.json({ 
        success: true, 
        message: 'Senha alterada com sucesso!' 
      });
    }

    return Response.json({ 
      success: false, 
      error: 'Ação inválida' 
    }, { status: 400 });

  } catch (error) {
    console.error('[resetPassword] Erro:', error);
    return Response.json({ 
      success: false, 
      error: 'Erro ao processar solicitação' 
    }, { status: 500 });
  }
});