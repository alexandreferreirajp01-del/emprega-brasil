import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // ===============================
        // 🔐 Controle de autenticação
        // ===============================
        const allowInternalTest = Deno.env.get('ALLOW_INTERNAL_TEST') === 'true';
        const expectedToken = Deno.env.get('ZAPI_API_KEY');

        if (!allowInternalTest) {
            const authHeader =
                req.headers.get('authorization') ||
                req.headers.get('Authorization');

            if (!authHeader || !authHeader.includes(expectedToken)) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // ===============================
        // 📦 Body
        // ===============================
        const body = await req.json();

        // ===============================
        // 🛑 Grupo autorizado
        // ===============================
        if (!body.isGroup || body.groupName !== 'Emprega Brasil+ Automação') {
            return Response.json({
                success: false,
                ignored: true,
                reason: 'Grupo não autorizado'
            });
        }

        // ===============================
        // 📩 Mensagem
        // ===============================
        const message = body.message || body;
        const messageText = message.text || message.message || '';

        if (!messageText) {
            return Response.json({
                success: false,
                error: 'Mensagem vazia'
            }, { status: 400 });
        }

        const clean = cleanText(messageText);

        if (clean.length < 20) {
            return Response.json({
                success: false,
                error: 'Texto insuficiente'
            }, { status: 400 });
        }

        // ===============================
        // 🤖 IA
        // ===============================
        const vacancies = await extractVacancies(base44, clean);

        if (!vacancies.length) {
            return Response.json({
                success: false,
                error: 'Nenhuma vaga encontrada'
            });
        }

        // ===============================
        // 🗃️ Criar vaga
        // ===============================
        const createdJobs = [];

        for (const v of vacancies) {
            const job = await base44.asServiceRole.entities.Job.create({
                title: v.title || 'Vaga sem título',
                company: v.company || 'Empresa não informada',
                city: v.city || null,
                state: v.state || null,
                description: v.description || clean,
                application_link: v.application_link || null,
                status: 'pending_ai',
                is_premium: false,
                is_featured: false
            });

            createdJobs.push(job);
        }

        return Response.json({
            success: true,
            jobs_created: createdJobs.length
        });

    } catch (err) {
        console.error(err);
        return Response.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
});

// ===============================
function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

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
        prompt: `Extraia vagas de emprego do texto:\n${text}`,
        response_json_schema: schema
    });

    return result?.vacancies || [];
}

