import React from 'react';
import AdContainer from './AdContainer';
import AdScript from './AdScript';

export default function NativeBannerAd({ pageName, location = 'content', className = '' }) {
  return (
    <AdContainer 
      adType="native_banner" 
      pageName={pageName} 
      location={location}
      className={`my-4 ${className}`}
    >
      <AdScript adType="native_banner" />
    </AdContainer>
  );
}