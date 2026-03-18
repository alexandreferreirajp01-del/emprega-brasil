/**
 * FUNÇÃO CENTRALIZADA PARA REGISTRAR NOTIFICAÇÕES
 * Usada por todas as outras funções para criar notificações
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: true });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      title,
      message,
      type = 'system',
      reference_type = null,
      reference_id = null,
      user_email = null,
      sent_to_all = false,
      icon_url = null,
      redirect_page = null,
      redirect_params = null,
      job_id = null
    } = body;

    if (!title || !message) {
      return Response.json({ 
        success: false, 
        error: 'title e message são obrigatórios' 
      }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      title,
      message,
      type,
      reference_type,
      reference_id,
      user_email,
      sent_to_all,
      icon_url,
      redirect_page,
      redirect_params,
      job_id,
      is_read: false
    });

    return Response.json({ 
      success: true, 
      notification_id: notification.id 
    });

  } catch (error) {
    console.error('[createNotification] Erro:', error.message);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});