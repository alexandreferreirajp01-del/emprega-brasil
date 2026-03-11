import React, { useEffect, useRef } from 'react';

const PUBLISHER_ID = 'ca-pub-8605408842983455';

/**
 * Componente para anúncios do Google AdSense
 * @param {string} slot - ID do slot (obtido no painel do AdSense)
 * @param {string} format - auto | rectangle | horizontal | vertical
 * @param {string} className - classes adicionais
 */
export default function GoogleAdUnit({ slot, format = 'auto', className = '' }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;

    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch (e) {
        // AdSense não disponível
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [slot]);

  if (!slot) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded text-slate-400 text-xs py-3 ${className}`}>
        Espaço Google AdSense
      </div>
    );
  }

  return (
    <div className={`adsense-container overflow-hidden text-center ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}