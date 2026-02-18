import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Função para processar login com Google
 * Salva nome e foto APENAS no primeiro login
 * Nos logins seguintes, preserva dados personalizados pelo usuário
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Obter dados do Google do body
    const body = await req.json();
    const { googleName, googlePhoto } = body;

    // Verificar se é o primeiro login
    // Se o usuário já tem profile_updated_manually = true, NÃO atualizar
    if (user.profile_updated_manually === true) {
      // Usuário já personalizou o perfil, não sobrescrever
      return Response.json({
        success: true,
        message: 'Perfil já personalizado, dados preservados',
        user: user
      });
    }

    // É o primeiro login OU usuário nunca personalizou
    // Verificar se já tem dados preenchidos
    const hasExistingData = user.full_name || user.profile_photo;

    if (hasExistingData) {
      // Já tem dados, não sobrescrever
      return Response.json({
        success: true,
        message: 'Dados existentes preservados',
        user: user
      });
    }

    // Primeiro login - salvar dados do Google
    const updateData = {};
    
    if (googleName && googleName.trim() !== '') {
      updateData.full_name = googleName.trim();
    }
    
    if (googlePhoto && googlePhoto.trim() !== '') {
      updateData.profile_photo = googlePhoto.trim();
    }

    // Notificar admins sobre novo usuário (primeiro login OAuth)
    try {
      await base44.asServiceRole.functions.invoke('notifyNewUser', {
        user_email: user.email,
        user_name: googleName || user.email,
        user_type: user.subscription_type || 'basic',
        user_id: user.id,
        created_date: user.created_date || new Date().toISOString()
      });
    } catch (notifError) {
      console.error('Erro ao notificar admins (primeiro login):', notifError);
    }

    // Atualizar apenas se houver dados
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await base44.asServiceRole.entities.User.update(user.id, updateData);
      
      return Response.json({
        success: true,
        message: 'Primeiro login - dados do Google salvos',
        user: updatedUser
      });
    }

    return Response.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Erro ao processar login Google:', error);
    return Response.json(
      { error: 'Erro ao processar login', details: error.message }, 
      { status: 500 }
    );
  }
});