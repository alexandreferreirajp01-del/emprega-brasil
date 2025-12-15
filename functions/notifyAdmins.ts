import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Função universal para notificar admins sobre eventos no app
 * Eventos suportados:
 * - new_user: Novo usuário registrado
 * - user_login: Login de usuário
 * - feed_post: Nova postagem no Feed
 * - feed_comment: Novo comentário no Feed
 * - occurrence: Nova ocorrência reportada
 * - chat_message: Nova mensagem no chat de suporte
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event_type, data } = await req.json();

    if (!event_type || !data) {
      return Response.json({ error: 'event_type e data são obrigatórios' }, { status: 400 });
    }

    // Buscar todos os admins e dono
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => 
      u.role === 'admin' || 
      u.subscription_type === 'admin' || 
      u.email === 'alexandreferreirajp01@gmail.com'
    );

    if (admins.length === 0) {
      return Response.json({ success: true, notified: 0, message: 'Nenhum admin encontrado' });
    }

    // Verificar se o tipo de notificação está habilitado
    // (isso será verificado no frontend antes de enviar, mas validamos aqui também)
    const settingsKey = `admin_notifications_${event_type}`;
    const isEnabled = Deno.env.get(settingsKey) !== 'false'; // Por padrão, está habilitado
    
    if (!isEnabled) {
      return Response.json({ 
        success: true, 
        notified: 0, 
        message: `Notificação ${event_type} desabilitada` 
      });
    }

    // Preparar notificação baseada no tipo de evento
    let notificationData = {};
    
    switch(event_type) {
      case 'new_user':
        notificationData = {
          title: '👋 Novo Usuário Registrado',
          message: `${data.user_name || data.user_email} acabou de se registrar no aplicativo`,
          type: 'user',
          reference_type: 'user',
          reference_id: data.user_email,
          redirect_page: 'GerenciarUsuarios',
          icon_url: data.user_photo || null
        };
        break;

      case 'user_login':
        notificationData = {
          title: '🔐 Novo Login',
          message: `${data.user_name || data.user_email} fez login no aplicativo`,
          type: 'user',
          reference_type: 'user',
          reference_id: data.user_email,
          redirect_page: 'FluxoUsuarios',
          icon_url: data.user_photo || null
        };
        break;

      case 'feed_post':
        notificationData = {
          title: '📝 Nova Postagem no Feed',
          message: `${data.author_name} publicou: "${data.content.substring(0, 50)}..."`,
          type: 'feed',
          reference_type: 'feed_post',
          reference_id: data.post_id,
          redirect_page: 'GerenciarComunidade',
          icon_url: data.author_photo || null
        };
        break;

      case 'feed_comment':
        notificationData = {
          title: '💬 Novo Comentário no Feed',
          message: `${data.author_name} comentou: "${data.comment.substring(0, 50)}..."`,
          type: 'feed',
          reference_type: 'feed_comment',
          reference_id: data.comment_id,
          redirect_page: 'GerenciarComunidade',
          icon_url: data.author_photo || null
        };
        break;

      case 'occurrence':
        notificationData = {
          title: '⚠️ Nova Ocorrência Reportada',
          message: `${data.user_name} reportou: "${data.subject}"`,
          type: 'admin',
          reference_type: 'occurrence',
          reference_id: data.occurrence_id,
          redirect_page: 'Ocorrencias',
          icon_url: null
        };
        break;

      case 'chat_message':
        notificationData = {
          title: '💬 Nova Mensagem no Chat',
          message: `${data.sender_name}: "${data.message.substring(0, 50)}..."`,
          type: 'admin',
          reference_type: 'chat',
          reference_id: data.sender_id,
          redirect_page: 'ResponderChat',
          icon_url: null
        };
        break;

      default:
        return Response.json({ error: 'Tipo de evento não reconhecido' }, { status: 400 });
    }

    // Criar notificações para cada admin
    const notifications = admins.map(admin => ({
      user_email: admin.email,
      ...notificationData,
      is_read: false
    }));

    // Criar todas as notificações em paralelo
    await Promise.all(
      notifications.map(notif => 
        base44.asServiceRole.entities.Notification.create(notif).catch(err => {
          console.error('Erro ao criar notificação:', err);
        })
      )
    );

    return Response.json({ 
      success: true, 
      notified: admins.length,
      message: `${admins.length} administradores notificados sobre ${event_type}`
    });

  } catch (error) {
    console.error('Erro ao notificar admins:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});