import React from 'react';
import AdContainer from './AdContainer';

export default function NativeBannerAd({ pageName, location, className = '' }) {
  return (
    <AdContainer 
      adType="native_banner"
      pageName={pageName}
      location={location}
      className={className}
    />
  );
}