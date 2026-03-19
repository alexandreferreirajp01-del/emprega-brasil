import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Backend dedicado para decodificação de QR Code
 * Usa api.qrserver.com (leitura real de pixels, não IA)
 * Fallback para múltiplas APIs caso a principal falhe
 */

async function decodeViaQRServer(imageUrl) {
  try {
    const apiUrl = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.[0]?.symbol?.[0]?.data;
    if (result && result.trim() !== '' && result !== 'null') {
      return result.trim();
    }
    return null;
  } catch (e) {
    console.warn('qrserver falhou:', e.message);
    return null;
  }
}

async function decodeViaGoQR(imageUrl) {
  try {
    const apiUrl = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(imageUrl)}&outputformat=json`;
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.[0]?.symbol?.[0]?.data;
    return result && result !== 'null' ? result.trim() : null;
  } catch {
    return null;
  }
}

// Normaliza e valida o link extraído do QR Code
function normalizeLink(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length < 5) return null;

  // Se começa com http/https/wa.me/tel: — é válido
  if (/^(https?:\/\/|wa\.me\/|tel:|mailto:)/i.test(trimmed)) {
    return trimmed;
  }

  // Se parece uma URL sem protocolo
  if (/^(www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Se parece número de telefone puro
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
    const phone = digitsOnly.startsWith('55') ? digitsOnly : `55${digitsOnly}`;
    return `https://wa.me/${phone}`;
  }

  return trimmed; // retorna mesmo assim (pode ser texto com info)
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Aceita chamadas autenticadas ou de serviço
    const body = await req.json();
    const { image_url } = body;

    if (!image_url) {
      return Response.json({ error: 'image_url é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Decodificando QR Code de:', image_url);

    // Tentativa 1: api.qrserver.com (API dedicada, leitura real)
    let rawResult = await decodeViaQRServer(image_url);
    let source = 'qrserver';

    // Tentativa 2: segunda chamada com variação de parâmetros
    if (!rawResult) {
      rawResult = await decodeViaGoQR(image_url);
      source = 'qrserver_v2';
    }

    // Tentativa 3: Baixar imagem e enviar como buffer para qrserver
    if (!rawResult) {
      try {
        const imgResp = await fetch(image_url, { signal: AbortSignal.timeout(8000) });
        if (imgResp.ok) {
          const imgBuffer = await imgResp.arrayBuffer();
          const formData = new FormData();
          const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
          formData.append('file', blob, 'qr.jpg');

          const uploadResp = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(12000)
          });

          if (uploadResp.ok) {
            const uploadData = await uploadResp.json();
            const uploadResult = uploadData?.[0]?.symbol?.[0]?.data;
            if (uploadResult && uploadResult !== 'null') {
              rawResult = uploadResult.trim();
              source = 'qrserver_upload';
            }
          }
        }
      } catch (e) {
        console.warn('Tentativa upload falhou:', e.message);
      }
    }

    if (rawResult) {
      const normalized = normalizeLink(rawResult);
      console.log(`✅ QR Code decodificado (${source}):`, normalized);
      return Response.json({
        success: true,
        found: true,
        raw: rawResult,
        link: normalized,
        source
      });
    }

    console.log('❌ Nenhum QR Code encontrado na imagem');
    return Response.json({ success: true, found: false, link: null });

  } catch (error) {
    console.error('Erro em decodeQRCode:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});