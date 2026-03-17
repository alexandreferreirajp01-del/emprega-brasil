import { base44 } from '@/api/base44Client';

/**
 * Extrai link de QR Code de uma imagem.
 * Usa o backend dedicado `decodeQRCode` que chama api.qrserver.com (leitura real de pixels).
 * Muito mais confiável que jsQR no browser ou IA adivinhando.
 */
export async function extractQRCodeLink(imageUrl) {
  if (!imageUrl) return null;

  try {
    const response = await base44.functions.invoke('decodeQRCode', { image_url: imageUrl });
    const data = response?.data;
    if (data?.found && data?.link) {
      console.log('✅ QR Code decodificado (backend):', data.link, '— fonte:', data.source);
      return data.link;
    }
  } catch (e) {
    console.warn('decodeQRCode backend falhou:', e.message);
  }

  return null;
}

/**
 * Extrai QR Codes de múltiplas imagens — sequencial para não sobrecarregar
 */
export async function extractQRCodesFromImages(imageUrls) {
  const results = [];
  for (const url of imageUrls) {
    results.push(await extractQRCodeLink(url));
  }
  return results;
}