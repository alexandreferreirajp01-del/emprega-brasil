import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('🚀 WEBHOOK Z-API CHAMADO');

        const base44 = createClientFromRequest(req);

        // ===============================
        // 🔐 Token (opcional, compatível Z-API)
        // ===============================
        const expectedToken = Deno.env.get('ZAPI_API_KEY');

        const authHeader =
            req.headers.get('authorization') ||
            req.headers.get('Authorization') ||
            req.headers.get('x-api-key') ||
            req.headers.get('apikey');

        if (expectedToken && authHeader && !authHeader.includes(expectedToken)) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ===============================
        // 📦 Parse body
        // ===============================
        const body = await req.json();
        console.log('📦 Payload recebido:', JSON.stringify(body));

        // ===============================
        // 🛑 Validar grupo
        // ===============================
        const groupName =
            body.groupName ||
            body.chatName ||
            body.message?.groupName ||
            body.chat?.name;

        const isGroup =
            body.isGroup === true ||
            body.chat?.isGroup === true ||
            body.from?.endsWith('@g.us');

        if (!isGroup || groupName !== 'Emprega Brasil+ Automação') {
            console.log('⛔ Grupo ignorado:', groupName);
            return Response.json({ ignored: true });
        }

        // ===============================
        // 📩 Texto da mensagem (compatível Z-API)
        // ===============================
        const messageText =
            body.message?.text ||
            body.text ||
            body.message ||
            body.body ||
            '';

        const imageUrl =
            body.image?.imageUrl ||
            body.message?.image?.imageUrl ||
            body.imageUrl ||
            null;

        if (!messageText && !imageUrl) {
            console.log('⚠️ Mensagem sem conteúdo válido');
            return Response.json({ ignored: true });
        }

        let fullText = messageText;

        // ===============================
        // 🧹 Limpeza
        // ===============================
        fullText = cleanText(fullText);

        if (fullText.length < 10) {
            return Response.json({ ignored: true });
        }

        // ===============================
        // 🤖 Extrair vagas com IA
        // ===============================
        const vacancies = await extractVacancies(base44, fullText);

        if (!vacancies.length) {
            return Response.json({ ignored: true });
        }

        // ===============================
        // 🗃️ Criar vagas pendentes
        // ===============================
        const createdJobs = [];

        for (const vacancy of vacancies) {
            const job = await base44.asServiceRole.entities.Job.create({
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
                image_url: imageUrl,
                status: 'pending_ai',
                is_premium: false,
                is_featured: false,
                published_at: null
            });

            createdJobs.push(job.id);
        }

        console.log('✅ Vagas criadas:', createdJobs.length);

        return Response.json({
            success: true,
            jobs_created: createdJobs.length
        });

    } catch (error) {
        console.error('🔥 ERRO NO WEBHOOK:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// ===============================
// 🧹 Limpeza de texto
// ===============================
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/📢|🔔|⚠️|❗|🎯|💼|🏢|📍|💰|👉|🔗|📲/g, '')
        .trim();
}

// ===============================
// 🤖 Extração com IA
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
                        description: { type: "string" },
                        application_link: { type: "string" }
                    },
                    required: ["title"]
                }
            }
        },
        required: ["vacancies"]
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extraia TODAS as vagas de emprego do texto abaixo:\n\n${text}`,
        response_json_schema: schema
    });

    return result?.vacancies || [];
}
