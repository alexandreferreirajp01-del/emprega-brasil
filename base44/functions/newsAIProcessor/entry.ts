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
    let sourceTitle = '';

    // Extract content from URL
    if (sourceType === 'url') {
      try {
        const response = await fetch(source, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          let html = await response.text();
          
          // Extract title from meta og:title or title tag
          const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          sourceTitle = ogTitleMatch?.[1] || titleMatch?.[1] || '';
          
          // Remove scripts, styles and unnecessary tags
          html = html.replace(/<script[^>]*>.*?<\/script>/gs, '')
            .replace(/<style[^>]*>.*?<\/style>/gs, '')
            .replace(/<nav[^>]*>.*?<\/nav>/gs, '')
            .replace(/<footer[^>]*>.*?<\/footer>/gs, '')
            .replace(/<header[^>]*>.*?<\/header>/gs, '');
          
          // Extract main content
          extractedContent = html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 3000);
        }
      } catch (e) {
        return Response.json({ error: 'Failed to extract content from URL: ' + e.message }, { status: 400 });
      }
    } else if (sourceType === 'file') {
      // For file uploads, assume content is already extracted
      extractedContent = source;
    }

    if (!extractedContent || extractedContent.length < 100) {
      return Response.json({ error: 'Insufficient content extracted' }, { status: 400 });
    }

    // Use LLM to generate comprehensive article
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this content and generate a professional news article in Portuguese (Brazil). 
Be original, avoid plagiarism. Return ONLY valid JSON with NO markdown:
{
  "title": "SEO-optimized title (60-80 chars, catchy)",
  "subtitle": "Brief engaging summary (100-150 chars)",
  "keywords": "5-7 comma-separated keywords for SEO",
  "metaDescription": "SEO meta description (150-160 chars)",
  "slug": "url-friendly-slug-format",
  "content": "Main article (800-1200 words, 3-4 paragraphs with H2 headers, scannable, original)",
  "summary": "Brief 2-3 line summary",
  "mainImageCaption": "Suggested image caption if any"
}

IMPORTANT:
- Original content, NOT copied
- Professional journalism style
- Include relevant data/statistics if present
- Structure with clear paragraphs
- AdSense-friendly (no explicit adult content, political extremism, or violence)
- SEO optimized with keyword density 1-2%

Source content:
${extractedContent}`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          keywords: { type: 'string' },
          metaDescription: { type: 'string' },
          slug: { type: 'string' },
          content: { type: 'string' },
          summary: { type: 'string' },
          mainImageCaption: { type: 'string' }
        }
      },
      model: 'gpt_5'
    });

    if (!llmResponse || !llmResponse.title) {
      throw new Error('Invalid LLM response');
    }

    const { title, subtitle, keywords, metaDescription, slug, content, summary, mainImageCaption } = llmResponse;

    // Create structured content blocks
    const blocks = [
      { 
        type: 'content', 
        content: content,
        order: 0 
      }
    ];

    // Save to database
    const newsData = {
      title,
      subtitle,
      category,
      author_name: user.full_name || 'Sistema IA',
      blocks,
      is_featured: false,
      status: publishImmediately ? 'published' : 'draft',
      external_link: sourceType === 'url' ? source : null
    };

    // Store SEO data in additional_info
    newsData.additional_info = JSON.stringify({
      keywords,
      metaDescription,
      slug,
      summary,
      mainImageCaption,
      sourceUrl: source,
      generatedAt: new Date().toISOString()
    });

    const news = await base44.asServiceRole.entities.News.create(newsData);

    // Send admin notification
    try {
      await base44.functions.invoke('notifyAdmins', {
        title: `Nova Notícia ${publishImmediately ? 'Publicada' : 'Rascunho'}`,
        message: `Notícia "${title}" foi ${publishImmediately ? 'publicada' : 'criada como rascunho'}.`,
        type: 'news'
      });
    } catch (e) {
      console.warn('Could not send notification:', e);
    }

    return Response.json({
      success: true,
      newsId: news.id,
      title,
      subtitle,
      status: newsData.status,
      seoData: { keywords, metaDescription, slug }
    });

  } catch (error) {
    console.error('NewsAI Error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Error processing news'
    }, { status: 500 });
  }
});