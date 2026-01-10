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
          console.log(`AdContainer: No config found for ${adType}`);
          setShouldShow(false);
          return;
        }

        const parsed = JSON.parse(config);
        const adConfig = parsed[adType];
        
        if (!adConfig || !adConfig.enabled) {
          console.log(`AdContainer: ${adType} is not enabled`);
          setShouldShow(false);
          return;
        }

        if (pageName && !adConfig.pages?.[pageName]) {
          console.log(`AdContainer: ${adType} not enabled for page ${pageName}`);
          setShouldShow(false);
          return;
        }

        if (location && !adConfig.locations?.[location]) {
          console.log(`AdContainer: ${adType} not enabled for location ${location}`);
          setShouldShow(false);
          return;
        }

        console.log(`AdContainer: Showing ${adType} on ${pageName} at ${location}`);
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