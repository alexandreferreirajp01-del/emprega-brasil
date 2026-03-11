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
    const {
      imagem_url,
      imagem_base64,
      mime_type = 'image/jpeg',
      texto_adicional = '',
      origem = 'n8n',
      metadados = {}
    } = body;

    if (!imagem_url && !imagem_base64) {
      return Response.json({
        error: 'Campo "imagem_url" ou "imagem_base64" é obrigatório'
      }, { status: 400 });
    }

    // Se recebeu base64, fazer upload para storage permanente
    let urlFinal = imagem_url;

    if (imagem_base64) {
      try {
        console.log('Recebeu base64, fazendo upload para storage...');

        // Converter base64 para Blob
        const byteString = atob(imagem_base64);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        const ext = mime_type.includes('png') ? 'png' : mime_type.includes('webp') ? 'webp' : 'jpg';
        const blob = new Blob([byteArray], { type: mime_type });
        const file = new File([blob], `vaga_n8n_${Date.now()}.${ext}`, { type: mime_type });

        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        urlFinal = uploadResult?.file_url;
        console.log('Upload concluído:', urlFinal);
      } catch (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        return Response.json({
          error: 'Erro ao fazer upload da imagem',
          details: uploadError.message
        }, { status: 500 });
      }
    }

    if (!urlFinal) {
      return Response.json({ error: 'Não foi possível obter URL da imagem' }, { status: 400 });
    }

    // Função auxiliar para enriquecimento com pipeline
    const enriquecerComPipeline = async (titulo) => {
      try {
        return await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Como especialista em recursos humanos, forneça contexto profissional genérico APENAS para a área de "${titulo}":

1. Resumo da função (2-3 linhas sobre o cargo de forma genérica)
2. Atividades comuns desta profissão (4-6 exemplos típicos)
3. Competências profissionais comuns (5-8 skills esperadas)

IMPORTANTE: Não mencionar a empresa ou informações específicas. Apenas contexto geral da profissão.`,
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

    // Extrair dados da imagem usando IA com análise profunda
    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `🔍 ANÁLISE COMPLETA DE IMAGEM - EXTRAIA TODAS AS VAGAS:

${texto_adicional ? `TEXTO ADICIONAL:\n${texto_adicional}\n\n` : ''}

Para CADA VAGA na imagem, extraia com MÁXIMA PRECISÃO:

📍 LOCALIZAÇÃO:
   - Cidade completa
   - Estado (UF - 2 letras)
   - Bairro, endereço completo
   - CEP se houver
   - Se não houver localidade informada: deixe city vazio ("")

📞 CONTATOS (TODOS - muito importante!):
   - Telefones com DDD (WhatsApp, fixo, celular)
   - Emails (ex: rh@empresa.com.br)
   - Instagram, Facebook
   - Sites, formulários online
   - QR Codes (links)

💰 SALÁRIO (apenas valores):
   - "R$ 1.500", "2.000 a 3.000"
   - Deixe VAZIO se não tiver valor

📋 INFORMAÇÕES:
   - Título/cargo exato
   - Nome da empresa
   - Descrição completa
   - Requisitos
   - Benefícios
   - Tipo de contrato
   - Modalidade (Presencial/Híbrido/Remoto)

⚠️ REGRA PRINCIPAL: Procure TODOS os contatos em toda a imagem, incluindo rodapé, caixas de texto, selos, marcas d'água. NÃO INVENTE - extraia apenas o que está visível!`,
      file_urls: [urlFinal],
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
                neighborhood: { type: "string" },
                cep: { type: "string" },
                numero: { type: "string" },
                salary_range: { type: "string" },
                contact_phone: { type: "string" },
                contact_email: { type: "string" },
                contact_whatsapp: { type: "string" },
                contact_instagram: { type: "string" },
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
    console.log(`IA extraiu ${jobs.length} vaga(s). Contatos:`, jobs.map(j => ({
      title: j.title,
      email: j.contact_email,
      phone: j.contact_phone,
      whatsapp: j.contact_whatsapp,
      link: j.application_link
    })));

    if (jobs.length === 0) {
      return Response.json({
        success: true,
        message: 'Nenhuma vaga válida encontrada na imagem',
        vagas_criadas: 0
      });
    }

    // Criar vagas no banco
    const vagasCriadas = [];

    for (const job of jobs) {
      try {
        // Enriquecimento com pipeline
        const enriquecimento = await enriquecerComPipeline(job.title);

        const hasContact = !!(
          job.application_link ||
          job.contact_phone ||
          job.contact_email ||
          job.contact_whatsapp ||
          job.contact_instagram
        );

        // ✅ CONDIÇÃO 1: detectar home office / remoto / híbrido
        const textoCompleto = (
          (job.title || '') + ' ' + (job.description || '') + ' ' + (texto_adicional || '')
        ).toLowerCase();
        const isHomeOfficeContent = /home\s*office|#home|híbrido|hibrido|#híbrido|#hibrido|remoto|#remoto|trabalhar\s*em\s*casa|trabalhe\s*em\s*casa/.test(textoCompleto);
        const isPremium = isHomeOfficeContent || job.work_mode === 'Remoto' || job.work_mode === 'Híbrido';

        // ✅ CONDIÇÃO 2: detectar ausência de localização
        const hasLocation = !!(
          (job.city && job.city.trim() !== '' && job.city.trim().toLowerCase() !== 'não informado') ||
          (job.state && job.state.trim() !== '')
        );
        const noLocation = !hasLocation;

        const statusFinal = noLocation ? 'pending_review' : (hasContact ? 'ativa' : 'pending_contact');

        // Montar descrição enriquecida
        let descricaoEnriquecida = job.description || 'Vaga extraída automaticamente';
        if (enriquecimento?.resumo) {
          descricaoEnriquecida = `${enriquecimento.resumo}\n\n${descricaoEnriquecida}`;
        }
        if (enriquecimento?.atividades?.length > 0) {
          descricaoEnriquecida += `\n\nAtividades comuns dessa área:\n${enriquecimento.atividades.map(a => `- ${a}`).join('\n')}`;
        }
        if (enriquecimento?.competencias?.length > 0) {
          descricaoEnriquecida += `\n\nCompetências profissionais comuns:\n${enriquecimento.competencias.map(c => `- ${c}`).join('\n')}`;
        }

        const additionalInfo = job.contact_instagram ? `Instagram: ${job.contact_instagram}` : '';

        // Garantir que "Remoto" não seja usado como nome de cidade
        const cityFinal = (job.city && job.city.trim().toLowerCase() !== 'remoto') ? job.city.trim() : '';

        const vagaCriada = await base44.asServiceRole.entities.Job.create({
          title: job.title || 'Vaga',
          company: job.company || 'Empresa não informada',
          city: cityFinal,
          state: job.state || '',
          neighborhood: job.neighborhood || '',
          cep: job.cep || '',
          numero: job.numero || '',
          salary_range: job.salary_range || '',
          contact_phone: job.contact_phone || '',
          contact_email: job.contact_email || '',
          contact_whatsapp: job.contact_whatsapp || '',
          application_link: job.application_link || '',
          additional_info: additionalInfo,
          description: descricaoEnriquecida,
          job_type: job.job_type || 'CLT',
          work_mode: isPremium ? (job.work_mode || 'Remoto') : (job.work_mode || 'Presencial'),
          category: job.category || 'Geral',
          job_function: job.job_function || '',
          image_url: urlFinal,
          is_premium: isPremium,
          is_featured: false,
          is_home_office: isPremium,
          status: statusFinal,
          contact_status: hasContact ? 'ok' : 'missing',
          needs_review: noLocation || !hasContact,
          review_notes: noLocation ? 'Sem localização detectada - aguardando revisão' : '',
          published_at: statusFinal === 'ativa' ? new Date().toISOString() : null,
          origem: 'n8n_image'
        });

        // Se não tiver contato, tentar reprocessar mais 1 vez
        if (!hasContact) {
          try {
            const reprocessResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `🔍 BUSCA PROFUNDA NA IMAGEM:

ANALISE TODA A IMAGEM COM MÁXIMA ATENÇÃO buscando qualquer forma de contato:
- Telefones, celulares, WhatsApp com ou sem DDD
- Emails (ex: rh@empresa.com.br)
- Instagram, Facebook, sites
- QR codes, formulários, links
- Texto em rodapé, cantos, selos, caixas separadas

${texto_adicional ? `TEXTO: ${texto_adicional}` : ''}

RETORNE QUALQUER contato que encontrar na imagem.`,
              file_urls: [urlFinal],
              response_json_schema: {
                type: "object",
                properties: {
                  contact_phone: { type: "string" },
                  contact_email: { type: "string" },
                  application_link: { type: "string" },
                  contact_whatsapp: { type: "string" },
                  contact_instagram: { type: "string" }
                }
              }
            });

            const foundContact = reprocessResult.contact_phone ||
              reprocessResult.contact_email ||
              reprocessResult.contact_whatsapp ||
              reprocessResult.application_link ||
              reprocessResult.contact_instagram;

            if (foundContact) {
              const addInfo = reprocessResult.contact_instagram ?
                `Instagram: ${reprocessResult.contact_instagram}` :
                vagaCriada.additional_info;

              await base44.asServiceRole.entities.Job.update(vagaCriada.id, {
                contact_phone: reprocessResult.contact_phone || vagaCriada.contact_phone,
                contact_email: reprocessResult.contact_email || vagaCriada.contact_email,
                contact_whatsapp: reprocessResult.contact_whatsapp || vagaCriada.contact_whatsapp,
                application_link: reprocessResult.application_link || vagaCriada.application_link,
                additional_info: addInfo,
                status: 'ativa',
                contact_status: 'ok',
                needs_review: false,
                reprocess_attempts: 1
              });
            } else {
              await base44.asServiceRole.entities.Job.update(vagaCriada.id, {
                reprocess_attempts: 1
              });
            }
          } catch (e) {
            console.error('Erro no reprocessamento:', e);
          }
        }

        // ✅ Notificar todos os usuários (email + sininho + push)
        const jobToNotify = vagaCriada;
        if (jobToNotify?.status === 'ativa' && !noLocation) {
          try {
            await base44.asServiceRole.functions.invoke('notifyNewJob', {
              jobId: jobToNotify.id,
              jobTitle: jobToNotify.title,
              jobCompany: jobToNotify.company,
              jobCity: jobToNotify.city,
              isHomeOffice: (jobToNotify.work_mode === 'Remoto' || jobToNotify.is_remote)
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
        contact_email: v.contact_email,
        contact_phone: v.contact_phone,
        contact_whatsapp: v.contact_whatsapp,
        status: v.status
      }))
    });

  } catch (error) {
    console.error('Erro em autoPostN8NImage:', error);
    return Response.json({
      error: error.message,
      details: 'Erro ao processar imagem via N8N'
    }, { status: 500 });
  }
});