import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { url, user_email } = await req.json();

    // Validar entrada
    if (!url || !user_email) {
      return Response.json({ error: 'URL e email são obrigatórios' }, { status: 400 });
    }

    // Buscar configuração do link especial
    const specialLinks = await base44.asServiceRole.entities.SpecialLink.filter(
      { url, is_enabled: true },
      '-created_date',
      1
    );

    if (!specialLinks || specialLinks.length === 0) {
      return Response.json({ error: 'Link não encontrado ou desativado' }, { status: 404 });
    }

    const specialLink = specialLinks[0];

    // Obter dados do usuário
    const users = await base44.asServiceRole.entities.User.filter(
      { email: user_email },
      'created_date',
      1
    );

    if (!users || users.length === 0) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = users[0];

    // Aplicar ação baseada no tipo
    let updateData = {};

    switch (specialLink.action_type) {
      case 'enable_basic':
        if (!user.subscription_type || user.subscription_type === 'visitor' || user.subscription_type === 'pending') {
          updateData = {
            subscription_type: 'basic',
            access_status: 'approved'
          };
        }
        break;

      case 'enable_premium':
        if (user.subscription_type !== 'premium' && user.subscription_type !== 'admin' && user.subscription_type !== 'recruiter') {
          updateData = {
            subscription_type: 'premium',
            access_status: 'approved'
          };
        }
        break;

      case 'enable_recruiter':
        if (user.subscription_type !== 'recruiter' && user.subscription_type !== 'admin') {
          updateData = {
            subscription_type: 'recruiter',
            access_status: 'approved'
          };
        }
        break;
    }

    // Atualizar usuário se houver mudanças
    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.User.update(user.id, updateData);
      return Response.json({
        success: true,
        message: `Plano atualizado com sucesso: ${specialLink.action_type}`,
        updated: true,
        subscription_type: updateData.subscription_type
      });
    }

    return Response.json({
      success: true,
      message: 'Link processado (usuário já possui acesso)',
      updated: false,
      subscription_type: user.subscription_type
    });

  } catch (error) {
    console.error('Erro ao processar link especial:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});