import React, { useState, useEffect } from 'react';

/**
 * Componente wrapper para anúncios do AdsTerra
 * Verifica se o anúncio deve ser exibido com base nas configurações
 */
export default function AdContainer({ 
  adType, 
  pageName,
  location,
  children,
  fallback = null,
  className = ''
}) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const checkConfig = () => {
      try {
        const config = localStorage.getItem('adsterra_config');
        if (!config) {
          setShouldShow(false);
          return;
        }

        const parsed = JSON.parse(config);
        const adConfig = parsed[adType];
        
        if (!adConfig || !adConfig.enabled) {
          setShouldShow(false);
          return;
        }

        if (pageName && !adConfig.pages?.[pageName]) {
          setShouldShow(false);
          return;
        }

        if (location && !adConfig.locations?.[location]) {
          setShouldShow(false);
          return;
        }

        setShouldShow(true);
      } catch (e) {
        console.error('Erro ao verificar config de anúncio:', e);
        setShouldShow(false);
      }
    };

    checkConfig();

    // Listener para atualizações
    const handleUpdate = () => {
      checkConfig();
    };

    window.addEventListener('adsterra_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('adsterra_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [adType, pageName, location]);

  if (!shouldShow) {
    return fallback;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}