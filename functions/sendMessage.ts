import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('sendMessage: Usuário não autenticado');
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('sendMessage: Usuário autenticado:', user.email);

    const { 
      destinatario_email, 
      conteudo, 
      message_type = 'user_to_admin',
      related_entity_id,
      related_entity_type 
    } = await req.json();

    console.log('sendMessage: Dados recebidos:', { destinatario_email, conteudo, message_type });

    if (!destinatario_email || !conteudo) {
      return Response.json({ error: 'Destinatário e conteúdo são obrigatórios' }, { status: 400 });
    }

    // Buscar informações do destinatário com retry
    let destinatario = null;
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      destinatario = allUsers.find(u => u.email === destinatario_email);
      console.log('sendMessage: Destinatário encontrado:', destinatario?.email);
    } catch (error) {
      console.log('sendMessage: Erro ao buscar usuário, criando dados default:', error);
      destinatario = {
        email: destinatario_email,
        full_name: destinatario_email.split('@')[0],
        data: {}
      };
    }

    // Criar conversa_id ordenando emails alfabeticamente
    const emails = [user.email, destinatario_email].sort();
    const conversa_id = emails.join('_');
    
    console.log('sendMessage: conversa_id criada:', conversa_id);

    // Criar mensagem
    const mensagem = await base44.asServiceRole.entities.MensagemDireta.create({
      conversa_id,
      remetente_email: user.email,
      remetente_nome: user.full_name || user.email,
      remetente_foto: user.data?.photo_url || null,
      remetente_tipo: user.role === 'admin' ? 'admin' : 'user',
      destinatario_email,
      destinatario_nome: destinatario.full_name || destinatario.email,
      destinatario_foto: destinatario.data?.photo_url || null,
      conteudo,
      lida: false,
      message_type,
      related_job_id: related_entity_id || null,
      related_user_email: related_entity_type || null
    });

    console.log('sendMessage: Mensagem criada com sucesso:', {
      id: mensagem.id,
      conversa_id: mensagem.conversa_id,
      remetente: mensagem.remetente_email,
      destinatario: mensagem.destinatario_email
    });

    // Criar notificação para o destinatário
    try {
      await base44.asServiceRole.entities.Notification.create({
        title: `💬 Nova mensagem de ${user.full_name || user.email}`,
        message: conteudo.substring(0, 100) + (conteudo.length > 100 ? '...' : ''),
        type: 'user',
        reference_type: 'chat',
        reference_id: mensagem.id,
        user_email: destinatario_email,
        icon_url: user.data?.photo_url || null,
        redirect_page: 'Home'
      });
      console.log('sendMessage: Notificação criada para:', destinatario_email);
    } catch (notifError) {
      console.error('sendMessage: Erro ao criar notificação:', notifError);
    }

    return Response.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso',
      mensagem 
    });

  } catch (error) {
    console.error('sendMessage: Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});