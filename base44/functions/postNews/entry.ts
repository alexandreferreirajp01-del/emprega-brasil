import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { url, category = 'Geral', imageUrl } = body;

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch content from URL
    let content = '';
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (response.ok) {
        content = await response.text();
        // Simple text extraction
        content = content
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2000);
      }
    } catch (e) {
      content = `URL: ${url}`;
    }

    if (!content || content.length < 50) {
      return Response.json({ error: 'Could not extract sufficient content from URL' }, { status: 400 });
    }

    // Use LLM to generate title, subtitle and summary
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this content and generate a news article in Portuguese (Brazil). Return ONLY valid JSON:
{
  "title": "Catchy headline (max 80 chars)",
  "subtitle": "Brief summary (max 150 chars)",
  "summary": "2-3 paragraph article (max 500 chars)"
}

Content: ${content}`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          summary: { type: 'string' }
        }
      }
    });

    const { title, subtitle, summary } = llmResponse;

    // Create news blocks
    const blocks = [
      { type: 'content', content: summary, order: 0 }
    ];

    if (imageUrl) {
      blocks.push({ type: 'image', image_url: imageUrl, order: 1 });
    }

    // Save to database
    const news = await base44.asServiceRole.entities.News.create({
      title,
      subtitle,
      category,
      author_name: 'Sistema IA',
      blocks,
      is_featured: false,
      status: 'published'
    });

    return Response.json({
      success: true,
      newsId: news.id,
      title,
      subtitle
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Erro ao processar notícia'
    }, { status: 500 });
  }
});