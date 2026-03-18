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
  
  const prompt = `Você é um editor premium de notícias especializado em conteúdo para portais de emprego no Brasil.

TAREFA: Transformar o conteúdo abaixo em uma notícia COMPLETA, ROBUSTA e MUITO DIFERENTE do original, mantendo o foco mas agregando muito mais valor.

ESTRUTURA OBRIGATÓRIA (MÍNIMO 8-10 PARÁGRAFOS LONGOS):

1. **Título** (55-75 caracteres): Deve incluir 1-2 palavras-chave naturalmente (${keywordString}), ser impactante e transmitir urgência ou oportunidade

2. **Subtítulo** (130-170 caracteres): Hook poderoso que resume a essência da notícia e faz o leitor querer saber mais. Deve incluir números, estatísticas ou benefícios quando possível.

3. **Conteúdo** (MÍNIMO 2000-3000 caracteres, estruturado em 8-12 parágrafos):

   - **Parágrafo 1 (GANCHO IMPACTANTE)**: Comece com uma pergunta retórica, estatística surpreendente ou afirmação impactante. Deve conter 1-2 palavras-chave. Capture a atenção do leitor imediatamente.
   
   - **Parágrafo 2 (CONTEXTO GERAL)**: Desenvolva o contexto do assunto. Explique O QUÊ está acontecendo, onde está acontecendo (Paraíba/Brasil), e por que é importante AGORA. Adicione dados numéricos se disponível.
   
   - **Parágrafo 3 (DETALHE #1)**: Primeiro aspecto detalhado. Explique causas, razões ou motivações. Use exemplos práticos. Mantenha tom profissional mas acessível.
   
   - **Parágrafo 4 (DETALHE #2)**: Segundo aspecto importante. Pode ser: tendências, números específicos, declarações de especialistas imaginadas, ou implicações diretas. Adicione perspectiva profissional.
   
   - **Parágrafo 5 (DETALHE #3)**: Terceiro aspecto crucial. Aprofunde em análise. Diferencie-se do original com insights próprios, contextualizações relevantes para profissionais e candidatos.
   
   - **Parágrafo 6 (IMPACTO DIRETO NA CARREIRA)**: Como isso afeta PROFISSIONAIS NA PARAÍBA? Como afeta quem busca emprego? Quais habilidades ficam mais valorizadas? Que oportunidades surgem?
   
   - **Parágrafo 7 (IMPLICAÇÕES SETORIAIS)**: Qual é o impacto em empresas, setores ou mercado de trabalho local? Como as organizações estão respondendo? Cite setores específicos se relevante.
   
   - **Parágrafo 8 (AÇÃO E ORIENTAÇÃO)**: O que os candidatos/profissionais devem fazer? Que atitudes tomar? Como se preparar? Que habilidades desenvolver? Seja prático e acionável.
   
   - **Parágrafo 9 (PERSPECTIVA FUTURA)**: Para onde isso tende? Qual é o cenário esperado nos próximos meses/anos? Mantenha otimismo profissional mas realista.
   
   - **Parágrafo 10+ (CONCLUSÃO COM REFLEXÃO)**: Finalize com reflexão que conecte tudo. Reforce a importância. Termine com chamado à ação ou motivação para engajamento.

4. **CRITÉRIOS DE QUALIDADE OBRIGATÓRIOS**:
   - Conteúdo DEVE ser 60-80% DIFERENTE do original (reescreva, não copie)
   - Inclua NATURALMENTE as palavras-chave: ${keywordString}
   - Use subtítulos secundários com "##" para estruturar seções
   - Primeira frase do primeiro parágrafo DEVE conter palavra-chave principal
   - Adicione pelo menos 3-5 contextualizações que NÃO estavam no original
   - Mantenha tom profissional mas conversacional e engajante
   - Use números, estatísticas ou exemplos específicos quando necessário
   - Faça transições suaves entre parágrafos
   - Cada parágrafo deve ter 150-250 palavras

5. **DIFERENCIAÇÃO CRUCIAL**:
   - NÃO simplesmente resuma o original
   - EXPANDA com análises profundas, contexto local (Paraíba), e implicações práticas
   - ADICIONE valor: perspectivas que faltam, conexões com mercado de trabalho, insights profissionais
   - CRIE novo ângulo mesmo mantendo foco no tema original
   - Seja ORIGINAL na abordagem e explicações

6. **SEO INTEGRADO**:
   - Palavras-chave distribuídas naturalmente (não forçadas)
   - Densidade de keywords 1-2% (natural)
   - H2 headings para estrutura (use ## no markdown)
   - Texto descritivo e rico em contexto (bom para busca)

---

**CONTEÚDO ORIGINAL A SER TRANSFORMADO:**
${content}

---

**RETORNE OBRIGATORIAMENTE:**
Um JSON válido com APENAS estas propriedades (sem campos extras, sem markdown extra):
{
  "title": "string 55-75 caracteres",
  "subtitle": "string 130-170 caracteres",
  "content": "string com 8-12 parágrafos, 2000+ caracteres, muito diferente do original",
  "keywords": ["palavra1", "palavra2", ...],
  "internal_links": ["tópico1", "tópico2", ...]
}

**CRÍTICO**: Retorne APENAS JSON válido. Sem explicações, sem markdown extra, sem codeback. JSON puro.`;

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