import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.email !== 'alexandreferreirajp01@gmail.com' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar TODAS as vagas pending_review e pending_ai via service role
    const jobs = await base44.asServiceRole.entities.Job.filter(
      { status: { $in: ['pending_review', 'pending_ai'] } },
      '-created_date',
      500
    );

    // Filtrar vagas pendentes de agentes + N8N + sem contato
    // Inclui: whatsapp_agent, telegram_bot, n8n_automatico, e qualquer origem pendente
    const agentJobs = jobs.filter(job =>
      job.origem === 'whatsapp_agent' ||
      job.origem === 'telegram_bot' ||
      job.origem === 'n8n_automatico' ||
      job.status === 'pending_review' // Caso tenha sido salva via N8N sem origem clara
    );

    return Response.json({ jobs: agentJobs, total: agentJobs.length });
  } catch (error) {
    console.error('getPendingJobs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});