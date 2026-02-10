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
    const { imagem_url, texto_adicional = '', origem = 'n8n', metadados = {} } = body;

    if (!imagem_url) {
      return Response.json({ 
        error: 'Campo "imagem_url" é obrigatório' 
      }, { status: 400 });
    }

    // Extrair dados da imagem usando IA com análise profunda
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `🔍 ANÁLISE COMPLETA DE IMAGEM - EXTRAIA TODAS AS VAGAS:

${texto_adicional ? `TEXTO ADICIONAL:\n${texto_adicional}\n\n` : ''}

Para CADA VAGA na imagem, extraia com MÁXIMA PRECISÃO:

📍 LOCALIZAÇÃO:
   - Cidade completa
   - Estado (UF - 2 letras)
   - Bairro, endereço completo
   - CEP se houver
   - Se remoto: city: "Remoto", state: ""
   
📞 CONTATOS (TODOS):
   - Telefones (WhatsApp, fixo, celular)
   - Emails
   - Instagram, Facebook
   - Sites, formulários
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

⚠️ REGRA: NÃO INVENTE - extraia apenas o que está visível!`,
      file_urls: [imagem_url],
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
        message: 'Nenhuma vaga válida encontrada na imagem',
        vagas_criadas: 0
      });
    }

    // Criar vagas no banco
    const vagasCriadas = [];
    
    for (const job of jobs) {
      try {
        // Validar se tem contato
        const hasContact = !!(
          job.application_link || 
          job.contact_phone || 
          job.contact_email || 
          job.contact_whatsapp
        );
        
        const vagaCriada = await base44.asServiceRole.entities.Job.create({
          title: job.title || 'Vaga',
          company: job.company || 'Empresa não informada',
          city: job.city || 'Não informado',
          state: job.state || '',
          neighborhood: job.neighborhood || '',
          cep: job.cep || '',
          numero: job.numero || '',
          salary_range: job.salary_range || '',
          contact_phone: job.contact_phone || '',
          contact_email: job.contact_email || '',
          contact_whatsapp: job.contact_whatsapp || '',
          application_link: job.application_link || '',
          description: job.description || 'Vaga extraída automaticamente',
          job_type: job.job_type || 'CLT',
          work_mode: job.work_mode || 'Presencial',
          category: job.category || 'Geral',
          job_function: job.job_function || '',
          image_url: imagem_url,
          is_premium: false, // Admin define depois
          is_featured: false, // Admin define depois
          status: hasContact ? 'ativa' : 'pending_review',
          published_at: new Date().toISOString()
        });

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
    console.error('Erro em autoPostN8NImage:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao processar imagem via N8N'
    }, { status: 500 });
  }
});