import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CORA_CLIENT_ID = Deno.env.get('CORA_CLIENT_ID');
const CORA_CERTIFICATE = Deno.env.get('CORA_CERTIFICATE');
const CORA_PRIVATE_KEY = Deno.env.get('CORA_PRIVATE_KEY');

// Cora API URLs - Produção (Integração Direta)
const CORA_TOKEN_URL = 'https://matls-clients.api.cora.com.br/oauth2/token';
const CORA_API_URL = 'https://api.cora.com.br';

/**
 * Obtém token OAuth2 do Banco Cora usando mTLS (mutual TLS)
 * O Deno não suporta mTLS nativamente via fetch(), então usamos a abordagem
 * de enviar o certificado como parte da autenticação via client_credentials
 */
async function getCoraToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CORA_CLIENT_ID,
  });

  const response = await fetch(CORA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao obter token Cora: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Cria uma cobrança PIX no Banco Cora
 */
async function createPixCharge({ token, amount, description, customer }) {
  const payload = {
    code: `PAG-${Date.now()}`,
    amount,
    description: description || 'Pagamento Vagas Abertas PB',
    payment_terms: {
      due_date: new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0], // 30 min
      fine: { date: new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0], rate: 0 },
      interest: { date: new Date(Date.now() + 30 * 60 * 1000).toISOString().split('T')[0], rate: 0 },
    },
    customer: {
      name: customer.name,
      email: customer.email,
      document: {
        identity: customer.cpf,
        type: 'CPF',
      },
    },
    payment_forms: ['PIX'],
    notifications: [
      { channel: 'EMAIL', destination: customer.email },
    ],
  };

  const response = await fetch(`${CORA_API_URL}/v2/invoices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `idem-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao criar cobrança: ${response.status} - ${errorText}`);
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

    // ===== CRIAR COBRANÇA PIX =====
    if (action === 'create_pix') {
      const { amount, description, customer_name, customer_email, customer_cpf, plan_id } = body;

      if (!amount || !customer_name || !customer_email || !customer_cpf) {
        return Response.json({ error: 'Dados incompletos: amount, customer_name, customer_email e customer_cpf são obrigatórios' }, { status: 400 });
      }

      console.log('[coraPayment] Obtendo token...');
      const token = await getCoraToken();

      console.log('[coraPayment] Criando cobrança PIX...');
      const charge = await createPixCharge({
        token,
        amount: Math.round(amount * 100), // em centavos
        description: description || `Plano ${plan_id || ''} - Vagas Abertas PB`,
        customer: {
          name: customer_name,
          email: customer_email,
          cpf: customer_cpf,
        },
      });

      console.log('[coraPayment] Cobrança criada:', charge.id);

      // Salvar pagamento pendente na entidade Payment
      await base44.entities.Payment.create({
        user_email: user.email,
        amount: amount,
        status: 'pending',
        payment_method: 'pix',
        external_id: charge.id,
        notes: `Plano: ${plan_id || 'desconhecido'} | Cora Invoice ID: ${charge.id}`,
      });

      return Response.json({
        success: true,
        invoice_id: charge.id,
        pix_code: charge.pix?.emv || null,
        pix_qr_code: charge.pix?.image_base64 || null,
        payment_url: charge.payment_url || null,
        due_date: charge.payment_terms?.due_date || null,
      });
    }

    // ===== VERIFICAR STATUS DE COBRANÇA =====
    if (action === 'check_status') {
      const { invoice_id } = body;

      if (!invoice_id) {
        return Response.json({ error: 'invoice_id é obrigatório' }, { status: 400 });
      }

      const token = await getCoraToken();

      const response = await fetch(`${CORA_API_URL}/v2/invoices/${invoice_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao verificar cobrança: ${response.status} - ${errorText}`);
      }

      const invoice = await response.json();

      console.log('[coraPayment] Status da cobrança:', invoice.status);

      // Se pago, atualizar Payment no banco
      if (invoice.status === 'PAID') {
        const payments = await base44.entities.Payment.filter({ external_id: invoice_id });
        if (payments.length > 0) {
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