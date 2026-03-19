/**
 * ═══════════════════════════════════════════════════════════════
 * FUNÇÃO: receberVagaN8N
 * ═══════════════════════════════════════════════════════════════
 * 
 * OBJETIVO:
 * Receber vagas de emprego enviadas pelo N8N e salvá-las com
 * status "pending_review" para revisão manual pelo administrador.
 * NÃO gasta créditos de integração do Base44.
 * 
 * ───────────────────────────────────────────────────────────────
 * COMO CONECTAR NO N8N:
 * ───────────────────────────────────────────────────────────────
 * 
 * 1. No N8N, adicione um nó "HTTP Request"
 * 2. Configure assim:
 *    - Method: POST
 *    - URL: [URL da sua função] (encontre em Dashboard > Code > Functions > receberVagaN8N)
 *    - Headers:
 *        x-api-key: [valor do secret API_KEY_N8N_VagasPB]
 *        Content-Type: application/json
 *    - Body (JSON) com os campos abaixo
 * 
 * ───────────────────────────────────────────────────────────────
 * CAMPOS ACEITOS NO BODY (todos opcionais exceto "title"):
 * ───────────────────────────────────────────────────────────────
 * {
 *   "title": "Assistente Administrativo",       ← OBRIGATÓRIO
 *   "company": "Empresa XYZ",
 *   "city": "João Pessoa",
 *   "state": "PB",
 *   "job_type": "CLT",                          ← CLT, PJ, Estágio, etc.
 *   "work_mode": "Presencial",                  ← Presencial, Híbrido, Remoto
 *   "salary_range": "R$ 1.500,00",
 *   "description": "Texto completo da vaga...",
 *   "additional_info": "Requisitos e benefícios...",
 *   "contact_email": "rh@empresa.com",
 *   "contact_phone": "83999999999",
 *   "contact_whatsapp": "83999999999",
 *   "application_link": "https://empresa.com/vagas",
 *   "category": "Administrativo",
 *   "job_function": "Assistente",
 *   "is_featured": false,
 *   "origem": "n8n_automatico"                  ← opcional, para rastrear a origem
 * }
 * 
 * ───────────────────────────────────────────────────────────────
 * RESPOSTA DA FUNÇÃO:
 * ───────────────────────────────────────────────────────────────
 * 
 * Sucesso (201):
 * { "success": true, "job_id": "abc123", "message": "Vaga recebida e aguardando revisão" }
 * 
 * Erro autenticação (401):
 * { "error": "API key inválida" }
 * 
 * Erro dados (400):
 * { "error": "Campo 'title' é obrigatório" }
 * 
 * ───────────────────────────────────────────────────────────────
 * FLUXO SUGERIDO NO N8N:
 * ───────────────────────────────────────────────────────────────
 * 
 * [Trigger] → [Extrair dados da vaga] → [HTTP Request → receberVagaN8N]
 *                                             ↓
 *                             Vaga criada com status "pending_review"
 *                                             ↓
 *                         Admin acessa "Vagas N8N (Revisão)" no app
 *                                             ↓
 *                               Edita, aprova ou exclui a vaga
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // Permitir CORS para o N8N
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      }
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido. Use POST.' }, { status: 405 });
  }

  // ── Autenticação via API Key ─────────────────────────────────
  // A chave deve ser enviada no header "x-api-key"
  // O valor deve ser o mesmo do secret "API_KEY_N8N_VagasPB" configurado no app
  const apiKey = req.headers.get('x-api-key');
  const expectedKey = Deno.env.get('API_KEY_N8N_VagasPB');

  if (!apiKey || apiKey !== expectedKey) {
    return Response.json({ error: 'API key inválida ou ausente. Envie no header: x-api-key' }, { status: 401 });
  }

  // ── Ler body da requisição ───────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Body inválido. Envie JSON válido.' }, { status: 400 });
  }

  // ── Validação mínima ─────────────────────────────────────────
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return Response.json({ error: "Campo 'title' é obrigatório" }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  // ── Verificação de duplicata ANTECIPADA (antes de qualquer IA) ──
  // Normaliza título+empresa+descrição para fingerprint robusto
  const norm = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const tituloNovo = norm(body.title);
  const empresaNova = norm(body.company || '');
  // Fingerprint baseado nos primeiros 100 chars da descrição tbm
  const descFingerprint = norm(body.description || '').substring(0, 100);

  // Janela de 6h para pegar duplicatas (N8N pode reenviar até horas depois)
  const seisHorasAtras = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  try {
    const vagasRecentes = await base44.asServiceRole.entities.Job.filter({
      created_date: { $gte: seisHorasAtras }
    });

    const duplicata = vagasRecentes.find(v => {
      const tituloIgual = norm(v.title) === tituloNovo;
      const empresaIgual = empresaNova === '' || norm(v.company || '') === empresaNova;
      // Se título E empresa batem, é duplicata. Ou se título + início da descrição batem.
      const descIgual = descFingerprint.length > 30 && norm(v.description || '').substring(0, 100) === descFingerprint;
      return tituloIgual && empresaIgual || (tituloIgual && descIgual);
    });

    if (duplicata) {
      console.log(`Duplicata detectada: "${body.title}" — id existente: ${duplicata.id}`);
      return Response.json({
        success: true,
        job_id: duplicata.id,
        message: 'Vaga duplicada ignorada. Já existe uma vaga similar nas últimas 6h.',
        duplicate: true,
      }, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
  } catch (e) {
    console.warn('Erro ao verificar duplicatas:', e.message);
  }

  // ── Salvar IMEDIATAMENTE como rascunho (anti race-condition) ──
  // Isso garante que requisições paralelas do mesmo envio não criem duplicatas
  // enquanto a IA processa
  let jobRascunho;
  try {
    jobRascunho = await base44.asServiceRole.entities.Job.create({
      title: body.title.trim(),
      company: body.company || '',
      city: body.city || '',
      state: body.state || 'PB',
      description: body.description || '',
      status: 'draft', // rascunho temporário para travar o slot
      origem: body.origem || 'n8n_automatico',
      needs_review: true,
    });
  } catch (e) {
    console.error('Erro ao criar rascunho:', e.message);
    return Response.json({ error: 'Erro interno ao salvar vaga' }, { status: 500 });
  }

  // ── Processar com pipeline IA avançado ──────────────────────

  // Montar prompt do pipeline avançado
  const vagaTexto = `
Título: ${body.title}
${body.company ? `Empresa: ${body.company}` : ''}
${body.city ? `Cidade: ${body.city}` : ''}
${body.state ? `Estado: ${body.state}` : ''}
${body.description ? `Descrição: ${body.description}` : ''}
${body.additional_info ? `Informações adicionais: ${body.additional_info}` : ''}
${body.salary_range ? `Salário: ${body.salary_range}` : ''}
${body.job_type ? `Tipo: ${body.job_type}` : ''}
${body.work_mode ? `Modalidade: ${body.work_mode}` : ''}
${body.contact_email ? `Email: ${body.contact_email}` : ''}
${body.contact_phone ? `Telefone: ${body.contact_phone}` : ''}
${body.contact_whatsapp ? `WhatsApp: ${body.contact_whatsapp}` : ''}
${body.application_link ? `Link: ${body.application_link}` : ''}
  `;

  // ── Função auxiliar: extrair contatos com regex ──────────────────────
  const extractContactsWithRegex = (text) => {
    if (!text) return { email: '', telefone: '', whatsapp: '', site: '' };

    // Email: padrão comum
    const emailMatch = text.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : '';

    // Telefone/WhatsApp: (XX) 9XXXX-XXXX ou XX 99999-9999 ou similares
    const phoneMatch = text.match(/(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/);
    const telefone = phoneMatch ? phoneMatch[0].trim() : '';

    // URL/Site: http/https ou www
    const siteMatch = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);
    const site = siteMatch ? siteMatch[1] : '';

    return { email, telefone, whatsapp: telefone, site };
  };

  let processamentoIA = null;
  try {
    processamentoIA = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um ESPECIALISTA em EXTRAIR E ENRIQUECER DADOS DE VAGAS.

  ⚠️ INSTRUÇÕES CRÍTICAS:

  1️⃣ EXTRAÇÃO DE CONTATOS (MÁXIMA PRIORIDADE):
  - Procure AGRESSIVAMENTE: links (http, www, capitalvagas.com.br, etc), emails, telefones, WhatsApp
  - Locais: final do texto, "acesse", "saiba mais", "inscrições", "candidatar"
  - NÃO INVENTE! Mas procure em TODA parte do texto!

  2️⃣ DESCRIÇÃO COM VALOR (use dados REAIS do anúncio, não genéricos):
  - O que a empresa busca (experiência, perfil, requisitos reais mencionados)
  - Tipo de trabalho: "Home Office", "Remoto", "100% Remoto", etc
  - Requisitos explícitos: "estudantes de", "profissionais", "sem experiência", "com experiência"
  - Setor/área: tecnologia, RH, advocacia, atendimento, etc
  - NUNCA deixe descrição genérica tipo "processo seletivo para quem deseja ingressar"

  3️⃣ SE HOUVER MÚLTIPLAS VAGAS:
  - Crie UMA entrada para CADA vaga (com seus dados específicos)
  - Não junte tudo em uma só

  ANÚNCIO:
  ${vagaTexto}

  RETORNE JSON com array (se múltiplas vagas):
  [
  {
   "vaga_extraida": {
     "titulo": "...",
     "empresa": "...",
     "descricao_real": "Descrição com dados REAIS do anúncio, sem genéricos",
     "modalidade": "Home Office|Remoto|100% Remoto|Presencial|Híbrido",
     "tipo_contratacao": "Estágio|CLT|PJ|Trainee|etc",
     "requisitos_reais": ["Estudante de Direito", "Profissional ou iniciante", "Sem experiência prévia"],
     "contato": {
       "site": "capitalvagas.com.br",
       "email": "...",
       "telefone": "...",
       "whatsapp": "..."
     }
   }
  }
  ]

  EXEMPLO RUIM: "Processo seletivo para quem deseja ingressar na área de inteligência de informações"
  EXEMPLO BOM: "Sanchez & Sanchez procura Assistente de Dados para área de inteligência de informações. Vaga 100% remota. Aceita iniciantes em dados e BI."`,
      model: 'gpt_5',
    });
  } catch (e) {
    console.warn('Erro no processamento IA, usando dados básicos:', e.message);
  }

  // Se conseguiu processar com IA, usar dados enriquecidos, senão usar dados brutos
  const extraida = processamentoIA?.vaga_extraida || {};
  const enriquecimento = processamentoIA?.enriquecimento_ia || {};

  // ── Fallback: usar regex para extrair contatos se IA não conseguiu ──
  const textoParaExtracao = `${body.description || ''} ${body.additional_info || ''}`;
  const contatosRegex = extractContactsWithRegex(textoParaExtracao);

  // Construir descrição enriquecida
  let descricaoFinal = body.description || extraida.descricao || '';

  if (enriquecimento.resumo_da_funcao) {
    descricaoFinal = `${enriquecimento.resumo_da_funcao}\n\n${descricaoFinal}`.trim();
  }

  if (enriquecimento.atividades_comuns?.length > 0) {
    descricaoFinal += `\n\nAtividades comuns dessa área:\n${enriquecimento.atividades_comuns.map(a => `- ${a}`).join('\n')}`;
  }

  // ── Extrair contatos: prioridade body > IA > regex ──
  const emailFinal = body.contact_email || extraida.contato?.email || contatosRegex.email || '';
  const phoneFinal = body.contact_phone || extraida.contato?.telefone || contatosRegex.telefone || '';
  const whatsappFinal = body.contact_whatsapp || extraida.contato?.whatsapp || contatosRegex.whatsapp || '';
  const linkFinal = body.application_link || extraida.contato?.site || contatosRegex.site || '';

  const jobData = {
    title: body.title.trim(),
    company: body.company || extraida.empresa || '',
    city: body.city || extraida.cidade || '',
    state: body.state || extraida.estado || 'PB',
    job_type: body.job_type || extraida.tipo_contratacao || '',
    work_mode: body.work_mode || extraida.modalidade || 'Presencial',
    salary_range: body.salary_range || extraida.salario || '',
    description: descricaoFinal,
    additional_info: body.additional_info || '',
    contact_email: emailFinal,
    contact_phone: phoneFinal,
    contact_whatsapp: whatsappFinal,
    application_link: linkFinal,
    category: body.category || '',
    job_function: body.job_function || '',
    is_featured: body.is_featured === true,
    status: 'pending_review',
    needs_review: true,
    review_notes: `Vaga recebida via N8N. ${processamentoIA?.controle_processamento?.observacoes || 'Aguardando revisão.'}`,
    origem: body.origem || 'n8n_automatico',
    contract_types: body.job_type ? [body.job_type] : (extraida.tipo_contratacao ? [extraida.tipo_contratacao] : []),
    nivel_localizacao: body.city || extraida.cidade ? 'cidade' : 'pendente',
    geocode_status: body.city || extraida.cidade ? 'manual' : 'pending',
    contact_status: (emailFinal || phoneFinal || whatsappFinal || linkFinal) ? 'ok' : 'missing',
  };

  // ── Atualizar o rascunho com todos os dados enriquecidos ──
  const newJob = await base44.asServiceRole.entities.Job.update(jobRascunho.id, {
    ...jobData,
    id: undefined, // não enviar id no update
  });

  return Response.json({
    success: true,
    job_id: newJob.id,
    message: 'Vaga recebida e aguardando revisão manual no app.',
    status: 'pending_review',
  }, {
    status: 201,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
});