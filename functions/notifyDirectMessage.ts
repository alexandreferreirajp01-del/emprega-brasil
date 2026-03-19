import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const message = data;
    if (!message) return Response.json({ ok: true });

    // Notificar o destinatário
    const recipientEmail = message.destinatario_email;
    const senderName = message.remetente_nome || message.remetente_email;

    if (recipientEmail) {
      await base44.asServiceRole.entities.Notification.create({
        title: '💬 Nova Mensagem',
        message: `${senderName} enviou uma mensagem`,
        type: 'chat',
        reference_type: 'chat',
        reference_id: message.id,
        user_email: recipientEmail,
        redirect_page: 'ResponderChat',
        redirect_params: { messageId: message.id },
        is_read: false
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyDirectMessage]', error);
    return Response.json({ ok: true });
  }
});