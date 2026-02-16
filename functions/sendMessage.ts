import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { 
      destinatario_email, 
      conteudo, 
      message_type = 'user_to_admin',
      related_entity_id,
      related_entity_type 
    } = await req.json();

    if (!destinatario_email || !conteudo) {
      return Response.json({ error: 'Destinatário e conteúdo são obrigatórios' }, { status: 400 });
    }

    // Buscar informações do destinatário
    const allUsers = await base44.asServiceRole.entities.User.list();
    const destinatario = allUsers.find(u => u.email === destinatario_email);

    if (!destinatario) {
      return Response.json({ error: 'Destinatário não encontrado' }, { status: 404 });
    }

    // Criar conversa_id ordenando emails alfabeticamente
    const emails = [user.email, destinatario_email].sort();
    const conversa_id = emails.join('_');

    // Criar mensagem
    const mensagem = await base44.asServiceRole.entities.MensagemDireta.create({
      conversa_id,
      remetente_email: user.email,
      remetente_nome: user.full_name || user.email,
      remetente_foto: user.data?.photo_url || null,
      destinatario_email,
      destinatario_nome: destinatario.full_name || destinatario.email,
      destinatario_foto: destinatario.data?.photo_url || null,
      conteudo,
      lida: false,
      message_type,
      related_entity_id: related_entity_id || null,
      related_entity_type: related_entity_type || null
    });

    // Criar notificação para o destinatário
    await base44.asServiceRole.entities.Notification.create({
      title: `💬 Nova mensagem de ${user.full_name || user.email}`,
      message: conteudo.substring(0, 100) + (conteudo.length > 100 ? '...' : ''),
      type: 'user',
      reference_type: 'chat',
      reference_id: mensagem.id,
      user_email: destinatario_email,
      redirect_page: 'Mensagens',
      redirect_params: { conversa_id }
    });

    return Response.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso',
      mensagem 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});