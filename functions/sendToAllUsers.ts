import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { title, message, redirectPage } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 });
    }

    // Buscar todos os usuários
    const users = await base44.asServiceRole.entities.User.list('', 10000);
    
    let inAppCount = 0;
    let pushCount = 0;
    let emailCount = 0;

    // 1. CRIAR NOTIFICAÇÃO IN-APP PARA TODOS
    try {
      const notificationPromises = users.map(u => 
        base44.asServiceRole.entities.Notification.create({
          title: title,
          message: message,
          type: 'system',
          user_email: u.email,
          redirect_page: redirectPage || 'Home',
          is_read: false,
          sent_to_all: true
        }).catch(() => null)
      );
      
      const results = await Promise.all(notificationPromises);
      inAppCount = results.filter(r => r !== null).length;
    } catch (e) {
      console.error('Erro ao criar notificações in-app:', e);
    }

    // 2. ENVIAR PUSH NOTIFICATIONS
    try {
      const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ is_active: true }, '', 10000);
      
      if (subscriptions.length > 0) {
        const pushPromises = subscriptions.map(sub => 
          base44.asServiceRole.functions.invoke('sendPushNotification', {
            subscription: {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            title: title,
            body: message,
            data: { page: redirectPage || 'Home' }
          }).catch(() => null)
        );
        
        const pushResults = await Promise.all(pushPromises);
        pushCount = pushResults.filter(r => r !== null).length;
      }
    } catch (e) {
      console.error('Erro ao enviar push:', e);
    }

    // 3. ENVIAR EMAILS
    try {
      const emailPromises = users.map(u => 
        base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Emprega Brasil+',
          to: u.email,
          subject: title,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
              </div>
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">${message}</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://empregabrasil.app" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Acessar Plataforma
                  </a>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
                  © ${new Date().getFullYear()} Emprega Brasil+ - Todos os direitos reservados
                </p>
              </div>
            </div>
          `
        }).catch(() => null)
      );
      
      const emailResults = await Promise.all(emailPromises);
      emailCount = emailResults.filter(r => r !== null).length;
    } catch (e) {
      console.error('Erro ao enviar emails:', e);
    }

    return Response.json({
      success: true,
      stats: {
        inApp: inAppCount,
        push: pushCount,
        emails: emailCount,
        totalUsers: users.length
      }
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});