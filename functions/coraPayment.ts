import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CORA_CLIENT_ID = Deno.env.get('CORA_CLIENT_ID');
// Normalizar quebras de linha caso o secret tenha sido salvo com \n literal
const CORA_PRIVATE_KEY = (Deno.env.get('CORA_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
const CORA_CERTIFICATE = (Deno.env.get('CORA_CERTIFICATE') || '').replace(/\\n/g, '\n');

// URLs de Produção - Integração Direta Cora
const CORA_TOKEN_HOST = 'matls-clients.api.cora.com.br';
const CORA_TOKEN_PATH = '/oauth2/token';
const CORA_API_BASE = 'https://api.cora.com.br';

/**
 * DEBUG: Inspeciona o formato dos secrets PEM
 */
function debugSecrets() {
  const certRaw = Deno.env.get('CORA_CERTIFICATE') || '';
  const keyRaw = Deno.env.get('CORA_PRIVATE_KEY') || '';
  console.log('[DEBUG] CERT length:', certRaw.length);
  console.log('[DEBUG] CERT starts with:', certRaw.substring(0, 50));
  console.log('[DEBUG] CERT has literal \\n:', certRaw.includes('\\n'));
  console.log('[DEBUG] CERT has real newline:', certRaw.includes('\n'));
  console.log('[DEBUG] KEY length:', keyRaw.length);
  console.log('[DEBUG] KEY starts with:', keyRaw.substring(0, 50));
  console.log('[DEBUG] KEY has literal \\n:', keyRaw.includes('\\n'));
  console.log('[DEBUG] KEY has real newline:', keyRaw.includes('\n'));
}

/**
 * Faz uma requisição HTTP via Deno.connectTls com mTLS (certificado de cliente).
 * Usado para o endpoint de token que exige mTLS.
 */
async function mtlsPost(host, path, bodyString, contentType = 'application/x-www-form-urlencoded') {
  const conn = await Deno.connectTls({
    hostname: host,
    port: 443,
    cert: CORA_CERTIFICATE,
    key: CORA_PRIVATE_KEY,
  });

  const request = [
    `POST ${path} HTTP/1.1`,
    `Host: ${host}`,
    `Content-Type: ${contentType}`,
    `Content-Length: ${new TextEncoder().encode(bodyString).length}`,
    `Connection: close`,
    ``,
    bodyString,
  ].join('\r\n');

  const encoder = new TextEncoder();
  await conn.write(encoder.encode(request));

  // Ler a resposta completa
  const decoder = new TextDecoder();
  let rawResponse = '';
  const buf = new Uint8Array(4096);

  while (true) {
    const n = await conn.read(buf);
    if (n === null) break;
    rawResponse += decoder.decode(buf.subarray(0, n));
  }

  conn.close();

  // Separar headers do body
  const headerBodySplit = rawResponse.indexOf('\r\n\r\n');
  const headerSection = rawResponse.substring(0, headerBodySplit);
  let responseBody = rawResponse.substring(headerBodySplit + 4);

  // Verificar status HTTP
  const statusLine = headerSection.split('\r\n')[0];
  const statusCode = parseInt(statusLine.split(' ')[1]);

  // Se chunked, decodificar
  if (headerSection.toLowerCase().includes('transfer-encoding: chunked')) {
    responseBody = decodeChunked(responseBody);
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`mTLS request failed (${statusCode}): ${responseBody}`);
  }

  return JSON.parse(responseBody);
}

/**
 * Decodifica resposta HTTP chunked encoding
 */
function decodeChunked(chunked) {
  let result = '';
  let remaining = chunked;
  while (remaining.length > 0) {
    const crlf = remaining.indexOf('\r\n');
    if (crlf === -1) break;
    const chunkSize = parseInt(remaining.substring(0, crlf), 16);
    if (isNaN(chunkSize) || chunkSize === 0) break;
    result += remaining.substring(crlf + 2, crlf + 2 + chunkSize);
    remaining = remaining.substring(crlf + 2 + chunkSize + 2);
  }
  return result;
}

/**
 * Obtém token OAuth2 via mTLS
 */
async function getCoraToken() {
  const bodyStr = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CORA_CLIENT_ID,
  }).toString();

  console.log('[coraPayment] Obtendo token via mTLS...');
  const data = await mtlsPost(CORA_TOKEN_HOST, CORA_TOKEN_PATH, bodyStr);
  console.log('[coraPayment] Token obtido com sucesso');
  return data.access_token;
}

