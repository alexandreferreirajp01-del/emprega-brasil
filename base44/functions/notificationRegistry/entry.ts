/**
 * SISTEMA CENTRALIZADO DE NOTIFICAÇÕES
 * Função utilitária para registrar notificações em todas as atividades do app
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Registra uma notificação no sistema
 * @param {Object} base44 - Cliente Base44 inicializado
 * @param {Object} options - Opções da notificação
 */
export async function createNotification(base44, options) {
  const {
    title,
    message,
    type = 'system', // job, news, feed, chat, admin, user, system, promo
    reference_type = null, // job, news, feed_post, feed_comment, chat, payment, user
    reference_id = null,
    user_email = null,
    sent_to_all = false,
    icon_url = null,
    redirect_page = null,
    redirect_params = null,
    job_id = null
  } = options;

  try {
    await base44.asServiceRole.entities.Notification.create({
      title,
      message,
      type,
      reference_type,
      reference_id,
      user_email,
      sent_to_all,
      icon_url,
      redirect_page,
      redirect_params,
      job_id,
      is_read: false
    });
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao registrar notificação:', err.message);
  }
}

/**
 * Notifica um novo usuário registrado (para admins)
 */
export async function notifyNewUser(base44, user) {
  try {
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    );

    for (const admin of admins) {
      await createNotification(base44, {
        title: '👤 Novo Usuário Registrado',
        message: `${user.full_name} (${user.email}) se registrou no app`,
        type: 'user',
        reference_type: 'user',
        reference_id: user.id,
        user_email: admin.email,
        redirect_page: 'GerenciarUsuarios',
        icon_url: user.profile_photo_url || null
      });
    }
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar novo usuário:', err);
  }
}

/**
 * Notifica nova vaga criada
 */
export async function notifyNewJob(base44, job, createdByEmail) {
  try {
    // Para ADMINS: todas as vagas
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    );

    for (const admin of admins) {
      await createNotification(base44, {
        title: '💼 Nova Vaga Recebida',
        message: `Vaga: ${job.title} em ${job.city}`,
        type: 'job',
        reference_type: 'job',
        reference_id: job.id,
        job_id: job.id,
        user_email: admin.email,
        redirect_page: 'JobDetail',
        redirect_params: { id: job.id }
      });
    }

    // Para USUÁRIOS: apenas vagas da sua cidade/categoria
    if (job.status === 'ativa') {
      const users = await base44.asServiceRole.entities.User.filter(
        { subscription_type: 'basic' },
        '-created_date',
        1000
      );

      for (const user of users) {
        // Verificar preferências de cidade/categoria
        const preferences = user.job_preferences || {};
        const matchCity = !preferences.preferred_cities || 
                         preferences.preferred_cities.includes(job.city);
        const matchCategory = !preferences.preferred_categories || 
                             preferences.preferred_categories.includes(job.category);

        if (matchCity && matchCategory) {
          await createNotification(base44, {
            title: '✨ Nova Vaga para Você!',
            message: `${job.title} em ${job.city}`,
            type: 'job',
            reference_type: 'job',
            reference_id: job.id,
            job_id: job.id,
            user_email: user.email,
            redirect_page: 'JobDetail',
            redirect_params: { id: job.id }
          });
        }
      }
    }
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar nova vaga:', err);
  }
}

/**
 * Notifica vaga próxima de expirar
 */
export async function notifyJobExpiring(base44, job) {
  try {
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    );

    for (const admin of admins) {
      await createNotification(base44, {
        title: '⏰ Vaga Próxima de Expirar',
        message: `Vaga "${job.title}" expira em 24h`,
        type: 'system',
        reference_type: 'job',
        reference_id: job.id,
        job_id: job.id,
        user_email: admin.email,
        redirect_page: 'JobDetail',
        redirect_params: { id: job.id }
      });
    }
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar vaga expirando:', err);
  }
}

