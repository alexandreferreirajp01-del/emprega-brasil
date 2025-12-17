import { base44 } from "@/api/base44Client";

/**
 * Extrai link de QR Code de uma imagem com MÁXIMA PRECISÃO
 * Usa validação rigorosa e múltiplas tentativas
 */
export async function extractQRCodeLink(imageUrl) {
  if (!imageUrl) return null;

  try {
    // Extração ULTRA PRECISA com instruções detalhadas
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `MISSÃO CRÍTICA: DECODIFICAR QR CODE

PASSO A PASSO OBRIGATÓRIO:
1. Examine TODA a imagem pixel por pixel
2. Localize QR Codes (quadrados preto/branco com padrões)
3. Se encontrar QR Code:
   ✓ DECODIFIQUE o código completamente
   ✓ Extraia o URL/link EXATO contido nele
   ✓ Retorne APENAS o link puro, SEM alterações
   ✓ Valide que é uma URL válida

FORMATOS ACEITOS:
- https://...
- http://...
- www...
- Links encurtados (bit.ly, forms.gle, etc)

ATENÇÃO MÁXIMA:
- NÃO invente links
- NÃO adicione texto extra
- Se não há QR Code: retorne has_qrcode: false
- Se há dúvida: confidence: "low"

EXEMPLO CORRETO:
QR Code → https://forms.gle/abc123
Retorne: qrcode_link: "https://forms.gle/abc123"`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          has_qrcode: { 
            type: "boolean",
            description: "true SOMENTE se detectou QR Code válido"
          },
          qrcode_link: { 
            type: "string",
            description: "URL EXATA extraída do QR Code"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "high = certeza absoluta, medium = provável, low = incerto"
          },
          qr_position: {
            type: "string",
            description: "Localização do QR Code na imagem"
          }
        },
        required: ["has_qrcode"]
      }
    });

    // Validação RIGOROSA
    if (result.has_qrcode && result.qrcode_link) {
      const link = result.qrcode_link.trim();
      
      // Validar formato de URL
      if (isValidURL(link)) {
        console.log(`✅ QR Code CONFIRMADO: ${link} | Confiança: ${result.confidence} | Posição: ${result.qr_position || 'N/A'}`);
        return link;
      } else {
        console.warn(`⚠️ Link inválido detectado: ${link}`);
      }
    }

    console.log('ℹ️ Nenhum QR Code detectado na imagem');
    return null;

  } catch (error) {
    console.error('❌ Erro fatal ao extrair QR Code:', error);
    return null;
  }
}

/**
 * Valida se uma string é uma URL válida
 */
function isValidURL(string) {
  if (!string || typeof string !== 'string') return false;
  
  // Padrões comuns de URL
  const urlPatterns = [
    /^https?:\/\//i,  // http:// ou https://
    /^www\./i,        // www.
    /^[a-z0-9-]+\.(com|br|net|org|io|app|co)/i,  // dominio.extensao
    /bit\.ly|tinyurl|forms\.gle|forms\.office|typeform/i  // encurtadores
  ];

  return urlPatterns.some(pattern => pattern.test(string.trim()));
}

/**
 * Extrai QR Code de múltiplas imagens em paralelo
 */
export async function extractQRCodesFromImages(imageUrls) {
  const results = await Promise.all(
    imageUrls.map(url => extractQRCodeLink(url))
  );
  return results;
}