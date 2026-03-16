import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import https from 'node:https';
import { Buffer } from 'node:buffer';

// URLs de Produção - Integração Direta Cora
const CORA_TOKEN_HOST = 'matls-clients.api.cora.com.br';
const CORA_API_BASE = 'https://api.cora.com.br';

/**
 * Normaliza PEM - converte \n literal em quebra de linha real
 */
function normalizePem(pem) {
  if (!pem) return '';
  return pem.replace(/\\n/g, '\n').trim();
}

/**
 * Faz requisição HTTPS com certificado de cliente (mTLS) usando Node.js nativo
 */
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Parse error (${res.statusCode}): ${data}`));
        }
      });
    });
    req.setTimeout(15000, () => {
      req.destroy(new Error(`Timeout conectando ao host ${options.hostname}`));
    });
    req.on('error', (err) => {
      console.error('[coraPayment] httpsRequest error:', err.message);
      reject(err);
    });
    if (body) req.write(body);
    req.end();
  });
}

/**
 * Obtém token OAuth2 via mTLS usando Node.js https com cert+key
 */
async function getCoraToken(cert, key, clientId) {
  const bodyStr = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
  }).toString();

  console.log('[coraPayment] Obtendo token via mTLS (node:https)...');

  const data = await httpsRequest({
    hostname: CORA_TOKEN_HOST,
    port: 443,
    path: '/oauth2/token',
    method: 'POST',
    cert,
    key,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(bodyStr),
    },
  }, bodyStr);

  console.log('[coraPayment] Token obtido com sucesso!');
  return data.access_token;
}

/**
 * Faz chamada autenticada à API Cora (apenas Bearer token)
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

    // Ler e normalizar secrets dentro do handler
    const clientId = Deno.env.get('CORA_CLIENT_ID') || '';
    const cert = normalizePem(Deno.env.get('CORA_CERTIFICATE'));
    const key = normalizePem(Deno.env.get('CORA_PRIVATE_KEY'));

    console.log('[coraPayment] Action:', action, '| User:', user.email);
    console.log('[coraPayment] cert length:', cert.length, '| key length:', key.length);
    console.log('[coraPayment] cert starts:', cert.substring(0, 27));
    console.log('[coraPayment] client_id:', clientId ? clientId.substring(0, 8) + '...' : 'VAZIO');

    if (!cert || !key || !clientId) {
      return Response.json({ error: 'Secrets CORA não configurados corretamente' }, { status: 500 });
    }

    // Helper para obter token
    const getToken = () => getCoraToken(cert, key, clientId);

    // ===== CRIAR COBRANÇA (Boleto + PIX) =====
    if (action === 'create_pix') {
      const { amount, description, customer_name, customer_email, customer_cpf, plan_id } = body;

      if (!amount || !customer_name || !customer_email || !customer_cpf) {
        return Response.json({
          error: 'Dados incompletos: amount, customer_name, customer_email e customer_cpf são obrigatórios'
        }, { status: 400 });
      }

      const token = await getToken();
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

      const token = await getToken();
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