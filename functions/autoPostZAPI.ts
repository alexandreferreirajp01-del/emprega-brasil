import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Validar token Z-API
        const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
        const expectedToken = Deno.env.get('ZAPI_API_KEY');
        
        if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse body da requisição Z-API
        const body = await req.json();
        
        // Extrair dados da mensagem Z-API
        const messageText = body.text?.message || body.message || '';
        const imageUrl = body.image?.imageUrl || body.imageUrl || null;
        const mediaUrl = body.media?.url || body.mediaUrl || null;
        
        // Se não tem texto nem imagem, retornar erro
        if (!messageText && !imageUrl && !mediaUrl) {
            return Response.json({ 
                success: false, 
                error: 'Nenhum conteúdo válido encontrado na mensagem' 
            }, { status: 400 });
        }

        let fullText = messageText;
        const imageUrls = [];
        
        // Se tem imagem/mídia, adicionar à lista
        if (imageUrl) imageUrls.push(imageUrl);
        if (mediaUrl && mediaUrl !== imageUrl) imageUrls.push(mediaUrl);
        
        // Se tem imagens, extrair texto delas com IA
        if (imageUrls.length > 0) {
            console.log('Extraindo texto de imagens com IA...');
            
            for (const imgUrl of imageUrls) {
                try {
                    const extractResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                        prompt: 'Extraia TODO o texto visível desta imagem. Retorne APENAS o texto extraído, sem comentários ou formatação adicional.',
                        file_urls: [imgUrl]
                    });
                    
                    if (extractResult && extractResult.trim()) {
                        fullText += '\n\n' + extractResult;
                    }
                } catch (e) {
                    console.error('Erro ao extrair texto da imagem:', e.message);
                }
            }
        }

        // Limpar o texto extraído
        fullText = cleanText(fullText);
        
        if (!fullText || fullText.length < 20) {
            return Response.json({ 
                success: false, 
                error: 'Texto muito curto ou vazio após processamento' 
            }, { status: 400 });
        }

        console.log('Texto processado:', fullText);

        // Extrair vagas do texto com IA
        const vacancies = await extractVacancies(base44, fullText);
        
        if (!vacancies || vacancies.length === 0) {
            return Response.json({ 
                success: false, 
                error: 'Nenhuma vaga encontrada no texto' 
            }, { status: 400 });
        }

        console.log(`${vacancies.length} vaga(s) encontrada(s)`);

        // Criar vagas pendentes
        const createdJobs = [];
        
        for (const vacancy of vacancies) {
            try {
                const jobData = {
                    title: vacancy.title || 'Vaga sem título',
                    company: vacancy.company || 'Empresa não informada',
                    city: vacancy.city || null,
                    state: vacancy.state || null,
                    salary_range: vacancy.salary_range || null,
                    job_type: vacancy.job_type || null,
                    contract_types: vacancy.contract_types || [],
                    category: vacancy.category || null,
                    job_function: vacancy.job_function || null,
                    description: vacancy.description || '',
                    additional_info: vacancy.additional_info || null,
                    application_link: vacancy.application_link || null,
                    image_url: imageUrls[0] || null,
                    status: 'pending_ai',
                    is_premium: false,
                    is_featured: false,
                    published_at: null
                };

                const created = await base44.asServiceRole.entities.Job.create(jobData);
                createdJobs.push(created);
            } catch (e) {
                console.error('Erro ao criar vaga:', e.message);
            }
        }

        return Response.json({
            success: true,
            message: `${createdJobs.length} vaga(s) criada(s) com sucesso e aguardando aprovação`,
            jobs_created: createdJobs.length,
            jobs: createdJobs.map(j => ({ id: j.id, title: j.title }))
        });

    } catch (error) {
        console.error('Erro no autoPostZAPI:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});

// Função para limpar texto
function cleanText(text) {
    if (!text) return '';
    
    return text
        .replace(/📢|🔔|⚠️|❗|✅|🎯|💼|🏢|📍|💰|📝|👉|🔗|📲|📞|☎️|📧|✉️|🌐|🔴|🟢|🟡|⭐|🌟/g, '')
        .replace(/URGENTE|ATENÇÃO|IMPORTANTE|CONFIRA|COMPARTILHE|DIVULGUE/gi, '')
        .replace(/Encaminhe esta mensagem|Repasse|Divulgue|Compartilhe/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Função para extrair vagas do texto com IA
async function extractVacancies(base44, text) {
    try {
        const schema = {
            type: "object",
            properties: {
                vacancies: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Título/cargo da vaga" },
                            company: { type: "string", description: "Nome da empresa" },
                            city: { type: "string", description: "Cidade (apenas o nome, sem estado)" },
                            state: { type: "string", description: "UF do estado (2 letras, ex: PB, SP)" },
                            salary_range: { type: "string", description: "Faixa salarial se mencionada" },
                            job_type: { 
                                type: "string", 
                                description: "Tipo de vaga",
                                enum: ["CLT", "Home Office", "Estágio", "Temporário", "Freelancer", "Jovem Aprendiz", "PJ", "PCD"]
                            },
                            contract_types: {
                                type: "array",
                                items: {
                                    type: "string",
                                    enum: ["CLT", "PJ", "Autônomo", "Estágio", "Jovem Aprendiz", "Temporário", "Freelancer", "Trainee", "Banco de Talentos"]
                                },
                                description: "Tipos de contratação aceitos"
                            },
                            category: { type: "string", description: "Categoria/área da vaga" },
                            job_function: { type: "string", description: "Função específica" },
                            description: { type: "string", description: "Descrição completa da vaga, requisitos, responsabilidades" },
                            additional_info: { type: "string", description: "Informações adicionais, benefícios" },
                            application_link: { type: "string", description: "Link, WhatsApp, email ou instrução para candidatura" }
                        },
                        required: ["title"]
                    }
                }
            },
            required: ["vacancies"]
        };

        const prompt = `Analise o texto a seguir e extraia TODAS as vagas de emprego mencionadas. 
        
Para cada vaga, identifique:
- Título/cargo
- Empresa
- Localização (cidade e estado/UF)
- Salário se mencionado
- Tipo de vaga (CLT, Home Office, Estágio, etc)
- Tipos de contratação aceitos
- Descrição completa
- Como se candidatar (link, WhatsApp, email)

IMPORTANTE: 
- Se a vaga mencionar "Home Office" ou "Remoto", use job_type: "Home Office"
- Separe cada vaga distinta mesmo que sejam da mesma empresa
- Inclua TODOS os detalhes disponíveis na descrição

Texto:
${text}`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: schema
        });

        return result?.vacancies || [];
        
    } catch (error) {
        console.error('Erro ao extrair vagas:', error);
        return [];
    }
}