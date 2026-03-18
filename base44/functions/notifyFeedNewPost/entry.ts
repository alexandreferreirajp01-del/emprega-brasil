import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const post = data;
    if (!post || !post.autor_email) return Response.json({ ok: true });

    const autorName = post.autor_nome || post.autor_email;

    // Notificar ADMINS sobre novo post
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    ).catch(() => []);

    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        title: '📝 Novo Post no Feed',
        message: `${autorName} postou no feed`,
        type: 'feed',
        reference_type: 'feed_post',
        reference_id: post.id,
        user_email: admin.email,
        redirect_page: 'Feed',
        is_read: false
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyFeedNewPost]', error);
    return Response.json({ ok: true });
  }
});