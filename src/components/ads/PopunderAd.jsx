import React from 'react';
import AdContainer from './AdContainer';
import AdScript from './AdScript';

export default function PopunderAd({ pageName }) {
  return (
    <AdContainer adType="popunder" pageName={pageName} location="header">
      <AdScript adType="popunder" />
    </AdContainer>
  );
}