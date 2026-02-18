import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Suporta chamada direta OU automação de entidade (event + data)
    let userEmail, userName, userType, userId, createdDate;

    if (body.event && body.data) {
      // Chamada via automação de entidade (User create)
      const userData = body.data;
      userEmail = userData.email;
      userName = userData.full_name || userData.email;
      userType = userData.subscription_type || 'basic';
      userId = body.event.entity_id || userData.id;
      createdDate = userData.created_date || new Date().toISOString();
    } else {
      // Chamada direta
      userEmail = body.user_email;
      userName = body.user_name || body.user_email;
      userType = body.user_type || 'basic';
      userId = body.user_id;
      createdDate = body.created_date || new Date().toISOString();
    }

    if (!userEmail) {
      return Response.json({ error: 'user_email é obrigatório' }, { status: 400 });
    }

    // Formatar data e hora no horário de Brasília
    const dateBrasilia = new Date(createdDate).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Mapeamento de tipo de usuário
    const typeLabels = {
      basic: 'Básico',
      premium: 'Premium',
      recruiter: 'Recrutador',
      admin: 'Admin',
      visitor: 'Visitante'
    };
    const typeLabel = typeLabels[userType] || userType || 'Básico';

    // Emoji baseado no tipo
    const typeEmoji = {
      basic: '👤',
      premium: '⭐',
      recruiter: '🏢',
      admin: '👑',
      visitor: '👋'
    }[userType] || '👤';

    const title = `${typeEmoji} Novo Usuário ${typeLabel}`;
    const message = `${userName}\n${userEmail}\n📅 ${dateBrasilia}`;

    // Buscar todos os admins e donos
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const admins = allUsers.filter(u =>
      u.role === 'admin' ||
      u.subscription_type === 'admin' ||
      u.email === 'alexandreferreirajp01@gmail.com'
    );

    // Não notificar se o novo usuário for o próprio admin
    const adminsToNotify = admins.filter(a => a.email !== userEmail);

    if (adminsToNotify.length === 0) {
      return Response.json({ success: true, notified: 0, message: 'Nenhum admin para notificar' });
    }

    // Criar notificação para cada admin
    await Promise.all(
      adminsToNotify.map(admin =>
        base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          title,
          message,
          type: 'user',
          reference_type: 'user',
          reference_id: userEmail,
          redirect_page: 'GerenciarUsuarios',
          is_read: false
        }).catch(e => console.error('Erro ao criar notif para', admin.email, e))
      )
    );

    return Response.json({
      success: true,
      notified: adminsToNotify.length,
      message: `${adminsToNotify.length} administrador(es) notificado(s)`,
      user: { email: userEmail, name: userName, type: typeLabel, date: dateBrasilia }
    });

  } catch (error) {
    console.error('Erro ao notificar novo usuário:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});