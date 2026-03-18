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

    // Extract content from URL
    if (sourceType === 'url') {
      try {
        const response = await fetch(source, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        let html = await response.text();
        
        // Remove scripts and styles
        html = html.replace(/<script[^>]*>.*?<\/script>/gs, '')
          .replace(/<style[^>]*>.*?<\/style>/gs, '')
          .replace(/<nav[^>]*>.*?<\/nav>/gs, '')
          .replace(/<footer[^>]*>.*?<\/footer>/gs, '');
        
        extractedContent = html
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2000);
      } catch (e) {
        throw new Error(`Failed to fetch URL: ${e.message}`);
      }
    } else if (sourceType === 'file') {
      extractedContent = source;
    }

    if (!extractedContent || extractedContent.length < 80) {
      throw new Error('Content too short (min 80 chars)');
    }

    // Use LLM with timeout protection
    let llmResponse;
    try {
      llmResponse = await Promise.race([
        base44.integrations.Core.InvokeLLM({
          prompt: `Generate a news article in Portuguese (Brazil). Return ONLY valid JSON:
{
  "title": "Title (60-80 chars)",
  "subtitle": "Summary (100-150 chars)",
  "keywords": "5-7 keywords",
  "metaDescription": "Meta (150-160 chars)",
  "content": "Article (400-600 words)"
}

Content: ${extractedContent}`,
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              subtitle: { type: 'string' },
              keywords: { type: 'string' },
              metaDescription: { type: 'string' },
              content: { type: 'string' }
            }
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), 29000))
      ]);
    } catch (e) {
      throw new Error(`LLM error: ${e.message}`);
    }

    if (!llmResponse || !llmResponse.title) {
      throw new Error('Invalid LLM response');
    }

    const { title, subtitle, keywords = '', metaDescription = '', content } = llmResponse;

    const blocks = [
      { type: 'content', content: content || subtitle, order: 0 }
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