import React, { useEffect } from 'react';
import AdScript from './AdScript';

export default function AdContainer({ 
  adType, 
  pageName,
  location,
  className = ''
}) {
  useEffect(() => {
    // Sempre carregar anúncios - config apenas bloqueia se explicitamente desativado
    try {
      const config = localStorage.getItem('adsterra_config');
      if (!config) return; // Sem config = sempre mostrar
      
      const parsed = JSON.parse(config);
      const adConfig = parsed[adType];
      
      // Apenas bloquear se explicitamente disabled
      if (adConfig?.enabled === false) return;
    } catch (e) {
      // Em caso de erro, sempre carregar
    }
  }, [adType, pageName, location]);

  return (
    <div className={className}>
      <AdScript adType={adType} />
    </div>
  );
}