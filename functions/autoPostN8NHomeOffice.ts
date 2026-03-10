import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      origem = 'n8n_homeoffice',
      canal = 'whatsapp',
      grupo_id,
      grupo_nome,
      tipo_mensagem,
      mensagem_texto,
      imagem_url,
      data_recebimento,
    } = body;

    // Validações básicas
    if (!tipo_mensagem || !['texto', 'imagem', 'texto_imagem'].includes(tipo_mensagem)) {
      return Response.json({ 
        error: 'tipo_mensagem inválido. Use: texto, imagem ou texto_imagem' 
      }, { status: 400 });
    }

    if (!mensagem_texto && !imagem_url) {
      return Response.json({ 
        error: 'É necessário fornecer mensagem_texto ou imagem_url' 
      }, { status: 400 });
    }

    // Extrair texto da imagem se necessário
    let textoFinal = mensagem_texto || '';
    
    if (imagem_url && (tipo_mensagem === 'imagem' || tipo_mensagem === 'texto_imagem')) {
      try {
        const extractedData = await base44.integrations.Core.InvokeLLM({
          prompt: `Extraia TODAS as informações de vaga de emprego desta imagem.
          
Retorne APENAS o texto extraído, sem adicionar nada.
Se houver múltiplas vagas, separe-as com "---".

IMPORTANTE:
- Extraia cidade, estado, cargo, salário, requisitos
- Extraia TODOS os contatos: telefone, email, WhatsApp, links
- Mantenha formatação e quebras de linha
- NÃO adicione interpretações`,
          file_urls: [imagem_url],
          response_json_schema: {
            type: 'object',
            properties: {
              texto_extraido: { type: 'string' }
            }
          }
        });

        const textoExtraido = extractedData?.texto_extraido || '';
        if (textoExtraido) {
          textoFinal = textoFinal ? `${textoFinal}\n\n${textoExtraido}` : textoExtraido;
        }
      } catch (error) {
        console.error('Erro ao extrair texto da imagem:', error);
      }
    }

    if (!textoFinal) {
      return Response.json({ 
        error: 'Não foi possível extrair texto da mensagem' 
      }, { status: 400 });
    }

    const textoLimpo = limparTexto(textoFinal);
    const vagasExtraidas = await extrairVagas(base44, textoLimpo);

    if (!vagasExtraidas || vagasExtraidas.length === 0) {
      return Response.json({ 
        success: true,
        message: 'Nenhuma vaga válida encontrada no conteúdo',
        vagas_criadas: 0
      });
    }

    const vagasCriadas = [];
    
    for (const vaga of vagasExtraidas) {
      try {
        const hasContact = !!(
          vaga.link_candidatura || 
          vaga.contact_phone || 
          vaga.contact_email || 
          vaga.contact_whatsapp
        );

        const vagaCriada = await base44.asServiceRole.entities.Job.create({
          title: vaga.titulo,
          company: vaga.empresa || 'Empresa não informada',
          city: (vaga.cidade && vaga.cidade.trim().toLowerCase() !== 'remoto') ? vaga.cidade.trim() : '',
          state: vaga.estado || '',
          neighborhood: vaga.neighborhood || '',
          cep: vaga.cep || '',
          numero: vaga.numero || '',
          salary_range: vaga.salario || '',
          job_type: vaga.tipo_contrato || 'CLT',
          contract_types: vaga.tipos_contratacao || ['CLT'],
          category: vaga.categoria || 'Geral',
          job_function: vaga.funcao || '',
          description: vaga.descricao || textoLimpo,
          additional_info: vaga.informacoes_adicionais || '',
          application_link: vaga.link_candidatura || '',
          contact_email: vaga.contact_email || '',
          contact_phone: vaga.contact_phone || '',
          contact_whatsapp: vaga.contact_whatsapp || '',
          image_url: imagem_url || '',
          // ✅ Sempre premium + home office
          is_premium: true,
          is_featured: false,
          is_remote: true,
          is_home_office: true,
          work_mode: 'Remoto',
          published_at: hasContact ? new Date().toISOString() : null,
          status: hasContact ? 'ativa' : 'pending_contact',
          contact_status: hasContact ? 'ok' : 'missing',
          needs_review: !hasContact,
          origem: 'n8n_homeoffice',
          origin_channel: canal,
          origin_group_id: grupo_id || '',
          origin_group_name: grupo_nome || '',
          origin_date: data_recebimento || new Date().toISOString(),
        });

        // ✅ Notificar (sininho + push) - email vai via fila
        if (vagaCriada?.status === 'ativa') {
          try {
            await base44.asServiceRole.functions.invoke('notifyNewJob', {
              jobId: vagaCriada.id,
              jobTitle: vagaCriada.title,
              jobCompany: vagaCriada.company,
              jobCity: vagaCriada.city,
              isHomeOffice: true
            });
          } catch (notifyErr) {
            console.error('Erro ao notificar vaga home office:', notifyErr.message);
          }
        }

        vagasCriadas.push(vagaCriada);
      } catch (error) {
        console.error('Erro ao criar vaga home office:', error);
      }
    }

    return Response.json({
      success: true,
      message: `${vagasCriadas.length} vaga(s) Home Office Premium criada(s) com sucesso`,
      vagas_criadas: vagasCriadas.length,
      vagas: vagasCriadas.map(v => ({
        id: v.id,
        titulo: v.title,
        empresa: v.company,
        cidade: v.city,
        estado: v.state,
        is_premium: v.is_premium,
        is_home_office: v.is_home_office
      }))
    });

  } catch (error) {
    console.error('Erro em autoPostN8NHomeOffice:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao processar requisição'
    }, { status: 500 });
  }
});

