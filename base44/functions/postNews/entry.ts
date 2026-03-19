import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { url, category = 'Geral', imageUrl, publishImmediately = true } = body;

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch content from URL with improved scraping
    let content = '';
    try {
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        let html = await response.text();
        
        // Remove scripts, styles and unnecessary content
        html = html.replace(/<script[^>]*>.*?<\/script>/gs, '')
          .replace(/<style[^>]*>.*?<\/style>/gs, '')
          .replace(/<nav[^>]*>.*?<\/nav>/gs, '')
          .replace(/<footer[^>]*>.*?<\/footer>/gs, '')
          .replace(/<header[^>]*>.*?<\/header>/gs, '');
        
        content = html
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2500);
      }
    } catch (e) {
      return Response.json({ error: 'Failed to extract content: ' + e.message }, { status: 400 });
    }

    if (!content || content.length < 100) {
      return Response.json({ error: 'Insufficient content extracted (min 100 chars)' }, { status: 400 });
    }

    // Use LLM to generate comprehensive article with SEO
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional, original news article in Portuguese (Brazil). 
Return ONLY valid JSON with NO markdown or extra text:
{
  "title": "SEO-optimized headline (60-80 chars, catchy)",
  "subtitle": "Engaging summary (100-150 chars)",
  "summary": "Main article (400-600 words, 2-3 paragraphs, original content, scannable with bold highlights)",
  "keywords": "5-7 comma-separated SEO keywords",
  "metaDescription": "SEO meta description (150-160 chars)"
}

Content to process:
${content}`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          summary: { type: 'string' },
          keywords: { type: 'string' },
          metaDescription: { type: 'string' }
        }
      }
    });

    const { title, subtitle, summary, keywords = '', metaDescription = '' } = llmResponse;

    // Create news blocks with improved structure
    const blocks = [
      { type: 'content', content: summary, order: 0 }
    ];

    if (imageUrl) {
      blocks.push({ type: 'image', image_url: imageUrl, order: 1 });
    }

    // Store SEO metadata
    const seoData = JSON.stringify({
      keywords,
      metaDescription,
      sourceUrl: url,
      generatedAt: new Date().toISOString()
    });

    // Save to database
    const news = await base44.asServiceRole.entities.News.create({
      title,
      subtitle,
      category,
      author_name: user.full_name || 'Sistema IA',
      blocks,
      is_featured: false,
      status: publishImmediately ? 'published' : 'draft',
      external_link: url,
      additional_info: seoData
    });

    return Response.json({
      success: true,
      newsId: news.id,
      title,
      subtitle,
      keywords,
      metaDescription
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Error processing news'
    }, { status: 500 });
  }
});