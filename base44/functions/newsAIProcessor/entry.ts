import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { source, sourceType = 'url', category = 'Geral', publishImmediately = false } = body;

    if (!source) {
      return Response.json({ error: 'Source is required' }, { status: 400 });
    }

    let extractedContent = '';

    // Extract content from URL or file
    if (sourceType === 'url') {
      try {
        const response = await fetch(source, { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        let html = await response.text();
        
        // More aggressive content extraction
        let mainContent = html
          .match(/<main[^>]*>.*?<\/main>/is)?.[0] ||
          html.match(/<article[^>]*>.*?<\/article>/is)?.[0] ||
          html;
        
        mainContent = mainContent
          .replace(/<script[^>]*>.*?<\/script>/gs, '')
          .replace(/<style[^>]*>.*?<\/style>/gs, '')
          .replace(/<nav[^>]*>.*?<\/nav>/gs, '')
          .replace(/<footer[^>]*>.*?<\/footer>/gs, '')
          .replace(/<header[^>]*>.*?<\/header>/gs, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();
        
        extractedContent = mainContent.substring(0, 2500);
      } catch (e) {
        throw new Error(`Erro ao acessar URL: ${e.message}`);
      }
    } else if (sourceType === 'file') {
      // Source is a file URL - fetch and extract text
      try {
        const response = await fetch(source, {
          signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const text = await response.text();
        extractedContent = text.substring(0, 2500);
      } catch (e) {
        throw new Error(`Erro ao ler arquivo: ${e.message}`);
      }
    }

    if (!extractedContent || extractedContent.trim().length < 80) {
      throw new Error('Conteúdo insuficiente (mínimo 80 caracteres)');
    }

    // Use LLM with timeout protection
    let llmResponse;
    try {
      llmResponse = await Promise.race([
        base44.integrations.Core.InvokeLLM({
          prompt: `Você é um jornalista profissional. Gere uma notícia completa em português (Brasil).

IMPORTANTE: Retorne APENAS JSON válido, nada mais.

{
  "title": "Título catchy (60-80 caracteres)",
  "subtitle": "Subtítulo resumido (100-150 caracteres)",
  "content": "Artigo completo com 600-800 palavras. Deve incluir: introdução, desenvolvimento em 2-3 parágrafos, conclusão. Use linguagem jornalística profissional.",
  "keywords": "palavra1, palavra2, palavra3, palavra4, palavra5, palavra6, palavra7",
  "metaDescription": "Descrição SEO (150-160 caracteres)"
}

CONTEÚDO PARA PROCESSAR:
${extractedContent}`,
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              subtitle: { type: 'string' },
              content: { type: 'string' },
              keywords: { type: 'string' },
              metaDescription: { type: 'string' }
            },
            required: ['title', 'subtitle', 'content']
          },
          model: 'gpt_5'
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), 29000))
      ]);
    } catch (e) {
      throw new Error(`LLM error: ${e.message}`);
    }

    if (!llmResponse || !llmResponse.title || !llmResponse.content) {
      throw new Error('LLM não gerou conteúdo completo');
    }

    const { title, subtitle, keywords = '', metaDescription = '', content } = llmResponse;

    const blocks = [
      { type: 'content', content, order: 0 }
    ];

    const newsData = {
      title,
      subtitle,
      category,
      author_name: user.full_name || 'Sistema IA',
      blocks,
      is_featured: false,
      status: publishImmediately ? 'published' : 'draft',
      external_link: sourceType === 'url' ? source : null,
      additional_info: JSON.stringify({
        keywords,
        metaDescription,
        sourceUrl: source,
        generatedAt: new Date().toISOString()
      })
    };

    const news = await base44.asServiceRole.entities.News.create(newsData);

    return Response.json({
      success: true,
      newsId: news.id,
      title,
      subtitle,
      status: newsData.status
    });

  } catch (error) {
    console.error('NewsAI Error:', error.message);
    return Response.json({
      success: false,
      error: error.message || 'Error processing news'
    }, { status: 500 });
  }
});