import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { report_id, content_type, content_id, reason } = await req.json();

    // Buscar admin
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admin = allUsers.find(u => u.role === 'admin' || u.subscription_type === 'admin');

    if (!admin) {
      return Response.json({ error: 'Admin não encontrado' }, { status: 404 });
    }

    // Criar conversa_id
    const emails = [user.email, admin.email].sort();
    const conversa_id = emails.join('_');

    // Determinar tipo de mensagem
    let message_type = 'system_other';
    if (content_type === 'post') message_type = 'system_report_user';
    if (content_type === 'comment') message_type = 'system_report_user';
    if (content_type === 'job') message_type = 'system_report_job';
    if (content_type === 'user') message_type = 'system_report_user';

    // Formatar conteúdo da mensagem
    const contentTypeLabel = {
      'job': 'vaga',
      'post': 'post',
      'comment': 'comentário',
      'user': 'usuário'
    }[content_type] || 'conteúdo';

    const conteudo = `🚨 RELATÓRIO - ${contentTypeLabel.toUpperCase()}\n\nMotivo: ${reason}\n\nID do conteúdo: ${content_id}\nReportado por: ${user.full_name} (${user.email})`;

    // Criar mensagem
    const mensagem = await base44.asServiceRole.entities.MensagemDireta.create({
      conversa_id,
      remetente_email: user.email,
      remetente_nome: user.full_name || user.email,
      remetente_foto: user.data?.photo_url || null,
      destinatario_email: admin.email,
      destinatario_nome: admin.full_name || admin.email,
      destinatario_foto: admin.data?.photo_url || null,
      conteudo,
      lida: false,
      message_type,
      related_entity_id: report_id,
      related_entity_type: 'Report'
    });

    // Criar notificação para admin
    await base44.asServiceRole.entities.Notification.create({
      title: `🚨 Nova denúncia de ${contentTypeLabel}`,
      message: `${user.full_name}: ${reason.substring(0, 80)}...`,
      type: 'admin',
      reference_type: 'chat',
      reference_id: mensagem.id,
      user_email: admin.email,
      redirect_page: 'SuporteAdmin'
    });

    return Response.json({ 
      success: true, 
      message: 'Relatório enviado aos administradores',
      mensagem 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});