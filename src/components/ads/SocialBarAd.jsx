import React from 'react';
import AdContainer from './AdContainer';
import AdScript from './AdScript';

export default function SocialBarAd({ pageName }) {
  return (
    <AdContainer adType="social_bar" pageName={pageName} location="sidebar">
      <AdScript adType="social_bar" />
    </AdContainer>
  );
}