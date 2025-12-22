import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação (pode ser token ou service role para N8N)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      origem = 'n8n',
      canal = 'whatsapp',
      grupo_id,
      grupo_nome,
      tipo_mensagem,
      mensagem_texto,
      imagem_url,
      data_recebimento,
      auto_publicar = false
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

    // Limpar e processar texto
    const textoLimpo = limparTexto(textoFinal);

    // Classificar e extrair vagas usando IA
    const vagasExtraidas = await extrairVagas(base44, textoLimpo);

    if (!vagasExtraidas || vagasExtraidas.length === 0) {
      return Response.json({ 
        success: true,
        message: 'Nenhuma vaga válida encontrada no conteúdo',
        vagas_criadas: 0
      });
    }

    // Criar vagas pendentes no sistema
    const vagasCriadas = [];
    
    for (const vaga of vagasExtraidas) {
      try {
        const vagaPendente = await base44.asServiceRole.entities.Job.create({
          title: vaga.titulo,
          company: vaga.empresa || 'Empresa não informada',
          city: vaga.cidade || '',
          state: vaga.estado || '',
          salary_range: vaga.salario || '',
          job_type: vaga.tipo_contrato || 'CLT',
          contract_types: vaga.tipos_contratacao || ['CLT'],
          category: vaga.categoria || 'Geral',
          job_function: vaga.funcao || '',
          description: vaga.descricao || textoLimpo,
          additional_info: vaga.informacoes_adicionais || '',
          application_link: vaga.link_candidatura || '',
          image_url: imagem_url || '',
          is_premium: false,
          is_featured: false,
          published_at: null, // NÃO PUBLICADA
          status: 'pending_ai', // Status especial para vagas da IA
          origin_source: 'auto_post_n8n',
          origin_channel: canal,
          origin_group_id: grupo_id || '',
          origin_group_name: grupo_nome || '',
          origin_date: data_recebimento || new Date().toISOString(),
          is_home_office: vaga.home_office || false
        });

        vagasCriadas.push(vagaPendente);
      } catch (error) {
        console.error('Erro ao criar vaga pendente:', error);
      }
    }

    return Response.json({
      success: true,
      message: `${vagasCriadas.length} vaga(s) criada(s) com sucesso`,
      vagas_criadas: vagasCriadas.length,
      vagas_pendentes: vagasCriadas.map(v => ({
        id: v.id,
        titulo: v.title,
        empresa: v.company,
        cidade: v.city,
        estado: v.state,
        home_office: v.is_home_office
      }))
    });

  } catch (error) {
    console.error('Erro em autoPostN8N:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao processar requisição'
    }, { status: 500 });
  }
});

// Função auxiliar: Limpar texto
function limparTexto(texto) {
  if (!texto) return '';
  
  let limpo = texto
    // Remover mensagens comuns de grupo
    .replace(/\b(bom dia|boa tarde|boa noite|up|encaminhado|forward)\b/gi, '')
    // Remover excesso de emojis repetidos
    .replace(/([\u{1F300}-\u{1F9FF}])\1{3,}/gu, '$1')
    // Normalizar espaços
    .replace(/\s+/g, ' ')
    // Normalizar quebras de linha
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return limpo;
}

// Função auxiliar: Extrair vagas com IA
async function extrairVagas(base44, texto) {
  try {
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em extrair informações de vagas de emprego.

TEXTO RECEBIDO:
${texto}

INSTRUÇÕES:
1. Identifique TODAS as vagas de emprego presentes no texto
2. Se houver múltiplas vagas, separe cada uma
3. Para cada vaga, extraia:
   - Título/cargo
   - Empresa (se mencionada)
   - Cidade e estado
   - Salário (se mencionado)
   - Tipo de contrato (CLT, PJ, Estágio, etc)
   - Se é Home Office
   - Categoria profissional
   - Descrição completa
   - Link de candidatura (se houver)

4. Se não houver vaga válida, retorne array vazio

IMPORTANTE:
- Se a cidade não tiver o estado mencionado, tente inferir pelo contexto
- Se for Home Office, marque como true
- Se não tiver salário, deixe vazio
- Mantenha a descrição completa e formatada`,
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
                home_office: { type: 'boolean' }
              }
            }
          }
        }
      }
    });

    return resultado?.vagas || [];
  } catch (error) {
    console.error('Erro ao extrair vagas com IA:', error);
    return [];
  }
}