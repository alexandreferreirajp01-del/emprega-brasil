import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const user = data;
    if (!user || !user.email) return Response.json({ ok: true });

    // Notificar ADMINS sobre novo usuário
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    ).catch(() => []);

    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        title: '👤 Novo Usuário',
        message: `${user.full_name || user.email} se registrou`,
        type: 'user',
        reference_type: 'user',
        reference_id: user.id,
        user_email: admin.email,
        redirect_page: 'GerenciarUsuarios',
        is_read: false
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyUserRegistered]', error);
    return Response.json({ ok: true });
  }
});