import React from 'react';
import AdContainer from './AdContainer';
import AdScript from './AdScript';

/**
 * Componente genérico para banners do AdsTerra
 * @param {string} size - Tamanho do banner (728x90, 320x50, 300x250, etc)
 * @param {string} pageName - Nome da página
 * @param {string} location - Localização (header, content, sidebar, footer)
 * @param {string} className - Classes CSS adicionais
 */
export default function BannerAd({ size, pageName, location, className = '' }) {
  const adType = `banner_${size.replace('x', 'x')}`;
  
  return (
    <AdContainer 
      adType={adType} 
      pageName={pageName} 
      location={location}
      className={`flex justify-center items-center ${className}`}
    >
      <AdScript adType={adType} />
    </AdContainer>
  );
}