import React, { useEffect, useRef, useState } from 'react';

const PUBLISHER_ID = 'ca-pub-8605408842983455';

/**
 * Componente para anúncios do Google AdSense
 * @param {string} slot - ID do slot (obtido no painel do AdSense)
 * @param {string} format - auto | rectangle | horizontal | vertical
 * @param {string} className - classes adicionais
 * @param {string} style - estilos inline adicionais
 */
export default function GoogleAdUnit({ slot, format = 'auto', className = '', style = {} }) {
  const adRef = useRef(null);
  const pushed = useRef(false);
  const [ready, setReady] = useState(false);

  // Aguarda o script do AdSense estar disponível
  useEffect(() => {
    if (!slot) return;

    let attempts = 0;
    const maxAttempts = 20;

    const check = setInterval(() => {
      attempts++;
      if (window.adsbygoogle) {
        setReady(true);
        clearInterval(check);
      } else if (attempts >= maxAttempts) {
        clearInterval(check);
      }
    }, 300);

    return () => clearInterval(check);
  }, [slot]);

  // Faz o push quando o componente está pronto e visível
  useEffect(() => {
    if (!ready || !slot || pushed.current || !adRef.current) return;

    // Verifica se o elemento tem largura (evita push em elementos ocultos)
    const width = adRef.current.offsetWidth;
    if (width === 0) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // AdSense não disponível
    }
  }, [ready, slot]);

  if (!slot) return null;

  return (
    <div
      ref={adRef}
      className={`adsense-container overflow-hidden text-center ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}