import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validação de segurança via API Key do N8N
    const apiKey = req.headers.get('X-API-Key');
    const validKey = Deno.env.get('API_KEY_N8N');
    
    if (!apiKey || apiKey !== validKey) {
      return Response.json({ error: 'API Key inválida ou ausente' }, { status: 401 });
    }

    const body = await req.json();
    const { texto, origem = 'n8n', metadados = {} } = body;

    if (!texto || texto.trim().length === 0) {
      return Response.json({ 
        error: 'Campo "texto" é obrigatório' 
      }, { status: 400 });
    }

    // Extrair vagas do texto usando IA
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `🔍 EXTRAÇÃO AUTOMÁTICA - ANÁLISE COMPLETA (até 50 vagas):

Para CADA VAGA extraia TUDO com MÁXIMA PRECISÃO:

📍 LOCALIZAÇÃO COMPLETA:
   - Cidade (nome completo)
   - Estado (UF: PE, PB, SP, etc - 2 letras)
   - Bairro (se mencionar)
   - Se remoto: city: "Remoto", state: ""
   
📞 TODOS OS CONTATOS:
   - Telefones (WhatsApp, fixo, celular)
   - Emails
   - Instagram, links, formulários

💰 SALÁRIO (apenas valores):
   - "R$ 1.500", "2k a 3k"
   - Ignore "a combinar"

📋 DADOS COMPLETOS:
   - Título/cargo
   - Empresa
   - Descrição detalhada
   - Tipo de contrato (CLT, PJ, Estágio, etc)
   - Modalidade (Presencial, Híbrido, Remoto)

⚠️ NÃO OMITA NENHUMA INFORMAÇÃO!

TEXTO:
${texto}`,
      response_json_schema: {
        type: "object",
        properties: {
          jobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                company: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                salary_range: { type: "string" },
                contact_phone: { type: "string" },
                contact_email: { type: "string" },
                application_link: { type: "string" },
                description: { type: "string" },
                job_type: { type: "string" },
                work_mode: { type: "string" },
                category: { type: "string" },
                job_function: { type: "string" }
              }
            }
          }
        }
      }
    });

    const jobs = resultado?.jobs || [];

    if (jobs.length === 0) {
      return Response.json({ 
        success: true,
        message: 'Nenhuma vaga válida encontrada',
        vagas_criadas: 0
      });
    }

    // Criar vagas no banco (status: published, mas sem premium/featured)
    const vagasCriadas = [];
    
    for (const job of jobs) {
      try {
        // Validar se tem contato
        const hasContact = !!(job.application_link || job.contact_phone || job.contact_email);
        
        const vagaCriada = await base44.asServiceRole.entities.Job.create({
          title: job.title || 'Vaga',
          company: job.company || 'Empresa não informada',
          city: job.city || 'Não informado',
          state: job.state || '',
          salary_range: job.salary_range || '',
          contact_phone: job.contact_phone || '',
          contact_email: job.contact_email || '',
          application_link: job.application_link || '',
          description: job.description || texto.slice(0, 500),
          job_type: job.job_type || 'CLT',
          work_mode: job.work_mode || 'Presencial',
          category: job.category || 'Geral',
          job_function: job.job_function || '',
          is_premium: false,
          is_featured: false,
          status: hasContact ? 'ativa' : 'pending_contact',
          contact_status: hasContact ? 'ok' : 'missing',
          needs_review: !hasContact,
          published_at: new Date().toISOString(),
          origem: 'n8n_text'
        });
        
        // Se não tiver contato, tentar reprocessar até 2x
        if (!hasContact) {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const reprocessResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `🔍 BUSCA PROFUNDA - TENTATIVA ${attempt + 1}/2:
                
ANALISE NOVAMENTE com MÁXIMA ATENÇÃO para encontrar contatos:
- Telefones, WhatsApp, celular
- Emails 
- Instagram, Facebook
- Sites, formulários
- Qualquer outro contato

TEXTO:
${texto}`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    contact_phone: { type: "string" },
                    contact_email: { type: "string" },
                    application_link: { type: "string" },
                    contact_whatsapp: { type: "string" }
                  }
                }
              });

              const foundContact = reprocessResult.contact_phone || 
                                 reprocessResult.contact_email || 
                                 reprocessResult.contact_whatsapp ||
                                 reprocessResult.application_link;

              if (foundContact) {
                await base44.asServiceRole.entities.Job.update(vagaCriada.id, {
                  contact_phone: reprocessResult.contact_phone || vagaCriada.contact_phone,
                  contact_email: reprocessResult.contact_email || vagaCriada.contact_email,
                  contact_whatsapp: reprocessResult.contact_whatsapp || vagaCriada.contact_whatsapp,
                  application_link: reprocessResult.application_link || vagaCriada.application_link,
                  status: 'ativa',
                  contact_status: 'ok',
                  needs_review: false,
                  reprocess_attempts: attempt + 1
                });
                break;
              } else {
                await base44.asServiceRole.entities.Job.update(vagaCriada.id, {
                  reprocess_attempts: attempt + 1
                });
              }
            } catch (e) {
              console.error(`Erro na tentativa ${attempt + 1}:`, e);
            }
          }
        }

        vagasCriadas.push(vagaCriada);
      } catch (error) {
        console.error('Erro ao criar vaga:', error);
      }
    }

    return Response.json({
      success: true,
      message: `${vagasCriadas.length} vaga(s) criada(s) automaticamente via N8N`,
      vagas_criadas: vagasCriadas.length,
      origem,
      metadados,
      vagas: vagasCriadas.map(v => ({
        id: v.id,
        title: v.title,
        company: v.company,
        city: v.city,
        state: v.state,
        status: v.status
      }))
    });

  } catch (error) {
    console.error('Erro em autoPostN8NText:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao processar vagas via N8N'
    }, { status: 500 });
  }
});