import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = [
      {
        name: "Vaga Única - Profissional",
        type: "single_job",
        title_template: "🔥 Nova Vaga: {{job_title}} na {{company}}",
        message_template: "Uma excelente oportunidade para {{job_title}} acaba de ser publicada!",
        email_subject_template: "Nova Vaga: {{job_title}} na {{company}}",
        icon: "🔥",
        is_active: true
      },
      {
        name: "Vaga Única - Urgente",
        type: "single_job",
        title_template: "⚡ URGENTE: {{job_title}} na {{company}}",
        message_template: "Não perca tempo! Vaga para {{job_title}} disponível agora!",
        email_subject_template: "URGENTE: {{job_title}} na {{company}}",
        icon: "⚡",
        is_active: true
      },
      {
        name: "Múltiplas Vagas - Entusiasta",
        type: "batch_jobs",
        title_template: "🎉 {{num_jobs}} Novas Oportunidades!",
        message_template: "Acabamos de adicionar {{num_jobs}} vagas fresquinhas para você explorar!",
        email_subject_template: "{{num_jobs}} Novas Vagas no Emprega Brasil+",
        icon: "🎉",
        is_active: true
      },
      {
        name: "Múltiplas Vagas - Motivacional",
        type: "batch_jobs",
        title_template: "💼 {{num_jobs}} Vagas Disponíveis!",
        message_template: "Sua próxima vaga pode estar entre estas {{num_jobs}} oportunidades!",
        email_subject_template: "{{num_jobs}} Oportunidades Te Aguardam",
        icon: "💼",
        is_active: true
      },
      {
        name: "Múltiplas Vagas - Alerta",
        type: "batch_jobs",
        title_template: "🚨 {{num_jobs}} Novas Vagas Publicadas!",
        message_template: "Não perca: {{num_jobs}} novas chances de emprego esperam por você!",
        email_subject_template: "Alerta: {{num_jobs}} Novas Vagas",
        icon: "🚨",
        is_active: true
      },
      {
        name: "Múltiplas Vagas - Destaque",
        type: "batch_jobs",
        title_template: "⭐ {{num_jobs}} Vagas em Destaque!",
        message_template: "Confira as {{num_jobs}} oportunidades recém-adicionadas no Emprega Brasil+!",
        email_subject_template: "{{num_jobs}} Vagas Selecionadas Para Você",
        icon: "⭐",
        is_active: true
      }
    ];

    const created = [];
    for (const template of templates) {
      const result = await base44.asServiceRole.entities.NotificationTemplate.create(template);
      created.push(result);
    }

    return Response.json({ 
      success: true, 
      created: created.length,
      templates: created
    });

  } catch (error) {
    console.error('Error creating templates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});