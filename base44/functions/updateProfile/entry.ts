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
    const { full_name, phone, city, state, username, photo_url, password } = body;

    // Construir objeto de atualização apenas com campos fornecidos
    const updateData = {};
    
    if (full_name !== undefined && full_name !== null && full_name.trim() !== '') {
      updateData.full_name = full_name.trim();
    }
    
    if (phone !== undefined && phone !== null) {
      updateData.phone = phone.trim();
    }
    
    if (city !== undefined && city !== null) {
      updateData.city = city.trim();
    }
    
    if (state !== undefined && state !== null) {
      updateData.state = state.trim().toUpperCase();
    }
    
    if (username !== undefined && username !== null) {
      updateData.username = username.trim();
    }
    
    if (photo_url !== undefined && photo_url !== null && photo_url.trim() !== '') {
      updateData.profile_photo = photo_url.trim();
    }

    if (password !== undefined && password !== null && password.trim() !== '') {
      updateData.password = password.trim();
    }

    // Se não há nada para atualizar, retornar usuário atual
    if (Object.keys(updateData).length === 0) {
      return Response.json({ success: true, user });
    }

    // Adicionar flag para indicar que foi atualizado manualmente
    updateData.profile_updated_manually = true;

    // Atualizar usando updateMe que é o método correto do Base44
    await base44.auth.updateMe(updateData);

    // Buscar usuário atualizado
    const updatedUser = await base44.auth.me();

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