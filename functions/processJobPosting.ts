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

    // ETAPA 1: IDENTIFICAÇÃO DE VAGAS
    const identificationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `ANÁLISE CRÍTICA: Identifique QUANTAS VAGAS existem neste anúncio.

REGRAS:
1. Se houver múltiplos CARGOS diferentes → criar vaga separada para cada
2. Se houver apenas UM cargo mas múltiplas VAGAS dele → criar apenas UMA entrada

Exemplos:
- "Contrata-se: Vendedor, Caixa, Gerente" → 3 VAGAS SEPARADAS
- "10 vagas de Vendedor" → 1 VAGA (quantidade não importa)
- "Operador de Caixa e ASG" → 2 VAGAS SEPARADAS

IMPORTANTE: Liste APENAS os cargos/títulos, um por linha.

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
          }
        }
      }
    });

    const jobTitles = identificationResult.job_titles || [];
    
    if (jobTitles.length === 0) {
      return Response.json({ 
        error: 'Nenhuma vaga identificada',
        suggestion: 'Verifique se o texto/imagem contém informações claras sobre cargos' 
      }, { status: 400 });
    }

    // ETAPA 2: EXTRAÇÃO DE INFORMAÇÕES GERAIS (herdadas por todas as vagas)
    const generalInfoResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `EXTRAIA INFORMAÇÕES GERAIS que se aplicam a TODAS as vagas:

REGRAS CRÍTICAS:
1. CIDADE e UF:
   - Sempre identifique ambos
   - Formato: city: "Nome Cidade", state: "UF" (2 letras maiúsculas)
   - Recife → city: "Recife", state: "PE"
   - João Pessoa → city: "João Pessoa", state: "PB"
   - São Paulo → city: "São Paulo", state: "SP"
   - Campina Grande → city: "Campina Grande", state: "PB"

2. FAIXA SALARIAL:
   - Extraia SOMENTE valores monetários
   - Válido: "R$ 1.500", "2.000", "1.500 a 2.500"
   - INVÁLIDO: "a combinar", "benefícios", horários
   - Se não houver valor numérico: deixe VAZIO

3. EMPRESA:
   - Nome completo da empresa
   - Se não mencionar: use "Empresa confidencial"

4. DESCRIÇÃO GERAL:
   - Benefícios comuns a todas as vagas
   - Horário de trabalho (se geral)
   - Forma de candidatura
   - Observações gerais

5. TIPOS DE CONTRATO:
   - CLT, PJ, Autônomo, Estágio, Jovem Aprendiz, Temporário, Freelancer, Trainee, Home Office

${imageUrl ? 'IMAGEM:' : 'TEXTO:'}`,
      file_urls: imageUrl ? [imageUrl] : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          company: { type: "string", description: "Nome da empresa" },
          city: { type: "string", description: "Cidade completa" },
          state: { type: "string", description: "UF (2 letras maiúsculas)" },
          general_description: { type: "string", description: "Descrição/benefícios gerais" },
          salary_range: { type: "string", description: "Faixa salarial APENAS numérica" },
          contract_types: { 
            type: "array",
            items: { type: "string" },
            description: "Tipos de contrato identificados"
          },
          contact_phone: { type: "string", description: "Telefone" },
          contact_email: { type: "string", description: "Email" },
          application_link: { type: "string", description: "Link" },
          work_schedule: { type: "string", description: "Horário (se geral)" }
        }
      }
    });

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

      specificJobsData.push({
        title,
        ...specificResult
      });
    }

    // ETAPA 4: CLASSIFICAÇÃO DE CATEGORIA PROFISSIONAL
    const categories = await base44.asServiceRole.entities.ProfessionalCategory.list('category_order', 100);
    
    // ETAPA 5: MONTAR VAGAS FINAIS
    const finalJobs = [];
    
    for (const jobData of specificJobsData) {
      // Montar descrição completa
      let fullDescription = generalInfoResult.general_description || '';
      
      if (jobData.specific_activities) {
        fullDescription += `\n\n**Atividades do ${jobData.title}:**\n${jobData.specific_activities}`;
      }
      
      if (jobData.specific_requirements) {
        fullDescription += `\n\n**Requisitos:**\n${jobData.specific_requirements}`;
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
      
      // Montar link de candidatura
      let applicationLink = generalInfoResult.application_link || '';
      if (!applicationLink && generalInfoResult.contact_phone) {
        const phone = generalInfoResult.contact_phone.replace(/\D/g, '');
        const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
        applicationLink = `https://wa.me/${finalPhone}`;
      } else if (!applicationLink && generalInfoResult.contact_email) {
        applicationLink = `mailto:${generalInfoResult.contact_email}`;
      }
      
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
        city: generalInfoResult.city || '',
        state: generalInfoResult.state || '',
        job_function: jobFunction,
        category: jobCategory,
        description: fullDescription.trim(),
        salary_range: validSalary,
        contract_types: generalInfoResult.contract_types || [],
        application_link: applicationLink,
        image_url: imageUrl || '',
        additional_info: '',
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