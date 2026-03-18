import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ── GET OR CREATE CONVERSATION ──────────────────────────────────────────
    if (action === 'get_or_create_conversation') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Login necessário para usar o suporte' }, { status: 401 });

      const existing = await base44.asServiceRole.entities.SupportConversation.filter(
        { user_email: user.email }, '-created_date', 1
      );

      if (existing && existing.length > 0) {
        return Response.json({ conversation: existing[0] });
      }

      const conv = await base44.asServiceRole.entities.SupportConversation.create({
        user_email: user.email,
        user_name: user.full_name || user.email,
        user_type: user.subscription_type || user.role || 'basic',
        status: 'open',
        unread_admin: 0,
        unread_user: 0,
      });

      return Response.json({ conversation: conv });
    }

    // ── SEND USER MESSAGE ───────────────────────────────────────────────────
    if (action === 'send_user_message') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const { conversation_id, message, current_unread_admin = 0 } = body;
      if (!conversation_id || !message?.trim()) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const msg = await base44.asServiceRole.entities.SupportMessage.create({
        conversation_id,
        user_email: user.email,
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        sender_role: 'user',
        message: message.trim(),
        read_by_admin: false,
        read_by_user: true,
      });

      await base44.asServiceRole.entities.SupportConversation.update(conversation_id, {
        last_message: message.trim().substring(0, 100),
        last_message_at: new Date().toISOString(),
        status: 'open',
        unread_admin: current_unread_admin + 1,
      });

      // Notify all admins
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
      const admins = allUsers.filter(u =>
        u.role === 'admin' || u.subscription_type === 'admin' || u.subscription_type === 'dono'
      );

      await Promise.allSettled(admins.slice(0, 15).map(admin =>
        base44.asServiceRole.entities.Notification.create({
          title: `💬 Suporte: ${user.full_name || user.email}`,
          message: message.trim().substring(0, 80),
          type: 'admin',
          reference_type: 'chat',
          reference_id: conversation_id,
          user_email: admin.email,
          redirect_page: 'ResponderChat',
        })
      ));

      return Response.json({ success: true, message: msg });
    }

    // ── SEND ADMIN MESSAGE ──────────────────────────────────────────────────
    if (action === 'send_admin_message') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const isAdmin = user.role === 'admin' ||
        user.subscription_type === 'admin' ||
        user.subscription_type === 'dono' ||
        user.email === 'alexandreferreirajp01@gmail.com';
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const {
        conversation_id,
        message,
        target_user_email,
        target_user_name,
        current_unread_user = 0,
      } = body;

      if (!conversation_id || !message?.trim()) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const msg = await base44.asServiceRole.entities.SupportMessage.create({
        conversation_id,
        user_email: target_user_email,
        sender_email: user.email,
        sender_name: user.full_name || 'Suporte',
        sender_role: 'admin',
        message: message.trim(),
        read_by_admin: true,
        read_by_user: false,
      });

      await base44.asServiceRole.entities.SupportConversation.update(conversation_id, {
        last_message: message.trim().substring(0, 100),
        last_message_at: new Date().toISOString(),
        status: 'pending_reply',
        unread_admin: 0,
        unread_user: current_unread_user + 1,
      });

      // Notify user in bell
      if (target_user_email) {
        await base44.asServiceRole.entities.Notification.create({
          title: `💬 Suporte respondeu sua mensagem`,
          message: message.trim().substring(0, 80),
          type: 'user',
          reference_type: 'chat',
          reference_id: conversation_id,
          user_email: target_user_email,
          redirect_page: 'Home',
          redirect_params: { support: 'open' },
        }).catch(() => {});

        // Send email notification
        const emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
            <div style="background:linear-gradient(135deg,#1D4371,#2B5A8F);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">💬 Suporte respondeu</h1>
              <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Vagas Abertas PB</p>
            </div>
            <div style="background:white;padding:28px 24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
              <p style="color:#475569;font-size:16px;margin:0 0 12px;">Olá, <strong>${target_user_name || target_user_email}</strong>!</p>
              <p style="color:#64748b;font-size:15px;margin:0 0 16px;">Você recebeu uma resposta da equipe de suporte:</p>
              <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:0 8px 8px 0;color:#166534;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              <p style="color:#94a3b8;font-size:13px;margin-top:20px;text-align:center;">Acesse o app para continuar a conversa com o suporte.</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
              <p style="color:#cbd5e1;font-size:12px;text-align:center;">Vagas Abertas PB &bull; contato@vagasabertaspb.com.br</p>
            </div>
          </div>
        `;

        await base44.integrations.Core.SendEmail({
          to: target_user_email,
          subject: '💬 Suporte respondeu sua mensagem — Vagas Abertas PB',
          body: emailHtml,
        }).catch(() => {});
      }

      return Response.json({ success: true, message: msg });
    }

    // ── MARK READ BY USER ───────────────────────────────────────────────────
    if (action === 'mark_read_by_user') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ success: false }, { status: 401 });

      const { conversation_id } = body;
      await base44.asServiceRole.entities.SupportConversation.update(conversation_id, {
        unread_user: 0,
      });
      return Response.json({ success: true });
    }

    // ── MARK READ BY ADMIN ──────────────────────────────────────────────────
    if (action === 'mark_read_by_admin') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const isAdmin = user.role === 'admin' ||
        user.subscription_type === 'admin' ||
        user.subscription_type === 'dono' ||
        user.email === 'alexandreferreirajp01@gmail.com';
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const { conversation_id } = body;
      await base44.asServiceRole.entities.SupportConversation.update(conversation_id, {
        unread_admin: 0,
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});