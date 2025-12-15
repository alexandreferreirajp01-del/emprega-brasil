import { base44 } from "@/api/base44Client";

/**
 * Extrai link de QR Code de uma imagem de forma robusta e precisa
 * Usa múltiplas tentativas e validação
 */
export async function extractQRCodeLink(imageUrl) {
  if (!imageUrl) return null;

  try {
    // Tentativa 1: Detecção direta e precisa com contexto
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `ANÁLISE CRÍTICA: Esta imagem contém um QR Code?

INSTRUÇÕES ESTRITAS:
1. Examine CUIDADOSAMENTE toda a imagem em busca de QR Codes
2. QR Codes são códigos de barras quadrados em preto e branco com padrão de pontos
3. Se encontrar QR Code:
   - DECODIFIQUE e extraia o link/URL completo
   - Valide que é uma URL válida (começa com http/https ou é link encurtado)
   - Retorne EXATAMENTE o link extraído, SEM modificações
4. Se NÃO encontrar QR Code: retorne has_qrcode: false

ATENÇÃO: Seja EXTREMAMENTE preciso. Não invente links.`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          has_qrcode: { 
            type: "boolean",
            description: "true se encontrou QR Code, false caso contrário"
          },
          qrcode_link: { 
            type: "string",
            description: "Link completo extraído do QR Code"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Nível de confiança na extração"
          }
        }
      }
    });

    // Validar resultado
    if (result.has_qrcode && result.qrcode_link && result.confidence !== "low") {
      const link = result.qrcode_link.trim();
      
      // Validar formato de URL
      if (isValidURL(link)) {
        console.log(`✅ QR Code detectado: ${link} (confiança: ${result.confidence})`);
        return link;
      }
    }

    console.log('ℹ️ Nenhum QR Code válido detectado');
    return null;

  } catch (error) {
    console.error('❌ Erro ao extrair QR Code:', error);
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