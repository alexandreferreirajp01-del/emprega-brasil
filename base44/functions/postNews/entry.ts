import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

async function extractUrlContent(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  
  if (!response.ok) throw new Error(`URL retornou ${response.status}`);
  
  const html = await response.text();
  
  // Remove scripts, styles e elementos desnecessários
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  
  // Extrai qualquer coisa dentro de main, article ou divs com conteúdo
  const match = text.match(/<(main|article)[^>]*>([\s\S]+?)<\/\1>/i) ||
                text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]+?)<\/div>/i) ||
                text.match(/<body[^>]*>([\s\S]+?)<\/body>/i);
  
  if (match) {
    text = match[match.length - 1];
  }
  
  // Limpa HTML
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (text.length < 300) throw new Error('URL com conteúdo insuficiente');
  
  return text.substring(0, 15000);
}

async function extractFileContent(base44, fileUrl) {
  try {
    // Tenta extrair via ExtractDataFromUploadedFile
    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Todo o texto do arquivo' }
        }
      }
    });
    
    if (result.status === 'success' && result.output?.text && result.output.text.length > 300) {
      return result.output.text;
    }
  } catch (e) {
    // Continua para o fallback
  }
  
  // Fallback: usa IA para ler o arquivo
  const content = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: 'Leia este arquivo completamente e transcreva TODO o conteúdo textual que conseguir:',
    file_urls: [fileUrl]
  });
  
  if (!content || content.length < 300) {
    throw new Error('Arquivo sem conteúdo textual suficiente');
  }
  
  return content;
}

async function generateNewsWithAI(base44, content, category) {
  const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Você é um redator de notícias. Com base no texto abaixo, crie uma notícia estruturada.

IMPORTANTE:
- Título: máximo 80 caracteres, atrativo
- Subtítulo: máximo 150 caracteres, resumo da notícia
- Corpo: mínimo 800 caracteres, bem estruturado em parágrafos
- Escreva em português brasileiro
- Tone: profissional e informativo

TEXTO:
${content}

Retorne APENAS JSON válido, nada mais.`,
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', maxLength: 80 },
        subtitle: { type: 'string', maxLength: 150 },
        body: { type: 'string', minLength: 800 }
      },
      required: ['title', 'subtitle', 'body']
    }
  });
  
  return {
    title: response.title || 'Notícia sem título',
    subtitle: response.subtitle || 'Notícia',
    body: response.body || ''
  };
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
  const { source, type, category = 'Geral', imageUrl = null } = body;
  
  if (!source || !type) {
    return Response.json({ 
      error: 'Parâmetros obrigatórios: source (URL/file), type (url/file), category (opcional)' 
    }, { status: 400 });
  }

  try {
    console.log(`[postNews] Iniciando: type=${type}, source=${source}`);
    
    // Extrai conteúdo baseado no tipo
    let content;
    if (type === 'url') {
      content = await extractUrlContent(source);
    } else if (type === 'file') {
      content = await extractFileContent(base44, source);
    } else {
      return Response.json({ error: 'type deve ser url ou file' }, { status: 400 });
    }
    
    console.log(`[postNews] Conteúdo extraído: ${content.length} caracteres`);
    
    // Gera notícia com IA
    const newsData = await generateNewsWithAI(base44, content, category);
    
    console.log(`[postNews] Notícia gerada: ${newsData.title}`);
    
    // Cria blocos de conteúdo
    const blocks = [
      {
        type: 'content',
        content: newsData.body,
        order: 0
      }
    ];
    
    // Adiciona imagem se fornecida
    if (imageUrl) {
      blocks.unshift({
        type: 'image',
        image_url: imageUrl,
        order: -1
      });
    }
    
    // Salva notícia no banco
    const news = await base44.asServiceRole.entities.News.create({
      title: newsData.title,
      subtitle: newsData.subtitle,
      category: category || 'Geral',
      author_name: user.full_name || 'Admin',
      blocks: blocks,
      status: 'published',
      is_featured: false,
      views_count: 0
    });
    
    console.log(`[postNews] Notícia salva: ${news.id}`);
    
    return Response.json({
      success: true,
      newsId: news.id,
      title: newsData.title,
      subtitle: newsData.subtitle,
      message: 'Notícia publicada com sucesso'
    });
    
  } catch (err) {
    console.error(`[postNews] ERRO: ${err.message}`);
    return Response.json({ 
      error: err.message || 'Erro ao processar notícia' 
    }, { status: 500 });
  }
});