import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Apenas notificar admins sobre novos logins sociais
    const body = await req.json();
    
    if (body.action === 'notify_login') {
      const { user_email, user_name, login_method } = body;
      
      await base44.asServiceRole.functions.invoke('notifyAdmins', {
        event_type: 'user_login',
        data: { user_email, user_name, login_method }
      });

      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});