/**
 * Faz chamada autenticada à API Cora (sem mTLS - apenas Bearer token)
 */
async function coraRequest(method, path, body, token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (method !== 'GET') {
    headers['Idempotency-Key'] = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  const response = await fetch(`${CORA_API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro Cora API ${path} (${response.status}): ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    console.log('[coraPayment] Action:', action, '| User:', user.email);

    // ===== CRIAR COBRANÇA (Boleto + PIX) =====
    if (action === 'create_pix') {
      const { amount, description, customer_name, customer_email, customer_cpf, plan_id } = body;

      if (!amount || !customer_name || !customer_email || !customer_cpf) {
        return Response.json({
          error: 'Dados incompletos: amount, customer_name, customer_email e customer_cpf são obrigatórios'
        }, { status: 400 });
      }

      const token = await getCoraToken();

      const dueDate = new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        code: `PAG-${Date.now()}`,
        amount: Math.round(amount * 100),
        description: description || `Plano ${plan_id || ''} - Vagas Abertas PB`,
        payment_terms: {
          due_date: dueDate,
          fine: { date: dueDate, rate: 0 },
          interest: { date: dueDate, rate: 0 },
        },
        customer: {
          name: customer_name,
          email: customer_email,
          document: {
            identity: customer_cpf.replace(/\D/g, ''),
            type: 'CPF',
          },
        },
        payment_forms: ['PIX', 'BOLETO'],
        notifications: [
          { channel: 'EMAIL', destination: customer_email },
        ],
      };

      console.log('[coraPayment] Criando cobrança...');
      const charge = await coraRequest('POST', '/v2/invoices', payload, token);
      console.log('[coraPayment] Cobrança criada:', charge.id);

      await base44.entities.Payment.create({
        user_email: user.email,
        amount: amount,
        status: 'pending',
        payment_method: 'pix',
        external_id: charge.id,
        notes: `Plano: ${plan_id || 'desconhecido'} | Cora Invoice: ${charge.id}`,
      });

      return Response.json({
        success: true,
        invoice_id: charge.id,
        pix_code: charge.pix?.emv || null,
        pix_qr_code_base64: charge.pix?.image_base64 || null,
        payment_url: charge.payment_url || null,
        due_date: dueDate,
      });
    }

    // ===== VERIFICAR STATUS =====
    if (action === 'check_status') {
      const { invoice_id } = body;

      if (!invoice_id) {
        return Response.json({ error: 'invoice_id é obrigatório' }, { status: 400 });
      }

      const token = await getCoraToken();
      const invoice = await coraRequest('GET', `/v2/invoices/${invoice_id}`, null, token);

      console.log('[coraPayment] Status:', invoice.status);

      if (invoice.status === 'PAID') {
        const payments = await base44.entities.Payment.filter({ external_id: invoice_id });
        if (payments.length > 0 && payments[0].status !== 'approved') {
          await base44.entities.Payment.update(payments[0].id, { status: 'approved' });
        }
      }

      return Response.json({
        success: true,
        invoice_id,
        status: invoice.status,
        paid: invoice.status === 'PAID',
      });
    }

    return Response.json({ error: 'Ação inválida. Use: create_pix, check_status' }, { status: 400 });

  } catch (error) {
    console.error('[coraPayment] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});