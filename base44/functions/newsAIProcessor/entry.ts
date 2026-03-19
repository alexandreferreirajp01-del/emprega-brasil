import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { source, sourceType = 'text', category = 'Geral', publishImmediately = false } = body;

    if (!source) {
      return Response.json({ error: 'Source é obrigatório' }, { status: 400 });
    }

    let extractedContent = '';

    // Extract content based on source type
    if (sourceType === 'text') {
      // Direct text input - use as is
      extractedContent = source.trim();
    } else if (sourceType === 'url') {
      // Fetch from URL
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
        
        // Extract main content
        let mainContent = html
          .match(/<main[^>]*>.*?<\/main>/is)?.[0] ||
          html.match(/<article[^>]*>.*?<\/article>/is)?.[0] ||
          html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>.*?<\/div>/is)?.[0] ||
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
        
        extractedContent = mainContent.substring(0, 3000);
      } catch (e) {
        console.error('URL fetch error:', e);
        throw new Error(`Erro ao acessar URL: ${e.message}`);
      }
    } else if (sourceType === 'file') {
      // File URL from upload
      try {
        const response = await fetch(source, {
          signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        extractedContent = (await response.text()).substring(0, 3000);
      } catch (e) {
        console.error('File fetch error:', e);
        throw new Error(`Erro ao ler arquivo: ${e.message}`);
      }
    }

    if (!extractedContent || extractedContent.trim().length < 50) {
      throw new Error('Conteúdo insuficiente (mínimo 50 caracteres)');
    }

    console.log('Content extracted:', extractedContent.substring(0, 100) + '...');

    // Call LLM to generate news
    let llmResponse;
    try {
      llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um jornalista profissional. Leia o conteúdo abaixo e gere uma notícia original.

RETORNE APENAS JSON VÁLIDO, nada mais, nenhum markdown.

Exemplo de resposta esperada:
{
  "title": "Título atrativo com 60-80 caracteres",
  "subtitle": "Subtítulo resumido com 100-150 caracteres",
  "content": "Parágrafo 1... Parágrafo 2... Parágrafo 3...",
  "keywords": "palavra1, palavra2, palavra3, palavra4, palavra5",
  "metaDescription": "Descrição SEO com 150-160 caracteres"
}

CONTEÚDO A PROCESSAR:
${extractedContent}`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 10 },
            subtitle: { type: 'string', minLength: 10 },
            content: { type: 'string', minLength: 100 },
            keywords: { type: 'string' },
            metaDescription: { type: 'string' }
          },
          required: ['title', 'subtitle', 'content']
        },
        model: 'gpt_5'
      });
    } catch (e) {
      console.error('LLM error:', e);
      throw new Error(`Erro na geração: ${e.message}`);
    }

    console.log('LLM Response:', JSON.stringify(llmResponse).substring(0, 200));

    if (!llmResponse || !llmResponse.title) {
      throw new Error('LLM não retornou resposta válida');
    }

    const { title, subtitle, content, keywords = '', metaDescription = '' } = llmResponse;

    // Create news record
    const newsData = {
      title: title.substring(0, 200),
      subtitle: subtitle.substring(0, 300),
      category,
      author_name: user.full_name || 'Sistema IA',
      blocks: [
        { type: 'content', content: content.substring(0, 5000), order: 0 }
      ],
      is_featured: false,
      status: publishImmediately ? 'published' : 'draft',
      external_link: sourceType === 'url' ? source : null
    };

    const news = await base44.asServiceRole.entities.News.create(newsData);

    console.log('News created:', news.id);

    return Response.json({
      success: true,
      newsId: news.id,
      title,
      subtitle,
      status: newsData.status,
      message: publishImmediately ? 'Notícia publicada!' : 'Notícia salva como rascunho'
    });

  } catch (error) {
    console.error('Full error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Erro ao processar notícia'
    }, { status: 500 });
  }
});