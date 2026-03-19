import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse request body
    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // Buscar todas as categorias
    const categories = await base44.asServiceRole.entities.ProfessionalCategory.list('category_order', 100);

    if (!categories || categories.length === 0) {
      return Response.json({ 
        error: 'No categories found in database',
        suggestion: 'Please populate categories first using /populateProfessionalCategories'
      }, { status: 404 });
    }

    // Preparar texto para análise
    const textToAnalyze = `${title} ${description || ''}`.toLowerCase();

    // Construir lista de categorias para o LLM
    const categoriesInfo = categories.map(cat => {
      return `Categoria: ${cat.category_name}\nCargos: ${cat.job_titles?.join(', ')}\nPalavras-chave: ${cat.keywords?.join(', ')}`;
    }).join('\n\n');

    // Usar LLM para classificar
    const prompt = `Você é um especialista em classificação de vagas de emprego.

Analise o seguinte texto de vaga:
Título: ${title}
Descrição: ${description || 'Não informada'}

E identifique qual categoria profissional melhor se encaixa, baseado nas seguintes categorias disponíveis:

${categoriesInfo}

Responda APENAS com o nome exato da categoria que melhor corresponde à vaga.
Se não houver correspondência clara, escolha "Outros" ou a categoria mais próxima.
Responda apenas o nome da categoria, nada mais.`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
    });

    // Encontrar a categoria correspondente
    const suggestedCategory = categories.find(cat => 
      llmResult.toLowerCase().includes(cat.category_name.toLowerCase())
    );

    if (!suggestedCategory) {
      // Fallback: buscar manualmente por palavras-chave
      let bestMatch = null;
      let maxScore = 0;

      for (const category of categories) {
        let score = 0;
        
        // Verificar job_titles
        for (const jobTitle of (category.job_titles || [])) {
          if (textToAnalyze.includes(jobTitle.toLowerCase())) {
            score += 10;
          }
        }

        // Verificar keywords
        for (const keyword of (category.keywords || [])) {
          if (textToAnalyze.includes(keyword.toLowerCase())) {
            score += 5;
          }
        }

        if (score > maxScore) {
          maxScore = score;
          bestMatch = category;
        }
      }

      if (bestMatch) {
        return Response.json({
          success: true,
          category: bestMatch.category_name,
          category_id: bestMatch.id,
          method: 'keyword_matching',
          confidence: maxScore > 15 ? 'high' : maxScore > 5 ? 'medium' : 'low'
        });
      }

      return Response.json({
        success: false,
        message: 'Could not classify job',
        llm_response: llmResult
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      category: suggestedCategory.category_name,
      category_id: suggestedCategory.id,
      job_function: suggestedCategory.job_titles?.[0] || '',
      method: 'llm_classification',
      confidence: 'high'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});