import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Autenticar usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Obter dados do body
    const body = await req.json();
    const { full_name, phone, username, photo_url } = body;

    // Construir objeto de atualização apenas com campos fornecidos
    const updateData = {};
    
    if (full_name !== undefined && full_name !== null && full_name.trim() !== '') {
      updateData.full_name = full_name.trim();
    }
    
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      updateData.phone = phone.trim();
    }
    
    if (username !== undefined && username !== null && username.trim() !== '') {
      updateData.username = username.trim();
    }
    
    if (photo_url !== undefined && photo_url !== null && photo_url.trim() !== '') {
      updateData.profile_photo = photo_url.trim();
    }

    // Se não há nada para atualizar, retornar usuário atual
    if (Object.keys(updateData).length === 0) {
      return Response.json(user);
    }

    // Adicionar flag para indicar que foi atualizado manualmente
    updateData.profile_updated_manually = true;

    // Atualizar usuário usando service role (permissão de admin)
    const updatedUser = await base44.asServiceRole.entities.User.update(user.id, updateData);

    // Retornar usuário atualizado
    return Response.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return Response.json(
      { error: 'Erro ao atualizar perfil', details: error.message }, 
      { status: 500 }
    );
  }
});