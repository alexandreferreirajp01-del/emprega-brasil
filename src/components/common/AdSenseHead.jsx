import { useEffect } from 'react';

export default function AdSenseHead() {
  useEffect(() => {
    // Meta tag de verificação do AdSense
    if (!document.querySelector('meta[name="google-adsense-account"]')) {
      const meta = document.createElement('meta');
      meta.name = 'google-adsense-account';
      meta.content = 'ca-pub-8605408842983455';
      document.head.insertBefore(meta, document.head.firstChild);
    }

    // Script do AdSense
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8605408842983455';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, []);

  return null;
}