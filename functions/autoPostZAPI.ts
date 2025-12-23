import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ===============================
    // 📦 Body
    // ===============================
    const body = await req.json();

    // ===============================
    // 🛑 Validação do grupo (Z-API envia em campos diferentes)
    // ===============================
    const groupName =
      body.groupName ||
      body.chatName ||
      body.chat?.name ||
      body.chat?.subject;

    if (!body.isGroup || groupName !== 'Emprega Brasil+ Automação') {
      return Response.json({
        success: false,
        ignored: true,
        reason: 'Grupo não autorizado'
      });
    }

    // ===============================
    // 📩 Normalização da mensagem
    // ===============================
    const message = body.message || body;

    let text = '';

    if (typeof message.text === 'string') {
      text = message.text;
    } else if (typeof message.text === 'object' && message.text?.message) {
      text = message.text.message;
    } else if (typeof message.message === 'string') {
      text = message.message;
    }

    // caption de imagem
    if (!text && message.image?.caption) {
      text = message.image.caption;
    }

    // ===============================
    // 🖼️ Imagem
    // ===============================
    const imageUrl =
      message.image?.imageUrl ||
      message.imageUrl ||
      null;

    let fullText = text || '';

    // ===============================
    // 🧠 OCR (se houver imagem)
    // ===============================
    if (imageUrl) {
      try {
        const ocrText =
          await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt:
              'Extraia TODO o texto visível da imagem. Retorne apenas o texto.',
            file_urls: [imageUrl]
          });

        if (ocrText && ocrText.trim()) {
          fullText += '\n\n' + ocrText;
        }
      } catch (err) {
        console.error('Erro OCR:', err.message);
      }
    }

    // ===============================
    // 🧹 Limpeza
    // ===============================
    fullText = cleanText(fullText);

    if (fullText.length < 15) {
      return Response.json({
        success: false,
        error: 'Texto insuficiente'
      }, { status: 400 });
    }

    // ===============================
    // 🤖 IA – Extração das vagas
    // ===============================
    const vacancies = await extractVacancies(base44, fullText);

    if (!vacancies.length) {
      return Response.json({
        success: false,
        error: 'Nenhuma vaga encontrada'
      }, { status: 400 });
    }

    // ===============================
    // 🗃️ Criar vagas pendentes
    // ===============================
    const createdJobs = [];

    for (const v of vacancies) {
      const job = await base44.asServiceRole.entities.Job.create({
        title: v.title || 'Vaga sem título',
        company: v.company || 'Empresa não informada',
        city: v.city || null,
        state: v.state || null,
        description: v.description || fullText,
        application_link: v.application_link || null,
        image_url: imageUrl,
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
    .replace(/📢|🚀|🔥|⚠️|❗|👉|🔗/g, '')
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
            description: { type: "string" },
            application_link: { type: "string" }
          },
          required: ["title"]
        }
      }
    },
    required: ["vacancies"]
  };

  const result =
    await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extraia TODAS as vagas do texto abaixo:\n\n${text}`,
      response_json_schema: schema
    });

  return result?.vacancies || [];
}
