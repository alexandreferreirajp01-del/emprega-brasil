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

  // ── Criar vaga no banco de dados ─────────────────────────────
  const base44 = createClientFromRequest(req);

  const jobData = {
    title: body.title.trim(),
    company: body.company || '',
    city: body.city || '',
    state: body.state || 'PB',
    job_type: body.job_type || '',
    work_mode: body.work_mode || 'Presencial',
    salary_range: body.salary_range || '',
    description: body.description || '',
    additional_info: body.additional_info || '',
    contact_email: body.contact_email || '',
    contact_phone: body.contact_phone || '',
    contact_whatsapp: body.contact_whatsapp || '',
    application_link: body.application_link || '',
    category: body.category || '',
    job_function: body.job_function || '',
    is_featured: body.is_featured === true,
    // Status: sempre "pending_review" para revisão manual
    status: 'pending_review',
    needs_review: true,
    review_notes: 'Vaga recebida automaticamente via N8N. Aguardando revisão.',
    origem: body.origem || 'n8n_automatico',
    contract_types: body.job_type ? [body.job_type] : [],
    nivel_localizacao: body.city ? 'cidade' : 'pendente',
    geocode_status: body.city ? 'manual' : 'pending',
    contact_status: (body.contact_email || body.contact_phone || body.contact_whatsapp || body.application_link) ? 'ok' : 'missing',
  };

  const newJob = await base44.asServiceRole.entities.Job.create(jobData);

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