import { useEffect } from 'react';

const CLIENT_ID = 'ca-pub-8605408842983455';

export default function AdSenseHead() {
  useEffect(() => {
    // Meta tag de verificação do AdSense
    if (!document.querySelector('meta[name="google-adsense-account"]')) {
      const meta = document.createElement('meta');
      meta.name = 'google-adsense-account';
      meta.content = CLIENT_ID;
      document.head.insertBefore(meta, document.head.firstChild);
    }

    // Script do AdSense — só injeta uma vez, antes de qualquer outro script
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;
      script.crossOrigin = 'anonymous';
      // Inserir como primeiro script para carregar o mais cedo possível
      const firstScript = document.querySelector('script');
      if (firstScript) {
        document.head.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }
  }, []);

  return null;
}