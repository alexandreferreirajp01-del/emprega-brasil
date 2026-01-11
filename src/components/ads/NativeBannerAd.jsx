import React from 'react';
import AdContainer from './AdContainer';

export default function NativeBannerAd({ className = '' }) {
  return <AdContainer adType="native_banner" className={className} />;
}