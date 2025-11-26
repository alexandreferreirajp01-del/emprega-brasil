import React, { useEffect, useRef } from 'react';

export default function AdBanner({ slot, format = 'auto', className = '' }) {
  const adRef = useRef(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Only load ad once
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (e) {
      console.log('AdSense não carregado');
    }
  }, []);

  // Placeholder for development/when ads not loaded
  if (!slot) {
    return (
      <div className={`ad-container bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm ${className}`}>
        <span>Espaço para anúncio</span>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Substituir pelo seu ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}