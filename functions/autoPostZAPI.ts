import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // ===============================
        // 🔐 Validação do token Z-API
        // ===============================
        const expectedToken = Deno.env.get('ZAPI_API_KEY');

        const authHeader =
            req.headers.get('Authorization') ||
            req.headers.get('authorization') ||
            req.headers.get('x-api-key') ||
            req.headers.get('apikey');

        if (!authHeader || !authHeader.includes(expectedToken)) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ===============================
        // 📦 Parse do body
        // ===============================
        const body = await req.json();

        // ===============================
        // 🛑 Validar grupo autorizado
        // ===============================
        if (!body.isGroup || body.groupName !== 'Emprega Brasil+ Automação') {
            return Response.json({
                success: false,
                ignored: true,
                reason: 'Grupo não autorizado'
            });
        }

        // ===============================
        // 📩 Normalizar mensagem
        // ===============================
        const message = body.message || body;

        const messageText =
            message.text ||
            (message.text && message.text.message) ||
            message.message ||
            '';

        const imageUrl =
            (message.image && message.image.imageUrl) ||
            message.imageUrl ||
            null;

        const mediaUrl =
            (message.media && message.media.url) ||
            message.mediaUrl ||
            null;

        if (!messageText && !imageUrl && !mediaUrl) {
            return Response.json({
                success: false,
                error: 'Nenhum conteúdo válido encontrado na mensagem'
            }, { status: 400 });
        }

        let fullText = messageText;
        const imageUrls = [];

        if (imageUrl) imageUrls.push(imageUrl);
        if (mediaUrl && mediaUrl !== imageUrl) imageUrls.push(mediaUrl);

        // ===============================
        // 🧠 OCR com IA (imagens)
        // ===============================
        if (imageUrls.length > 0) {
            for (const imgUrl of imageUrls) {
                try {
                    const extractResult =
                        await base44.asServiceRole.integrations.Core.InvokeLLM({
                            prompt: 'Extraia TODO o texto visível desta imagem. Retorne APENAS o texto extraído.',
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

        // ===============================
        // 🧹 Limpeza do texto
        // ===============================
        fullText = cleanText(fullText);

        if (!fullText || fullText.length < 20) {
            return Response.json({
                success: false,
                error: 'Texto muito curto ou vazio após processamento'
            }, { status: 400 });
        }

        // ===============================
        // 🤖 Extração das vagas com IA
        // ===============================
        const vacancies = await extractVacancies(base44, fullText);

        if (!vacancies || vacancies.length === 0) {
            return Response.json({
                success: false,
                error: 'Nenhuma vaga encontrada no texto'
            }, { status: 400 });
        }

        // ===============================
        // 🗃️ Criar vagas pendentes
        // ===============================
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

                const created =
                    await base44.asServiceRole.entities.Job.create(jobData);

                createdJobs.push(created);
            } catch (e) {
                console.error('Erro ao criar vaga:', e.message);
            }
        }

        return Response.json({
            success: true,
            message: `${createdJobs.length} vaga(s) criada(s) e aguardando aprovação`,
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

// ===============================
// 🧹 Limpeza de texto
// ===============================
function cleanText(text) {
    if (!text) return '';

    return text
        .replace(/📢|🔔|⚠️|❗|✅|🎯|💼|🏢|📍|💰|📝|👉|🔗|📲|📞|☎️|📧|✉️|🌐|🔴|🟢|🟡|⭐|🌟/g, '')
        .replace(/URGENTE|ATENÇÃO|IMPORTANTE|CONFIRA|COMPARTILHE|DIVULGUE/gi, '')
        .replace(/Encaminhe esta mensagem|Repasse|Divulgue|Compartilhe/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ===============================
// 🤖 Extração de vagas com IA
// ===============================
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
                            title: { type: "string" },
                            company: { type: "string" },
                            city: { type: "string" },
                            state: { type: "string" },
                            salary_range: { type: "string" },
                            job_type: { type: "string" },
                            contract_types: { type: "array", items: { type: "string" } },
                            category: { type: "string" },
                            job_function: { type: "string" },
                            description: { type: "string" },
                            additional_info: { type: "string" },
                            application_link: { type: "string" }
                        },
                        required: ["title"]
                    }
                }
            },
            required: ["vacancies"]
        };

        const prompt = `Analise o texto a seguir e extraia TODAS as vagas de emprego mencionadas.\n\nTexto:\n${text}`;

        const result =
            await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: schema
            });

        return result && result.vacancies ? result.vacancies : [];

    } catch (error) {
        console.error('Erro ao extrair vagas:', error);
        return [];
    }
}
