import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CORA_CLIENT_ID = Deno.env.get('CORA_CLIENT_ID');
const CORA_PRIVATE_KEY = Deno.env.get('CORA_PRIVATE_KEY');
const CORA_CERTIFICATE = Deno.env.get('CORA_CERTIFICATE');

// URLs de Produção - Integração Direta
const CORA_TOKEN_URL = 'https://matls-clients.api.cora.com.br/oauth2/token';
const CORA_API_BASE = 'https://api.cora.com.br';

/**
 * Cria um HTTP client com mTLS (certificado de cliente) para o Banco Cora
 */
function createMtlsClient() {
  return Deno.createHttpClient({
    cert: CORA_CERTIFICATE,
    key: CORA_PRIVATE_KEY,
  });
}

/**
 * Obtém token OAuth2 via mTLS
 */
async function getCoraToken() {
  const client = createMtlsClient();

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CORA_CLIENT_ID,
  });

  const response = await fetch(CORA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    client,
  });

  client.close();

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao obter token Cora (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Faz uma chamada autenticada à API Cora
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

      console.log('[coraPayment] Obtendo token mTLS...');
      const token = await getCoraToken();

      // Data de vencimento: 30 minutos a partir de agora
      const dueDate = new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        code: `PAG-${Date.now()}`,
        amount: Math.round(amount * 100), // em centavos
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

      // Registrar pagamento pendente
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

    // ===== VERIFICAR STATUS DE COBRANÇA =====
    if (action === 'check_status') {
      const { invoice_id } = body;

      if (!invoice_id) {
        return Response.json({ error: 'invoice_id é obrigatório' }, { status: 400 });
      }

      console.log('[coraPayment] Verificando status:', invoice_id);
      const token = await getCoraToken();
      const invoice = await coraRequest('GET', `/v2/invoices/${invoice_id}`, null, token);

      console.log('[coraPayment] Status:', invoice.status);

      // Se pago, atualizar entidade Payment
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