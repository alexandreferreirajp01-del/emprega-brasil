import React from 'react';
import AdContainer from './AdContainer';

export default function SocialBarAd({ pageName }) {
  return (
    <AdContainer 
      adType="social_bar" 
      pageName={pageName}
      location="sidebar"
    />
  );
}