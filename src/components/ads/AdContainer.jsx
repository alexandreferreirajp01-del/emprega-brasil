import React from 'react';
import AdScript from './AdScript';

export default function AdContainer({ 
  adType, 
  className = ''
}) {
  // SEMPRE renderiza - sem lógica de bloqueio
  return (
    <div className={className} style={{ minHeight: '50px' }}>
      <AdScript adType={adType} />
    </div>
  );
}