/**
 * Notifica nova mensagem de chat
 */
export async function notifyNewMessage(base44, message, senderName) {
  try {
    const recipient_email = message.destinatario_email;
    
    await createNotification(base44, {
      title: '💬 Nova Mensagem',
      message: `${senderName} enviou uma mensagem`,
      type: 'chat',
      reference_type: 'chat',
      reference_id: message.id,
      user_email: recipient_email,
      redirect_page: 'ResponderChat',
      redirect_params: { messageId: message.id }
    });
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar mensagem:', err);
  }
}

/**
 * Notifica comentário em post do feed
 */
export async function notifyFeedComment(base44, comment, postAuthorEmail, postAuthorName) {
  try {
    const commenterName = comment.autor_nome;

    await createNotification(base44, {
      title: '💭 Novo Comentário',
      message: `${commenterName} comentou seu post`,
      type: 'feed',
      reference_type: 'feed_comment',
      reference_id: comment.id,
      user_email: postAuthorEmail,
      redirect_page: 'Feed'
    });
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar comentário:', err);
  }
}

/**
 * Notifica curtida em post do feed
 */
export async function notifyFeedLike(base44, postId, postAuthorEmail, likerName) {
  try {
    await createNotification(base44, {
      title: '❤️ Curtiu seu post',
      message: `${likerName} curtiu seu post`,
      type: 'feed',
      reference_type: 'feed_post',
      reference_id: postId,
      user_email: postAuthorEmail,
      redirect_page: 'Feed'
    });
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar curtida:', err);
  }
}

/**
 * Notifica nova notícia publicada (para admins)
 */
export async function notifyNewNews(base44, news) {
  try {
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    );

    for (const admin of admins) {
      await createNotification(base44, {
        title: '📰 Nova Notícia Publicada',
        message: `${news.title}`,
        type: 'news',
        reference_type: 'news',
        reference_id: news.id,
        user_email: admin.email,
        redirect_page: 'NewsDetail',
        redirect_params: { id: news.id }
      });
    }
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar notícia:', err);
  }
}

/**
 * Notifica pagamento processado
 */
export async function notifyPaymentProcessed(base44, payment, userEmail) {
  try {
    await createNotification(base44, {
      title: '💳 Pagamento Confirmado',
      message: `Seu pagamento de R$ ${payment.amount} foi aprovado`,
      type: 'system',
      reference_type: 'payment',
      reference_id: payment.id,
      user_email: userEmail,
      redirect_page: 'PaymentsPage'
    });

    // Notificar admin
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    );

    for (const admin of admins) {
      await createNotification(base44, {
        title: '💰 Novo Pagamento',
        message: `Pagamento de R$ ${payment.amount} de ${userEmail}`,
        type: 'admin',
        reference_type: 'payment',
        reference_id: payment.id,
        user_email: admin.email,
        redirect_page: 'PaymentsPage'
      });
    }
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar pagamento:', err);
  }
}

/**
 * Notifica mensagem de suporte respondida
 */
export async function notifySupportReply(base44, supportMessage, repliedByEmail) {
  try {
    await createNotification(base44, {
      title: '🆘 Resposta ao Seu Suporte',
      message: `Sua solicitação de suporte foi respondida`,
      type: 'system',
      reference_type: 'chat',
      reference_id: supportMessage.id,
      user_email: supportMessage.user_email,
      redirect_page: 'ResponderChat',
      redirect_params: { messageId: supportMessage.id }
    });
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar resposta de suporte:', err);
  }
}

/**
 * Envia notificação em massa para todos os usuários
 */
export async function notifyAllUsers(base44, title, message, type = 'system') {
  try {
    await base44.asServiceRole.entities.Notification.create({
      title,
      message,
      type,
      sent_to_all: true,
      is_read: false
    });
  } catch (err) {
    console.error('[NotificationRegistry] Erro ao notificar todos usuários:', err);
  }
}