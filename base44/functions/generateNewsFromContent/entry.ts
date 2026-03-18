import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const SEO_KEYWORDS = {
  'Mercado de Trabalho': ['emprego', 'carreira', 'profissional', 'oportunidade', 'seleção'],
  'Dicas de Emprego': ['dica', 'carreira', 'entrevista', 'currículo', 'profissional'],
  'Economia': ['economia', 'mercado', 'negócio', 'financeiro', 'investimento'],
  'Cursos': ['curso', 'treinamento', 'qualificação', 'aprendizado', 'certificação'],
  'Eventos': ['evento', 'seminário', 'conferência', 'workshop', 'encontro'],
  'Geral': ['notícia', 'atualização', 'informação', 'destaque', 'notável']
};

async function extractContentFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    // Remove scripts, styles
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned.substring(0, 8000);
  } catch (err) {
    throw new Error(`Erro ao extrair URL: ${err.message}`);
  }
}

async function extractContentFromFile(base44, fileUrl) {
  try {
    // Detectar tipo de arquivo
    const ext = fileUrl.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      // Para imagens, usar OCR via IA
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'Leia o texto e conteúdo visível nesta imagem e transcreva tudo que conseguir ver com precisão.',
        file_urls: [fileUrl]
      });
      return result || 'Imagem não contém texto legível';
    }
    
    if (ext === 'pdf' || ext === 'docx') {
      // Para PDF e DOCX, usar ExtractDataFromUploadedFile
      const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Todo o texto e conteúdo do arquivo' }
          }
        }
      });
      
      if (result.status === 'success' && result.output?.content) {
        return result.output.content;
      }
      throw new Error('Erro ao extrair arquivo');
    }
    
    throw new Error(`Tipo de arquivo não suportado: ${ext}`);
  } catch (err) {
    throw new Error(`Erro ao extrair arquivo: ${err.message}`);
  }
}

async function generateNewsWithAI(base44, content, category) {
  const seoKeywords = SEO_KEYWORDS[category] || SEO_KEYWORDS['Geral'];
  const keywordString = seoKeywords.join(', ');
  
  const prompt = `Você é um editor de notícias especializado em SEO e conteúdo para aplicativos de emprego.

Leia o conteúdo abaixo e crie uma notícia profissional otimizada para SEO com as seguintes características:

1. **Título** (60-70 caracteres): Deve ser chamativo, conter 1-2 palavras-chave (${keywordString}) e transmitir urgência/relevância
2. **Subtítulo** (120-160 caracteres): Resumo impactante que complementa o título, contendo contexto importante
3. **Conteúdo** (5-7 parágrafos estruturados):
   - Parágrafo 1: Introdução com gancho - comece com estatística, pergunta ou fato relevante
   - Parágrafos 2-4: Desenvolvimento detalhado - explique o conceito principal, adicione contextualizações profissionais e insights
   - Parágrafo 5: Implicações/Oportunidades - mostre como isso afeta profissionais na Paraíba/Brasil
   - Parágrafo 6: Chamado à ação - encoraje leitura completa ou engajamento
   - Parágrafo 7: Conclusão com reflexão final

4. **Critérios SEO obrigatórios**:
   - Incluir naturalmente as palavras-chave: ${keywordString}
   - H2/H3 headings: Use subtítulos formatados com "## Título" para estrutura
   - Primeira frase do primeiro parágrafo deve conter palavra-chave principal
   - Meta description (será copiada do subtítulo)
   - 5-7 relacionadas: [relacionada1, relacionada2, ...]

5. **Tom e estilo**:
   - Profissional mas acessível
   - Direto e bem estruturado
   - Sem jargão excessivo
   - Diferenciado do original - reescreva com suas próprias palavras e adicione valor

6. **Conteúdo diferenciado**:
   - Expanda ideias principais com contexto adicional
   - Cite implicações práticas para quem busca emprego
   - Adicione perspectivas profissionais que não estavam no original
   - Mantenha foco no tema mas crie novo ângulo de abordagem

**Conteúdo original a ser processado:**
${content}

**Importante**: Retorne APENAS um JSON válido, sem markdown, sem explicações adicionais.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 10, maxLength: 70 },
        subtitle: { type: 'string', minLength: 20, maxLength: 160 },
        content: { type: 'string', minLength: 500 },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 7
        },
        internal_links: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tópicos relacionados para links internos'
        }
      }
    }
  });

  if (!result || !result.title) {
    throw new Error('Falha ao gerar conteúdo com IA');
  }

  return result;
}

function formatContentAsBlocks(content) {
  // Dividir o conteúdo em parágrafos e criar blocos
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((para, index) => ({
    id: Date.now() + index,
    type: 'content',
    content: para.trim(),
    order: index
  }));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Apenas POST' }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || (user.role !== 'admin' && user.email !== 'alexandreferreirajp01@gmail.com')) {
    return Response.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  const body = await req.json();
  const { source, sourceType, category = 'Geral' } = body;
  // sourceType: 'url' | 'file'
  // source: URL ou file_url

  if (!source || !sourceType) {
    return Response.json({ error: 'source e sourceType obrigatórios' }, { status: 400 });
  }

  let content = '';
  let extractionError = null;

  try {
    console.log(`[generateNewsFromContent] Iniciando extração: ${sourceType} = ${source}`);
    
    if (sourceType === 'url') {
      content = await extractContentFromUrl(source);
    } else if (sourceType === 'file') {
      content = await extractContentFromFile(base44, source);
    } else {
      return Response.json({ error: 'sourceType inválido' }, { status: 400 });
    }

    if (!content || content.length < 100) {
      return Response.json({ error: 'Conteúdo insuficiente extraído' }, { status: 400 });
    }

    console.log(`[generateNewsFromContent] Conteúdo extraído: ${content.length} caracteres`);

    // Gerar notícia com IA
    console.log(`[generateNewsFromContent] Gerando conteúdo com IA...`);
    const newsData = await generateNewsWithAI(base44, content, category);

    // Formatar blocos
    const blocks = formatContentAsBlocks(newsData.content);

    // Salvar no banco
    console.log(`[generateNewsFromContent] Salvando notícia...`);
    const news = await base44.asServiceRole.entities.News.create({
      title: newsData.title,
      subtitle: newsData.subtitle,
      category,
      author_name: 'NewsIA',
      blocks,
      status: 'published',
      is_featured: false,
      views_count: 0,
      blocks: blocks.map(b => ({ ...b, type: 'content' }))
    });

    console.log(`[generateNewsFromContent] Notícia criada: ${news.id}`);

    return Response.json({
      success: true,
      newsId: news.id,
      title: newsData.title,
      subtitle: newsData.subtitle,
      keywords: newsData.keywords,
      internalLinks: newsData.internal_links
    });

  } catch (err) {
    console.error('[generateNewsFromContent] ERRO:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});