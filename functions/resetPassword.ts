import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, code, email, newPassword } = await req.json();

    // ===== VALIDAR CÓDIGO =====
    if (action === 'validate_code') {
      if (!code || !email) {
        return Response.json({ 
          success: false, 
          error: 'Código e email são obrigatórios' 
        }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.User.filter({ 
        email: email.toLowerCase() 
      });

      if (users.length === 0) {
        return Response.json({ 
          success: false, 
          error: 'Email não encontrado' 
        }, { status: 404 });
      }

      const user = users[0];

      // Verificar se o código existe
      if (!user.reset_password_code) {
        return Response.json({ 
          success: false, 
          error: 'Nenhum código de recuperação encontrado. Solicite um novo.' 
        }, { status: 400 });
      }

      // Verificar se código expirou
      if (new Date(user.reset_password_expires) < new Date()) {
        return Response.json({ 
          success: false, 
          error: 'Código expirado. Solicite um novo.',
          expired: true 
        }, { status: 400 });
      }

      // Verificar se código confere
      if (user.reset_password_code !== code) {
        return Response.json({ 
          success: false, 
          error: 'Código inválido' 
        }, { status: 400 });
      }

      return Response.json({ 
        success: true, 
        message: 'Código válido' 
      });
    }

    // ===== RESETAR SENHA =====
    if (action === 'reset_password') {
      if (!code || !email || !newPassword) {
        return Response.json({ 
          success: false, 
          error: 'Todos os campos são obrigatórios' 
        }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return Response.json({ 
          success: false, 
          error: 'Senha deve ter no mínimo 6 caracteres' 
        }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.User.filter({ 
        email: email.toLowerCase() 
      });

      if (users.length === 0) {
        return Response.json({ 
          success: false, 
          error: 'Email não encontrado' 
        }, { status: 404 });
      }

      const user = users[0];

      // Verificar código novamente
      if (!user.reset_password_code || user.reset_password_code !== code) {
        return Response.json({ 
          success: false, 
          error: 'Código inválido' 
        }, { status: 400 });
      }

      if (new Date(user.reset_password_expires) < new Date()) {
        return Response.json({ 
          success: false, 
          error: 'Código expirado' 
        }, { status: 400 });
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(newPassword, 10);

      // Atualizar senha e limpar código
      await base44.asServiceRole.entities.User.update(user.id, {
        senhaHash,
        reset_password_code: null,
        reset_password_expires: null
      });

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
    console.error('Erro em resetPassword:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Erro ao processar solicitação' 
    }, { status: 500 });
  }
});