// Função auxiliar: Limpar texto
function limparTexto(texto) {
  if (!texto) return '';
  return texto
    .replace(/\b(bom dia|boa tarde|boa noite|up|encaminhado|forward)\b/gi, '')
    .replace(/([\u{1F300}-\u{1F9FF}])\1{3,}/gu, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Função auxiliar: Extrair vagas com IA
async function extrairVagas(base44, texto) {
  try {
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em extrair informações de vagas de emprego HOME OFFICE / REMOTO.

TEXTO RECEBIDO:
${texto}

INSTRUÇÕES:
1. Identifique TODAS as vagas de emprego presentes no texto
2. Se houver múltiplas vagas, separe cada uma
3. Para cada vaga, extraia:
   - Título/cargo
   - Empresa (se mencionada)
   - Cidade e estado (se não especificado, deixe vazio)
   - Salário (se mencionado)
   - Tipo de contrato (CLT, PJ, Estágio, etc)
   - Categoria profissional
   - Descrição completa
   - Link de candidatura (se houver)
   - Email de contato (se houver)
   - Telefone de contato (se houver)
   - WhatsApp de contato (se houver)

4. Se não houver vaga válida, retorne array vazio

IMPORTANTE: Todas as vagas deste endpoint são Home Office/Remoto, não precisa classificar esse campo.`,
      response_json_schema: {
        type: 'object',
        properties: {
          vagas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                titulo: { type: 'string' },
                empresa: { type: 'string' },
                cidade: { type: 'string' },
                estado: { type: 'string' },
                salario: { type: 'string' },
                tipo_contrato: { type: 'string' },
                tipos_contratacao: { type: 'array', items: { type: 'string' } },
                categoria: { type: 'string' },
                funcao: { type: 'string' },
                descricao: { type: 'string' },
                informacoes_adicionais: { type: 'string' },
                link_candidatura: { type: 'string' },
                contact_email: { type: 'string' },
                contact_phone: { type: 'string' },
                contact_whatsapp: { type: 'string' },
                neighborhood: { type: 'string' },
                cep: { type: 'string' },
                numero: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return resultado?.vagas || [];
  } catch (error) {
    console.error('Erro ao extrair vagas home office com IA:', error);
    return [];
  }
}