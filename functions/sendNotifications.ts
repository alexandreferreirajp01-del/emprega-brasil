import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notification, jobId, targetUsers } = await req.json();
    
    const brasiliaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const jobUrl = `/jobs?id=${jobId}`;

    let results = {
      email: { sent: 0, failed: 0 },
      push: { sent: 0, failed: 0 },
      bell: { sent: 0, failed: 0 }
    };

    // 1. NOTIFICAÇÃO SININHO INTERNO (sempre funciona)
    if (notification.channels.bell) {
      try {
        for (const userEmail of targetUsers) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: userEmail,
            title: notification.title,
            message: notification.message,
            type: 'job',
            reference_type: 'job',
            reference_id: jobId,
            job_id: jobId,
            is_read: false
          });
          results.bell.sent++;
        }
      } catch (err) {
        console.error('Bell notification error:', err);
        results.bell.failed = targetUsers.length;
      }
    }

    // 2. NOTIFICAÇÃO PUSH
    if (notification.channels.push) {
      try {
        const targetGroups = notification.premiumOnly 
          ? ['premium', 'admin'] 
          : ['visitor', 'basic', 'premium', 'recruiter', 'admin'];

        const pushResult = await base44.asServiceRole.functions.invoke('pushSend', {
          title: notification.title,
          message: notification.message,
          icon: notification.icon,
          url: jobUrl,
          targetGroups
        });

        results.push.sent = pushResult.data?.sent || 0;
        results.push.failed = pushResult.data?.failed || 0;
      } catch (err) {
        console.error('Push notification error:', err);
        results.push.failed++;
      }
    }

    // 3. EMAIL
    if (notification.channels.email) {
      try {
        const users = await base44.asServiceRole.entities.User.list();
        const filteredUsers = notification.premiumOnly 
          ? users.filter(u => u.subscription_type === 'premium' || u.role === 'admin')
          : users;

        for (const u of filteredUsers) {
          if (u.email) {
            try {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: u.email,
                subject: notification.title,
                body: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0056ff;">${notification.icon} ${notification.title}</h2>
                    <p style="font-size: 16px; color: #333;">${notification.message}</p>
                    <a href="https://vagasabertaspb.com.br${jobUrl}" 
                       style="display: inline-block; background: #0056ff; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 8px; margin-top: 20px;">
                      Ver Vaga
                    </a>
                    <p style="font-size: 12px; color: #999; margin-top: 30px;">
                      Você recebeu este email porque está cadastrado no Vagas Abertas Paraíba.
                    </p>
                  </div>
                `
              });
              results.email.sent++;
            } catch (emailErr) {
              console.error(`Email failed for ${u.email}:`, emailErr);
              results.email.failed++;
            }
          }
        }
      } catch (err) {
        console.error('Email notification error:', err);
      }
    }

    return Response.json({ 
      success: true, 
      results,
      timestamp: brasiliaTime.toISOString()
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});