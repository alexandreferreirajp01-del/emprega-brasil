import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const comment = data;
    if (!comment || !comment.post_id) return Response.json({ ok: true });

    // Buscar o post original
    const post = await base44.asServiceRole.entities.FeedPost.read(comment.post_id)
      .catch(() => null);

    if (!post || !post.autor_email) return Response.json({ ok: true });

    const commenterName = comment.autor_nome || comment.autor_email;

    // Notificar autor do post
    await base44.asServiceRole.entities.Notification.create({
      title: '💭 Novo Comentário',
      message: `${commenterName} comentou seu post`,
      type: 'feed',
      reference_type: 'feed_comment',
      reference_id: comment.id,
      user_email: post.autor_email,
      redirect_page: 'Feed',
      is_read: false
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyFeedNewComment]', error);
    return Response.json({ ok: true });
  }
});