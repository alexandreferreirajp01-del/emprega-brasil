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
   - Se não houver cidade informada: deixe city vazio ("")
   
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
                contact_whatsapp: { type: "string" },
                application_link: { type: "string" },
                contact_instagram: { type: "string" },
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
    // Função auxiliar: Enriquecimento
    const enriquecerComPipeline = async (titulo) => {
      try {
        return await base44.integrations.Core.InvokeLLM({
          prompt: `Como especialista em recursos humanos, forneça contexto profissional genérico APENAS para a área de "${titulo}":

1. Resumo da função (2-3 linhas sobre o cargo de forma genérica)
2. Atividades comuns desta profissão (4-6 exemplos típicos)
3. Competências profissionais comuns (5-8 skills esperadas)

IMPORTANTE: Não mencionar empresa ou informações específicas. Apenas contexto geral.`,
          model: 'gpt_5',
          response_json_schema: {
            type: "object",
            properties: {
              resumo: { type: "string" },
              atividades: { type: "array", items: { type: "string" } },
              competencias: { type: "array", items: { type: "string" } }
            }
          }
        });
      } catch (e) {
        return null;
      }
    };

    // Dedup: buscar vagas das últimas 2h (agente envia p/ múltiplos grupos em sequência)
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    let vagasRecentes = [];
    try {
      vagasRecentes = await base44.asServiceRole.entities.Job.filter({ created_date: { $gte: duasHorasAtras } });
    } catch (e) {
      console.warn('Erro ao buscar vagas recentes:', e.message);
    }
    const norm = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const isDuplicata = (title, company) => {
      if (!title || title.length < 4) return false;
      return vagasRecentes.some(v => norm(v.title) === norm(title) && norm(v.company) === norm(company));
    };

    const vagasCriadas = [];
    
    for (const job of jobs) {
      try {
        if (isDuplicata(job.title, job.company)) {
          console.log(`[DEDUP] Ignorada: ${job.title} - ${job.company}`);
          continue;
        }

        // Enriquecimento com pipeline
        const enriquecimento = await enriquecerComPipeline(job.title);

        // Validar se tem contato
        const hasContact = !!(
          job.application_link || 
          job.contact_phone || 
          job.contact_email || 
          job.contact_whatsapp ||
          job.contact_instagram
        );

        // ✅ CONDIÇÃO 1: detectar home office / remoto / híbrido no conteúdo
        const textoCompleto = (
          (job.title || '') + ' ' + (job.description || '') + ' ' + texto
        ).toLowerCase();
        const isHomeOfficeContent = /home\s*office|#home|híbrido|hibrido|#híbrido|#hibrido|remoto|#remoto|trabalhar\s*em\s*casa|trabalhe\s*em\s*casa/.test(textoCompleto);
        const isPremium = isHomeOfficeContent || job.work_mode === 'Remoto' || job.work_mode === 'Híbrido';
        const isPCD = /\bpcd\b|pessoa com defici[êe]ncia|portador.*defici[êe]ncia|inclus[aã]o.*defici[êe]ncia/.test(textoCompleto);

        // ✅ CONDIÇÃO 2: detectar ausência de localização → status pending_location
        const hasLocation = !!(
          (job.city && job.city.trim() !== '' && job.city.trim().toLowerCase() !== 'não informado') ||
          (job.state && job.state.trim() !== '')
        );
        const noLocation = !hasLocation;

        const statusFinal = noLocation ? 'pending_review' : (hasContact ? 'ativa' : 'pending_contact');

        // Garantir que "Remoto" não seja usado como nome de cidade
        const cityFinal = (job.city && job.city.trim().toLowerCase() !== 'remoto') ? job.city : '';

        // Montar descrição enriquecida
        let descricaoEnriquecida = job.description || texto.slice(0, 500);
        if (enriquecimento?.resumo) {
          descricaoEnriquecida = `${enriquecimento.resumo}\n\n${descricaoEnriquecida}`;
        }
        if (enriquecimento?.atividades?.length > 0) {
          descricaoEnriquecida += `\n\nAtividades comuns dessa área:\n${enriquecimento.atividades.map(a => `- ${a}`).join('\n')}`;
        }
        if (enriquecimento?.competencias?.length > 0) {
          descricaoEnriquecida += `\n\nCompetências profissionais comuns:\n${enriquecimento.competencias.map(c => `- ${c}`).join('\n')}`;
        }

        const vagaCriada = await base44.asServiceRole.entities.Job.create({
          title: job.title || 'Vaga',
          company: job.company || 'Empresa não informada',
          city: cityFinal || '',
          state: job.state || '',
          salary_range: job.salary_range || '',
          contact_phone: job.contact_phone || '',
          contact_email: job.contact_email || '',
          contact_whatsapp: job.contact_whatsapp || '',
          application_link: job.application_link || '',
          additional_info: job.contact_instagram ? `Instagram: ${job.contact_instagram}` : '',
          description: descricaoEnriquecida,
          job_type: job.job_type || 'CLT',
          work_mode: isPremium ? (job.work_mode || 'Remoto') : (job.work_mode || 'Presencial'),
          category: job.category || 'Geral',
          job_function: job.job_function || '',
          is_premium: isPremium,
          is_featured: false,
          is_pcd: isPCD,
          is_home_office: isPremium,
          status: statusFinal,
          contact_status: hasContact ? 'ok' : 'missing',
          needs_review: noLocation || !hasContact,
          review_notes: noLocation ? 'Sem localização detectada - aguardando revisão' : '',
          published_at: statusFinal === 'ativa' ? new Date().toISOString() : null,
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
                                 reprocessResult.application_link ||
                                 reprocessResult.contact_instagram;

              if (foundContact) {
                const additionalInfo = reprocessResult.contact_instagram ? 
                  `Instagram: ${reprocessResult.contact_instagram}` : 
                  vagaCriada.additional_info;
                
                await base44.asServiceRole.entities.Job.update(vagaCriada.id, {
                  contact_phone: reprocessResult.contact_phone || vagaCriada.contact_phone,
                  contact_email: reprocessResult.contact_email || vagaCriada.contact_email,
                  contact_whatsapp: reprocessResult.contact_whatsapp || vagaCriada.contact_whatsapp,
                  application_link: reprocessResult.application_link || vagaCriada.application_link,
                  additional_info: additionalInfo,
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

        // ✅ Notificar todos os usuários (email + sininho + push)
        const latestJob = await base44.asServiceRole.entities.Job.filter({ id: vagaCriada.id }, '-created_date', 1).then(r => r?.[0] || vagaCriada);
        if (latestJob?.status === 'ativa' && !noLocation) {
          try {
            await base44.asServiceRole.functions.invoke('notifyNewJob', {
              jobId: latestJob.id,
              jobTitle: latestJob.title,
              jobCompany: latestJob.company,
              jobCity: latestJob.city,
              isHomeOffice: (latestJob.work_mode === 'Remoto' || latestJob.is_remote)
            });
          } catch (notifyErr) {
            console.error('Erro ao notificar vaga:', notifyErr.message);
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