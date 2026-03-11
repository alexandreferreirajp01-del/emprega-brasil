import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PROMPT_SISTEMA = `Você é um especialista em processamento de vagas de emprego. Sua responsabilidade é transformar anúncios brutos em conteúdos estruturados e profissionais.

REGRAS ABSOLUTAS - NUNCA INVENTE:
- Nunca inventar: salário, benefícios, empresa, endereço, cidade, email, telefone, vagas, horário, regime, requisitos
- Se não estiver no anúncio: marcar como "não informado"
- Manter fidelidade 100% ao anúncio original

REGRAS DE COMPLEMENTAÇÃO - APENAS CONTEXTO GENÉRICO:
- Pode complementar apenas com contexto geral da profissão
- Usar linguagem segura: "A função normalmente envolve...", "Entre as atividades comuns..."
- Nunca apresentar como exigência da empresa
- Ser breve e relevante

PIPELINE DE PROCESSAMENTO:

1. NORMALIZAÇÃO: limpar emojis, espaços duplicados, caracteres quebrados, erros OCR
2. EXTRAÇÃO: identificar título, empresa, cidade, estado, modalidade, tipo de contratação, salário, benefícios, requisitos, atividades, horário, contato, prazo, fonte
3. CLASSIFICAÇÃO: cargo padronizado, área profissional, nível (estágio/aprendiz/auxiliar/assistente/analista/técnico/supervisor/gerente/especialista), tags
4. ENRIQUECIMENTO: resumo da função, atividades comuns do cargo, competências profissionais comuns
5. GERAÇÃO: post final com estrutura clara

CONFIANÇA: atribuir 0-100 baseado na clareza do texto. Baixa quando: texto incompleto, OCR ruim, qualidade baixa, informações confusas.

Retornar SEMPRE em JSON válido, seguindo exatamente esta estrutura:

{
  "vaga_extraida": {
    "titulo": "string ou 'não informado'",
    "empresa": "string ou 'não informado'",
    "cidade": "string ou 'não informado'",
    "estado": "string ou 'não informado'",
    "modalidade": "presencial/remoto/híbrido ou 'não informado'",
    "tipo_contratacao": "CLT/PJ/estágio/temporário/freelancer ou 'não informado'",
    "salario": "string (faixa ou valor) ou 'não informado'",
    "beneficios": ["array de strings ou vazio"],
    "requisitos": ["array de strings ou vazio"],
    "atividades_informadas": ["array de strings ou vazio"],
    "horario": "string ou 'não informado'",
    "contato": {"email": "", "telefone": "", "whatsapp": "", "outro": ""} ou null,
    "prazo": "string ou 'não informado'",
    "fonte_original": "string descrevendo origem do anúncio"
  },
  "classificacao_ia": {
    "cargo_padronizado": "string",
    "area_profissional": "string",
    "nivel": "estágio/jovem aprendiz/auxiliar/assistente/analista/técnico/supervisor/gerente/especialista/outro",
    "tags": ["array de tags relevantes"]
  },
  "enriquecimento_ia": {
    "resumo_da_funcao": "1-2 parágrafos sobre a função de forma genérica e profissional",
    "atividades_comuns_do_cargo": ["array com 4-6 atividades típicas da profissão"],
    "competencias_comuns": ["array com 5-8 competências profissionais comuns"]
  },
  "descricao_final_com_enriquecimento": "descrição completa da vaga + enriquecimento integrado de forma natural",
  "post_final": {
    "titulo_publicacao": "título atrativo para publicação",
    "descricao_publicacao": "texto completo, bem estruturado, pronto para publicar",
    "cta": "Para mais vagas acesse o aplicativo e o site."
  },
  "controle_processamento": {
    "confianca_extracao": 0-100,
    "campos_nao_identificados": ["array com campos que não conseguimos extrair"],
    "observacoes": "observações sobre a qualidade do processamento ou pontos importantes"
  }
}`;

