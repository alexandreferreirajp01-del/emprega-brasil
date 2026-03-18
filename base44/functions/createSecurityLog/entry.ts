import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                   user.role === 'admin' || 
                   user.subscription_type === 'admin';
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { admin_email, admin_name, action_type, description, metadata } = body;

    // Criar log de segurança
    const log = await base44.asServiceRole.entities.SecurityLog.create({
      admin_email,
      admin_name,
      action_type,
      description,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      log_id: log.id 
    });

  } catch (error) {
    console.error('Error creating security log:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});