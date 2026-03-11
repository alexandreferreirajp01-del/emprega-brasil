import jsQR from 'jsqr';

/**
 * Decodifica QR Code de uma URL de imagem usando jsQR (leitura real de pixels)
 * Fallback para IA se jsQR não encontrar nada
 */
async function decodeWithJsQR(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });
      resolve(code ? code.data : null);
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Extrai link de QR Code de uma imagem
 * 1º tenta jsQR (preciso, sem IA)
 * 2º fallback para IA se não encontrar
 */
export async function extractQRCodeLink(imageUrl) {
  if (!imageUrl) return null;

  // Tentativa 1: jsQR (decodificação real)
  try {
    const result = await decodeWithJsQR(imageUrl);
    if (result) {
      console.log('✅ QR Code decodificado via jsQR:', result);
      return result;
    }
  } catch (e) {
    console.warn('jsQR falhou, tentando IA...', e);
  }

  // Tentativa 2: IA como fallback (para QR codes borrados/difíceis)
  try {
    const { base44 } = await import('@/api/base44Client');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Examine esta imagem e encontre o QR Code. Decodifique-o e retorne o link/URL exato contido nele. Não invente links. Se não houver QR Code, retorne has_qrcode: false.`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          has_qrcode: { type: "boolean" },
          qrcode_link: { type: "string" }
        },
        required: ["has_qrcode"]
      }
    });

    if (result.has_qrcode && result.qrcode_link) {
      console.log('✅ QR Code extraído via IA (fallback):', result.qrcode_link);
      return result.qrcode_link.trim();
    }
  } catch (e) {
    console.error('Erro no fallback IA:', e);
  }

  return null;
}

/**
 * Extrai QR Codes de múltiplas imagens em paralelo
 */
export async function extractQRCodesFromImages(imageUrls) {
  return Promise.all(imageUrls.map(url => extractQRCodeLink(url)));
}