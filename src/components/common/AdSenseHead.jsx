import { Helmet } from 'react-helmet';

export default function AdSenseHead() {
  return (
    <>
      <Helmet>
        {/* Meta tag de verificação do AdSense */}
        <meta name="google-adsense-account" content="ca-pub-7840722837940648" />
        
        {/* Script do AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7840722837940648"
          crossOrigin="anonymous"
        />
        
        {/* Script AMP Auto Ads */}
        <script
          async
          custom-element="amp-auto-ads"
          src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js"
        />
        
        {/* Meta adicional para robots */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Helmet>
      
      {/* AMP Auto Ads Component - renderizado no body */}
      <amp-auto-ads 
        type="adsense"
        data-ad-client="ca-pub-7840722837940648"
      />
    </>
  );
}