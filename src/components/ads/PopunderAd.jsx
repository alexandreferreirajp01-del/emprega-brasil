import React from 'react';
import AdContainer from './AdContainer';

export default function PopunderAd({ pageName }) {
  return (
    <AdContainer 
      adType="popunder" 
      pageName={pageName}
      location="popunder"
    />
  );
}