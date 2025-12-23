import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // ===============================
        // 🔐 Validação inteligente (Base44 x Z-API)
        // ===============================
        const expectedToken = Deno.env.get('ZAPI_API_KEY');

        const authHeader =
            req.headers.get('authorization') ||
            req.headers.get('Authorization');

        const apiKeyHeader =
            req.headers.get('x-api-key') ||
            req.headers.get('apikey');

        // Se NÃO for chamada interna da Base44, exige token Z-API
        const isInternalBase44Call = !!apiKeyHeader;

        if (!isInternalBase44Call) {
            if (!authHeader || !authHeader.includes(expectedToken)) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
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
            message.message ||
            '';

        const imageUrl =
            (message.image && message.image.imageUrl) ||
            message.imageUrl ||
            null;

        if (!messageText && !imageUrl) {
            return Response.json({
                success: false,
                error: 'Nenhum conteúdo válido encontrado'
            }, { status: 400 });
        }

        let fullText = messageText;
        const imageUrls = [];

        if (imageUrl) imageUrls.push(imageUrl);

        // ===============================
        // 🧠 OCR em imagens (se houver)
        // ===============================
        if (imageUrls.length > 0) {
            for (const imgUrl of imageUrls) {
                try {
                    const extractResult =
                        await base44.asServiceRole.integrations.Core.InvokeLLM({
                            prompt: 'Extraia TODO o texto visível desta imagem. Retorne apenas o texto.',
                            file_urls: [imgUrl]
                        });

                    if (extractResult && extractResult.trim()) {
                        fullText += '\n\n' + extractResult;
                    }
                } catch (e) {
                    console.error('Erro OCR:', e.message);
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
                error: 'Texto insuficiente para análise'
            }, { status: 400 });
        }

        // ===============================
        // 🤖 Extração das vagas com IA
        // ===============================
        const vacancies = await extractVacancies(base44, fullText);

        if (!vacancies.length) {
            return Response.json({
                success: false,
                error: 'Nenhuma vaga identificada'
            }, { status: 400 });
        }

        // ===============================
        // 🗃️ Criar vagas pendentes
        // ===============================
        const createdJobs = [];

        for (const vacancy of vacancies) {
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
                description: vacancy.description || fullText,
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
        }

        return Response.json({
            success: true,
            jobs_created: createdJobs.length,
            jobs: createdJobs.map(j => ({ id: j.id, title: j.title }))
        });

    } catch (error) {
        console.error('Erro autoPostZAPI:', error);
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
    return text
        .replace(/📢|🔔|⚠️|❗|✅|🎯|💼|🏢|📍|💰|📝|👉|🔗|📲|📞|☎️|📧|✉️|🌐|⭐/g, '')
        .replace(/URGENTE|ATENÇÃO|IMPORTANTE|COMPARTILHE|DIVULGUE/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ===============================
// 🤖 Extração de vagas com IA
// ===============================
async function extractVacancies(base44, text) {
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

    const prompt = `
Extraia TODAS as vagas de emprego do texto abaixo.
Separe corretamente cada vaga.

Texto:
${text}
`;

    const result =
        await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: schema
        });

    return result?.vacancies || [];
}