async function extrairMultiplasVagas(textoCompleto) {
  const base44 = createClientFromRequest(event);
  const user = await base44.auth.me();

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Usuário não autenticado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const isAdmin = user.role === 'admin' || user.subscription_type === 'admin' || user.email === 'alexandreferreirajp01@gmail.com';
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Acesso restrito a administradores' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resultado = await base44.integrations.Core.InvokeLLM({
    prompt: `${PROMPT_SISTEMA}

ANÚNCIO(S) RECEBIDO(S):

${textoCompleto}

INSTRUÇÕES FINAIS:
- Se forem MÚLTIPLAS vagas, retornar um array JSON: [{ vaga_extraida: {...}, classificacao_ia: {...}, ... }, { ... }]
- Se for UMA ÚNICA vaga, retornar um objeto JSON único
- Validar JSON antes de retornar
- Manter RIGOROSAMENTE as regras de "nunca inventar"
- Ser específico, profissional e confiável`,
    model: 'gpt_5',
  });

  let vagasProcessadas;
  try {
    vagasProcessadas = typeof resultado === 'string' ? JSON.parse(resultado) : resultado;

    if (!Array.isArray(vagasProcessadas)) {
      vagasProcessadas = [vagasProcessadas];
    }
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: 'Erro ao processar resposta da IA',
        detalhes: e.message,
        resposta_bruta: resultado
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Gerar descrição final enriquecida para cada vaga
  const vagasComEnriquecimento = vagasProcessadas.map(vaga => {
    let descricaoFinal = vaga.post_final?.descricao_publicacao || '';

    const resumo = vaga.enriquecimento_ia?.resumo_da_funcao;
    const atividades = vaga.enriquecimento_ia?.atividades_comuns_do_cargo;
    const competencias = vaga.enriquecimento_ia?.competencias_comuns;

    if (resumo) {
      descricaoFinal = `${resumo}\n\n${descricaoFinal}`;
    }
    if (atividades?.length > 0) {
      descricaoFinal += `\n\nAtividades comuns dessa área:\n${atividades.map(a => `- ${a}`).join('\n')}`;
    }
    if (competencias?.length > 0) {
      descricaoFinal += `\n\nCompetências profissionais comuns:\n${competencias.map(c => `- ${c}`).join('\n')}`;
    }

    return {
      ...vaga,
      descricao_final_com_enriquecimento: descricaoFinal
    };
  });

  return new Response(
    JSON.stringify({
      sucesso: true,
      total_processadas: vagasComEnriquecimento.length,
      vagas: vagasComEnriquecimento
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido. Use POST' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'JSON inválido no corpo da requisição' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { texto, imagens_urls, arquivo_url } = payload;

  if (!texto && !imagens_urls?.length && !arquivo_url) {
    return new Response(
      JSON.stringify({ 
        error: 'Forneça: texto, imagens_urls (array) ou arquivo_url',
        exemplo: {
          texto: "Vaga de desenvolvedor...",
          imagens_urls: ["https://..."],
          arquivo_url: "https://...arquivo.pdf"
        }
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const base44 = createClientFromRequest(request);

  try {
    const user = await base44.auth.me();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = user.role === 'admin' || user.subscription_type === 'admin' || user.email === 'alexandreferreirajp01@gmail.com';
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso restrito a administradores' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileUrls = [];
    if (imagens_urls?.length) fileUrls.push(...imagens_urls);
    if (arquivo_url) fileUrls.push(arquivo_url);

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `${PROMPT_SISTEMA}

CONTEÚDO A PROCESSAR:

${texto || 'Nenhum texto fornecido. Extrair conteúdo das imagens/arquivos anexados.'}

INSTRUÇÕES FINAIS:
- Se forem MÚLTIPLAS vagas, retornar um array JSON válido
- Se for UMA ÚNICA vaga, retornar um objeto JSON único
- Validar JSON antes de retornar
- Manter RIGOROSAMENTE as regras de "nunca inventar"
- Ser específico, profissional e confiável
- Máximo 50 vagas por requisição
- Processar cada vaga de forma isolada, sem misturar informações`,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      model: 'gpt_5',
    });

    let vagasProcessadas;
    try {
      vagasProcessadas = typeof resultado === 'string' ? JSON.parse(resultado) : resultado;

      if (!Array.isArray(vagasProcessadas)) {
        vagasProcessadas = [vagasProcessadas];
      }

      if (vagasProcessadas.length > 50) {
        return new Response(
          JSON.stringify({
            error: 'Limite de 50 vagas por requisição excedido',
            total_recebido: vagasProcessadas.length
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar resposta da IA',
          detalhes: e.message,
          resposta_bruta: resultado
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gerar descrição final enriquecida para cada vaga
    const vagasComEnriquecimento = vagasProcessadas.map(vaga => {
      let descricaoFinal = vaga.post_final?.descricao_publicacao || '';
      
      const resumo = vaga.enriquecimento_ia?.resumo_da_funcao;
      const atividades = vaga.enriquecimento_ia?.atividades_comuns_do_cargo;
      const competencias = vaga.enriquecimento_ia?.competencias_comuns;
      
      if (resumo) {
        descricaoFinal = `${resumo}\n\n${descricaoFinal}`;
      }
      if (atividades?.length > 0) {
        descricaoFinal += `\n\nAtividades comuns dessa área:\n${atividades.map(a => `- ${a}`).join('\n')}`;
      }
      if (competencias?.length > 0) {
        descricaoFinal += `\n\nCompetências profissionais comuns:\n${competencias.map(c => `- ${c}`).join('\n')}`;
      }
      
      return {
        ...vaga,
        descricao_final_com_enriquecimento: descricaoFinal
      };
    });

    return new Response(
      JSON.stringify({
        sucesso: true,
        total_processadas: vagasComEnriquecimento.length,
        vagas: vagasComEnriquecimento,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erro ao processar vagas:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao processar vagas',
        detalhes: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});