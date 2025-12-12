import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { user_email, user_name } = await req.json();

    if (!user_email) {
      return Response.json({ error: 'user_email é obrigatório' }, { status: 400 });
    }

    // Buscar todos os admins
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => 
      u.role === 'admin' || 
      u.subscription_type === 'admin' || 
      u.email === 'alexandreferreirajp01@gmail.com'
    );

    // Criar notificação para cada admin
    const notifications = admins.map(admin => ({
      user_email: admin.email,
      title: '👋 Novo Usuário',
      message: `${user_name || user_email} acabou de fazer login no aplicativo`,
      type: 'user',
      reference_type: 'user',
      reference_id: user_email,
      redirect_page: 'GerenciarUsuarios',
      icon_url: null,
      is_read: false
    }));

    // Criar todas as notificações
    if (notifications.length > 0) {
      await Promise.all(
        notifications.map(notif => 
          base44.asServiceRole.entities.Notification.create(notif).catch(() => {})
        )
      );
    }

    return Response.json({ 
      success: true, 
      notified: admins.length,
      message: `${admins.length} administradores notificados`
    });

  } catch (error) {
    console.error('Erro ao notificar novo usuário:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});