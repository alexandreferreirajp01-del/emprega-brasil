import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.subscription_type !== 'admin' && user?.email !== 'alexandreferreirajp01@gmail.com') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { email, full_name, phone, subscription_type, notes, city, state } = await req.json();

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'E-mail inválido ou não informado.' }, { status: 400 });
    }

    // Verificar se usuário já existe
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email });
    if (existingUsers.length > 0) {
      // Usuário já existe, apenas atualizar dados
      const existingUser = existingUsers[0];
      const updateData = {
        subscription_type: subscription_type || 'basic',
        access_status: 'approved',
      };
      if (full_name) updateData.full_name = full_name;
      if (phone) updateData.phone = phone;
      if (notes) updateData.admin_notes = notes;
      if (city) updateData.city = city;
      if (state) updateData.state = state;

      await base44.asServiceRole.entities.User.update(existingUser.id, updateData);

      return Response.json({
        success: true,
        action: 'updated',
        message: `Usuário ${email} já existia e foi atualizado com sucesso.`,
        user_id: existingUser.id
      });
    }

    // Convidar novo usuário
    const inviteRole = subscription_type === 'admin' ? 'admin' : 'user';
    await base44.users.inviteUser(email, inviteRole);

    // Aguardar propagação e tentar atualizar
    await new Promise(r => setTimeout(r, 1500));

    const newUsers = await base44.asServiceRole.entities.User.filter({ email });
    if (newUsers.length > 0) {
      const updateData = {
        subscription_type: subscription_type || 'basic',
        access_status: 'approved',
      };
      if (full_name) updateData.full_name = full_name;
      if (phone) updateData.phone = phone;
      if (notes) updateData.admin_notes = notes;
      if (city) updateData.city = city;
      if (state) updateData.state = state;

      await base44.asServiceRole.entities.User.update(newUsers[0].id, updateData);

      return Response.json({
        success: true,
        action: 'created',
        message: `Usuário ${email} cadastrado com sucesso! E-mail de convite enviado.`,
        user_id: newUsers[0].id
      });
    }

    // Convite enviado mas usuário ainda não está na base
    return Response.json({
      success: true,
      action: 'invited',
      message: `Convite enviado para ${email}. Os dados serão aplicados ao primeiro acesso.`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});