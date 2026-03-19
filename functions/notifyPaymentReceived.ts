import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const payment = data;
    if (!payment) return Response.json({ ok: true });

    const userEmail = payment.user_email;

    // Notificar usuário sobre seu pagamento
    if (userEmail) {
      await base44.asServiceRole.entities.Notification.create({
        title: '💳 Pagamento Registrado',
        message: `Pagamento de R$ ${payment.amount} foi recebido`,
        type: 'system',
        reference_type: 'payment',
        reference_id: payment.id,
        user_email: userEmail,
        redirect_page: 'PaymentsPage',
        is_read: false
      });
    }

    // Notificar ADMINS
    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' }
    ).catch(() => []);

    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        title: '💰 Novo Pagamento',
        message: `R$ ${payment.amount} de ${userEmail}`,
        type: 'admin',
        reference_type: 'payment',
        reference_id: payment.id,
        user_email: admin.email,
        redirect_page: 'PaymentsPage',
        is_read: false
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[notifyPaymentReceived]', error);
    return Response.json({ ok: true });
  }
});