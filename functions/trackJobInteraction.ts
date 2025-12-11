import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id, interaction_type, job_title, job_city } = await req.json();

    // Não requer autenticação obrigatória, mas registra se tiver
    let user = null;
    let userEmail = '';
    let userPlan = 'visitor';
    let userCity = '';

    try {
      user = await base44.auth.me();
      if (user) {
        userEmail = user.email;
        userPlan = user.subscription_type || 'visitor';
        userCity = user.city || '';
      }
    } catch (e) {
      // Visitante não autenticado
    }

    // Criar registro de interação
    await base44.asServiceRole.entities.JobInteraction.create({
      user_email: userEmail,
      job_id,
      job_title: job_title || '',
      job_city: job_city || '',
      interaction_type, // 'view', 'contact', 'apply', 'share'
      user_plan: userPlan,
      user_city: userCity
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Erro ao registrar interação:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});