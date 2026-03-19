import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const news = data;
    if (!news || !news.title) return Response.json({ ok: true });

    // Notificar ADMINS sobre nova notícia
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    ).catch(() => []);

    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        title: '📰 Nova Notícia',
        message: `${news.title}`,
        type: 'news',
        reference_type: 'news',
        reference_id: news.id,
        user_email: admin.email,
        redirect_page: 'NewsDetail',
        redirect_params: { id: news.id },
        is_read: false
      });
    }

    // Se publicada, notificar TODOS os usuários
    if (news.status === 'published') {
      await base44.asServiceRole.entities.Notification.create({
        title: '📰 Notícia Publicada',
        message: `${news.title}`,
        type: 'news',
        reference_type: 'news',
        reference_id: news.id,
        sent_to_all: true,
        redirect_page: 'NewsDetail',
        redirect_params: { id: news.id },
        is_read: false
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyNewsPublished]', error);
    return Response.json({ ok: true });
  }
});