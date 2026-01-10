import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ZAPI_API_KEY = Deno.env.get("ZAPI_API_KEY");
const ZAPI_BASE_URL = "https://api.z-api.io"; // Ajuste conforme sua instância

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        console.log("Webhook Z API recebido:", JSON.stringify(body, null, 2));

        // Validar se é uma mensagem com documento/arquivo
        if (!body.media || !body.mimetype) {
            return Response.json({ 
                status: "ignored", 
                message: "Não é um arquivo" 
            });
        }

        const messageFrom = body.phone || body.from;
        const mediaUrl = body.media;
        const mimeType = body.mimetype;

        // Validar tipo de arquivo (Excel, PDF, DOC, TXT)
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
            'application/vnd.ms-excel', // Excel antigo
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!validTypes.includes(mimeType)) {
            await sendWhatsAppMessage(messageFrom, "❌ Tipo de arquivo não suportado. Envie Excel, PDF, Word ou TXT.");
            return Response.json({ status: "error", message: "Tipo de arquivo inválido" });
        }

        // Baixar arquivo
        await sendWhatsAppMessage(messageFrom, "⏳ Recebido! Processando arquivo...");

        // Fazer upload do arquivo para Base44
        const fileResponse = await fetch(mediaUrl);
        const fileBlob = await fileResponse.blob();
        
        const formData = new FormData();
        formData.append('file', fileBlob, 'documento');
        
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
            file: fileBlob
        });

        const fileUrl = uploadResult.file_url;

        // Definir schema JSON para extração de vagas
        const jobSchema = {
            type: "object",
            properties: {
                vagas: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Título da vaga" },
                            company: { type: "string", description: "Nome da empresa" },
                            city: { type: "string", description: "Cidade" },
                            state: { type: "string", description: "UF do estado (2 letras)" },
                            salary_range: { type: "string", description: "Faixa salarial" },
                            job_type: { type: "string", description: "Tipo de vaga (CLT, PJ, etc)" },
                            category: { type: "string", description: "Categoria da vaga" },
                            job_function: { type: "string", description: "Função/cargo" },
                            description: { type: "string", description: "Descrição completa" },
                            application_link: { type: "string", description: "Link ou instrução para candidatura" }
                        },
                        required: ["title"]
                    }
                }
            }
        };

        // Extrair dados usando IA
        await sendWhatsAppMessage(messageFrom, "🤖 Extraindo vagas com IA...");
        
        const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
            file_url: fileUrl,
            json_schema: jobSchema
        });

        if (extractResult.status !== "success" || !extractResult.output?.vagas) {
            await sendWhatsAppMessage(messageFrom, "❌ Não consegui extrair vagas do arquivo. Verifique o formato.");
            return Response.json({ status: "error", details: extractResult.details });
        }

        const vagas = extractResult.output.vagas;
        
        if (vagas.length === 0) {
            await sendWhatsAppMessage(messageFrom, "❌ Nenhuma vaga encontrada no arquivo.");
            return Response.json({ status: "error", message: "Nenhuma vaga encontrada" });
        }

        await sendWhatsAppMessage(messageFrom, `✅ Encontrei ${vagas.length} vaga(s)! Publicando...`);

        // Criar vagas no banco
        let sucessos = 0;
        let erros = 0;

        for (const vaga of vagas) {
            try {
                // Auto-completar estado se cidade estiver presente
                if (vaga.city && !vaga.state) {
                    const cities = await base44.asServiceRole.entities.City.filter({ name: vaga.city });
                    if (cities.length > 0) {
                        vaga.state = cities[0].state;
                    }
                }

                await base44.asServiceRole.entities.Job.create({
                    ...vaga,
                    status: 'published',
                    published_at: new Date().toISOString()
                });
                sucessos++;
            } catch (e) {
                console.error("Erro ao criar vaga:", e);
                erros++;
            }
        }

        // Enviar confirmação
        const mensagemFinal = `✅ *Postagem Concluída!*\n\n` +
            `📊 *Resumo:*\n` +
            `✅ Publicadas: ${sucessos}\n` +
            `❌ Erros: ${erros}\n\n` +
            `🎉 As vagas já estão disponíveis no app!`;

        await sendWhatsAppMessage(messageFrom, mensagemFinal);

        return Response.json({ 
            status: "success", 
            vagas_publicadas: sucessos,
            erros: erros
        });

    } catch (error) {
        console.error("Erro no webhook Z API:", error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

// Função para enviar mensagens via Z API
async function sendWhatsAppMessage(phone, message) {
    try {
        const instanceId = ZAPI_API_KEY.split('-')[0]; // Extrai ID da instância
        const token = ZAPI_API_KEY;
        
        await fetch(`${ZAPI_BASE_URL}/instances/${instanceId}/token/${token}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                message: message
            })
        });
    } catch (e) {
        console.error("Erro ao enviar mensagem WhatsApp:", e);
    }
}