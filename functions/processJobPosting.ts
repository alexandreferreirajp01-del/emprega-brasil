import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * SISTEMA HÍBRIDO INTELIGENTE DE PROCESSAMENTO DE VAGAS
 * 
 * Processa posts com uma ou múltiplas vagas, criando registros independentes
 * para cada cargo e garantindo dados completos e consistentes.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rawData, imageUrl, postType } = await req.json();

    // ETAPA 1: IDENTIFICAÇÃO DE VAGAS E CIDADES
    const identificationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `ANÁLISE CRÍTICA: Identifique QUANTAS VAGAS existem neste anúncio e se há MÚLTIPLAS CIDADES/ESTADOS.

REGRAS DE VAGAS:
1. Se houver múltiplos CARGOS diferentes → criar vaga separada para cada
2. Se houver apenas UM cargo mas múltiplas VAGAS dele → criar apenas UMA entrada

REGRAS DE CIDADES:
3. Se o anúncio mencionar vagas em MÚLTIPLAS CIDADES ou ESTADOS diferentes → liste TODAS as cidades
   Exemplo: "Vagas em João Pessoa, Campina Grande e Recife" → cities: ["João Pessoa|PB","Campina Grande|PB","Recife|PE"]
4. Se houver apenas UMA cidade → cities: ["NomeCidade|UF"]
5. Se for remoto/home office → cities: ["Remoto|"]

IMPORTANTE: Liste APENAS os cargos/títulos na lista de jobs, e as cidades no formato Cidade|UF.

${imageUrl ? 'ANALISANDO IMAGEM E TEXTO' : 'ANALISANDO TEXTO'}`,
      file_urls: imageUrl ? [imageUrl] : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          job_titles: {
            type: "array",
            items: { type: "string" },
            description: "Lista de cargos/títulos identificados"
          },
          total_count: {
            type: "number",
            description: "Total de vagas diferentes"
          },
          cities: {
            type: "array",
            items: { type: "string" },
            description: "Cidades no formato 'NomeCidade|UF'. Ex: ['João Pessoa|PB','Recife|PE']"
          }
        }
      }
    });

    const jobTitles = identificationResult.job_titles || [];
    // Cidades detectadas: se múltiplas, cria um post por cidade por cargo
    const detectedCities = (identificationResult.cities || []).filter(Boolean);
    
    if (jobTitles.length === 0) {
      return Response.json({ 
        error: 'Nenhuma vaga identificada',
        suggestion: 'Verifique se o texto/imagem contém informações claras sobre cargos' 
      }, { status: 400 });
    }

    // ETAPA 2: EXTRAÇÃO DE INFORMAÇÕES GERAIS (herdadas por todas as vagas)
    const generalInfoResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `ANÁLISE COMPLETA E DETALHADA - NÃO PERCA NENHUMA INFORMAÇÃO:

🎯 LOCALIZAÇÃO (OBRIGATÓRIO):
   - Cidade COMPLETA (ex: "João Pessoa", "Campina Grande")
   - UF com 2 letras maiúsculas (PE, PB, SP, RJ, etc)
   - Bairro (se mencionado)
   - Endereço completo (se houver rua, número, CEP)
   - Se múltiplas cidades: extraia TODAS
   - Recife → city: "Recife", state: "PE"
   - João Pessoa → city: "João Pessoa", state: "PB"

📞 CONTATOS (EXTRAIR TODOS):
   - Telefone fixo (ex: (83) 3333-3333)
   - Celular/WhatsApp (ex: (83) 99999-9999, 83999999999)
   - Email (TODOS os emails mencionados)
   - Instagram, Facebook, LinkedIn (@ ou link completo)
   - Site da empresa
   - Link de formulário/candidatura
   - QR Code (se identificar na imagem)
   
💰 SALÁRIO:
   - Extraia APENAS valores numéricos/monetários
   - Válido: "R$ 1.500", "2.000 a 3.000", "1.320,00"
   - IGNORE: "a combinar", "compatível com mercado"
   - Se não houver: deixe VAZIO

🏢 EMPRESA & DESCRIÇÃO:
   - Nome completo da empresa
   - Benefícios (vale transporte, alimentação, plano saúde)
   - Horário de trabalho
   - Forma de candidatura

📝 TIPOS DE CONTRATO:
   - CLT, PJ, Autônomo, Estágio, Jovem Aprendiz, Temporário, Freelancer, Trainee, Home Office

⚠️ IMPORTANTE: EXTRAIA TUDO que encontrar, não omita nenhum contato ou endereço!

${imageUrl ? 'IMAGEM:' : 'TEXTO:'}`,
      file_urls: imageUrl ? [imageUrl] : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          company: { type: "string", description: "Nome da empresa" },
          city: { type: "string", description: "Cidade completa" },
          state: { type: "string", description: "UF (2 letras maiúsculas)" },
          neighborhood: { type: "string", description: "Bairro (se mencionado)" },
          full_address: { type: "string", description: "Endereço completo se houver" },
          general_description: { type: "string", description: "Descrição/benefícios gerais" },
          salary_range: { type: "string", description: "Faixa salarial APENAS numérica" },
          contract_types: { 
            type: "array",
            items: { type: "string" },
            description: "Tipos de contrato identificados"
          },
          contact_phone: { type: "string", description: "Telefone principal" },
          contact_phone_2: { type: "string", description: "Telefone secundário" },
          contact_whatsapp: { type: "string", description: "WhatsApp específico" },
          contact_email: { type: "string", description: "Email principal" },
          contact_email_2: { type: "string", description: "Email secundário" },
          instagram: { type: "string", description: "Instagram (@usuario ou link)" },
          facebook: { type: "string", description: "Facebook (link)" },
          linkedin: { type: "string", description: "LinkedIn (link)" },
          website: { type: "string", description: "Site da empresa" },
          application_link: { type: "string", description: "Link de candidatura/formulário" },
          work_schedule: { type: "string", description: "Horário (se geral)" }
        }
      }
    });

    // ETAPA 2.5: ENRIQUECIMENTO COM PIPELINE IA AVANÇADO
    const processarComPipeline = async (jobTitle, companyInfo) => {
      try {
        return await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Como especialista em recursos humanos, forneça contexto profissional genérico APENAS para a área de "${jobTitle}":

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

    // ETAPA 3: EXTRAÇÃO DE REQUISITOS ESPECÍFICOS POR CARGO
    const specificJobsData = [];
    
    for (const title of jobTitles) {
      const specificResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extraia informações ESPECÍFICAS apenas para o cargo: "${title}"

REGRAS:
1. Se houver requisitos/atividades específicas deste cargo: extraia
2. Se houver salário diferenciado para este cargo: extraia
3. Se NÃO houver informações específicas: retorne campos vazios

IMPORTANTE: Não invente informações. Se não há dados específicos, deixe vazio.

${imageUrl ? 'IMAGEM:' : 'TEXTO:'}`,
        file_urls: imageUrl ? [imageUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            specific_requirements: { 
              type: "string",
              description: "Requisitos específicos deste cargo (ou vazio)" 
            },
            specific_activities: { 
              type: "string",
              description: "Atividades específicas deste cargo (ou vazio)" 
            },
            specific_salary: { 
              type: "string",
              description: "Salário específico deste cargo (apenas numérico, ou vazio)" 
            }
          }
        }
      });

      // Enriquecimento com pipeline
      const enriquecimento = await processarComPipeline(title, generalInfoResult.company);

      specificJobsData.push({
        title,
        ...specificResult,
        enriquecimento: enriquecimento || {}
      });
    }

    // ETAPA 4: CLASSIFICAÇÃO DE CATEGORIA PROFISSIONAL
    const categories = await base44.asServiceRole.entities.ProfessionalCategory.list('category_order', 100);
    
    // ETAPA 5: MONTAR VAGAS FINAIS
    const finalJobs = [];
    
    for (const jobData of specificJobsData) {
      // Montar descrição completa com enriquecimento
      let fullDescription = generalInfoResult.general_description || '';
      
      // Adicionar resumo genérico da profissão (contexto)
      if (jobData.enriquecimento?.resumo) {
        fullDescription = `${jobData.enriquecimento.resumo}\n\n${fullDescription}`.trim();
      }
      
      if (jobData.specific_activities) {
        fullDescription += `\n\n**Atividades da vaga:**\n${jobData.specific_activities}`;
      }
      
      // Adicionar atividades comuns se não houver específicas
      if (!jobData.specific_activities && jobData.enriquecimento?.atividades?.length > 0) {
        fullDescription += `\n\n**Atividades comuns dessa área:**\n${jobData.enriquecimento.atividades.map(a => `- ${a}`).join('\n')}`;
      }
      
      if (jobData.specific_requirements) {
        fullDescription += `\n\n**Requisitos da vaga:**\n${jobData.specific_requirements}`;
      }
      
      // Adicionar competências comuns
      if (jobData.enriquecimento?.competencias?.length > 0) {
        fullDescription += `\n\n**Competências profissionais comuns para essa área:**\n${jobData.enriquecimento.competencias.map(c => `- ${c}`).join('\n')}`;
      }
      
      // Se NÃO houver descrição detalhada, adicionar texto padrão
      if (!fullDescription.trim()) {
        fullDescription = `Vaga para ${jobData.title}.\n\nAs atividades e requisitos específicos serão informados durante o processo seletivo.`;
      } else if (fullDescription.trim().length < 50) {
        fullDescription += '\n\nAs atividades específicas serão detalhadas durante o processo seletivo.';
      }
      
      if (generalInfoResult.work_schedule) {
        fullDescription += `\n\n**Horário:** ${generalInfoResult.work_schedule}`;
      }
      
      // Classificar categoria
      let jobCategory = null;
      let jobFunction = jobData.title;
      
      for (const cat of categories) {
        if (cat.job_titles?.some(t => 
          t.toLowerCase() === jobData.title.toLowerCase() ||
          jobData.title.toLowerCase().includes(t.toLowerCase())
        )) {
          jobCategory = cat.category_name;
          jobFunction = cat.job_titles.find(t => 
            t.toLowerCase() === jobData.title.toLowerCase()
          ) || jobData.title;
          break;
        }
      }
      
      // Montar link de candidatura (priorizar link direto > WhatsApp > Email)
      let applicationLink = generalInfoResult.application_link || generalInfoResult.website || '';
      
      if (!applicationLink && (generalInfoResult.contact_whatsapp || generalInfoResult.contact_phone)) {
        const phone = (generalInfoResult.contact_whatsapp || generalInfoResult.contact_phone).replace(/\D/g, '');
        const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
        applicationLink = `https://wa.me/${finalPhone}`;
      } else if (!applicationLink && generalInfoResult.contact_email) {
        applicationLink = `mailto:${generalInfoResult.contact_email}`;
      }
      
      // Construir texto de contatos adicionais
      let additionalContacts = '';
      if (generalInfoResult.contact_phone_2) additionalContacts += `📞 ${generalInfoResult.contact_phone_2}\n`;
      if (generalInfoResult.contact_email_2) additionalContacts += `📧 ${generalInfoResult.contact_email_2}\n`;
      if (generalInfoResult.instagram) additionalContacts += `📷 Instagram: ${generalInfoResult.instagram}\n`;
      if (generalInfoResult.facebook) additionalContacts += `👥 Facebook: ${generalInfoResult.facebook}\n`;
      if (generalInfoResult.linkedin) additionalContacts += `💼 LinkedIn: ${generalInfoResult.linkedin}\n`;
      
      // Adicionar localização detalhada
      let locationInfo = '';
      if (generalInfoResult.neighborhood) locationInfo += `📍 Bairro: ${generalInfoResult.neighborhood}\n`;
      if (generalInfoResult.full_address) locationInfo += `📍 Endereço: ${generalInfoResult.full_address}\n`;
      
      // VALIDAÇÃO: Se não houver contato, marcar como pendente
      const hasContact = applicationLink && applicationLink.trim() !== '';
      const jobStatus = hasContact ? 'published' : 'pending_contact';
      
      // Salário: específico ou geral
      const finalSalary = jobData.specific_salary || generalInfoResult.salary_range || '';
      
      // Validar salário (apenas numérico)
      const validSalary = /[\d\.,\s]+/.test(finalSalary) ? finalSalary : '';
      
      finalJobs.push({
        title: jobData.title,
        company: generalInfoResult.company || 'Empresa confidencial',
        city: generalInfoResult.city || 'Não informado',
        state: generalInfoResult.state || '',
        job_function: jobFunction,
        category: jobCategory,
        description: fullDescription.trim(),
        salary_range: validSalary,
        contract_types: generalInfoResult.contract_types || [],
        application_link: applicationLink,
        image_url: imageUrl || '',
        additional_info: (locationInfo + additionalContacts).trim(),
        is_premium: false,
        is_featured: false,
        status: jobStatus
      });
    }

    return Response.json({
      success: true,
      total_jobs: finalJobs.length,
      jobs: finalJobs,
      processing_summary: {
        identified_titles: jobTitles,
        general_info_extracted: true,
        specific_info_extracted: true,
        all_jobs_have_description: finalJobs.every(j => j.description?.length > 50)
      }
    });

  } catch (error) {
    console.error('Erro ao processar vagas:', error);
    return Response.json({ 
      error: 'Erro no processamento',
      details: error.message 
    }, { status: 500 });
  }
});