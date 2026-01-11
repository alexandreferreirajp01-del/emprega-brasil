import React from 'react';
import AdContainer from './AdContainer';

export default function BannerAd({ size = '300x250', className = '' }) {
  const adTypeMap = {
    '728x90': 'banner_728x90',
    '320x50': 'banner_320x50',
    '300x250': 'banner_300x250',
    '160x600': 'banner_160x600',
    '160x300': 'banner_160x300',
    '460x60': 'banner_460x60',
  };

  const adType = adTypeMap[size] || 'banner_300x250';
  return <AdContainer adType={adType} className={className} />;
}