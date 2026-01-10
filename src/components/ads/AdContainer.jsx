import React, { useState, useEffect } from 'react';
import AdScript from './AdScript';

export default function AdContainer({ 
  adType, 
  pageName,
  location,
  className = ''
}) {
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    try {
      const config = localStorage.getItem('adsterra_config');
      if (!config) {
        setShouldShow(true); // Mostrar por padrão
        return;
      }

      const parsed = JSON.parse(config);
      const adConfig = parsed[adType];
      
      // Se o anúncio não está configurado ou está desativado
      if (!adConfig || !adConfig.enabled) {
        setShouldShow(false);
        return;
      }

      // Verificar se a página está ativa
      if (pageName && adConfig.pages && !adConfig.pages[pageName]) {
        setShouldShow(false);
        return;
      }

      // Verificar se a localização está ativa
      if (location && adConfig.locations && !adConfig.locations[location]) {
        setShouldShow(false);
        return;
      }

      setShouldShow(true);
    } catch (e) {
      setShouldShow(true); // Mostrar por padrão em caso de erro
    }
  }, [adType, pageName, location]);

  if (!shouldShow) return null;

  return (
    <div className={className}>
      <AdScript adType={adType} />
    </div>
  );
}