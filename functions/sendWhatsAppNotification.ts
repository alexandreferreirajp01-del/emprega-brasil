import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Envia notificações para grupos do WhatsApp
 * Usa a API do WhatsApp Web via serviço externo
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar autenticação e permissões
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin' || 
                    user.subscription_type === 'admin' ||
                    user.email === 'alexandreferreirajp01@gmail.com';

    if (!isAdmin) {
      return Response.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Obter dados do body
    const body = await req.json();
    const { message, title, icon } = body;

    if (!message || !title) {
      return Response.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 });
    }

    // Grupos do WhatsApp configurados
    const whatsappGroups = [
      'https://chat.whatsapp.com/BhIZZ0MD3ZsHLfcM2Iuzey',
      'https://chat.whatsapp.com/LvdwP9HJiVOCVPyoO7WdgA'
    ];

    // Montar mensagem formatada
    const iconEmoji = icon === 'briefcase' ? '💼' : 
                      icon === 'alert' ? '🚨' : 
                      icon === 'star' ? '⭐' : 
                      icon === 'fire' ? '🔥' : 
                      icon === 'sparkles' ? '✨' : 
                      icon === 'target' ? '🎯' : 
                      icon === 'rocket' ? '🚀' : '📢';

    const whatsappMessage = `${iconEmoji} *${title}*\n\n${message}\n\n🔗 Acesse: https://vagasabertasparaiba.info/home`;

    // Enviar para cada grupo
    const results = [];
    
    for (const groupUrl of whatsappGroups) {
      try {
        // Extrair ID do grupo do link
        const groupId = groupUrl.split('/').pop();
        
        // Construir URL para enviar mensagem
        // Usando wa.me que abre WhatsApp com mensagem pré-preenchida
        const sendUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
        
        results.push({
          group: groupUrl,
          status: 'prepared',
          url: sendUrl,
          message: 'Mensagem preparada. Use o link para enviar manualmente ao grupo.'
        });
      } catch (error) {
        results.push({
          group: groupUrl,
          status: 'error',
          error: error.message
        });
      }
    }

    // Log da ação
    console.log('WhatsApp notification prepared:', {
      admin: user.email,
      title,
      groups: whatsappGroups.length,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Notificações preparadas para WhatsApp',
      results,
      note: 'Como não há API oficial para grupos, você pode copiar a mensagem abaixo e enviar manualmente aos grupos',
      formattedMessage: whatsappMessage,
      groups: whatsappGroups
    });

  } catch (error) {
    console.error('Erro ao preparar notificação WhatsApp:', error);
    return Response.json(
      { error: 'Erro ao processar notificação', details: error.message }, 
      { status: 500 }
    );
  }
});