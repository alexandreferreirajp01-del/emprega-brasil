import { useEffect } from 'react';

export default function AdSenseHead() {
  useEffect(() => {
    // Injetar meta tag de verificação do AdSense
    const metaAdSense = document.createElement('meta');
    metaAdSense.name = 'google-adsense-account';
    metaAdSense.content = 'ca-pub-7840722837940648';
    
    // Verificar se já existe antes de adicionar
    const existingMeta = document.querySelector('meta[name="google-adsense-account"]');
    if (!existingMeta) {
      document.head.appendChild(metaAdSense);
    }

    // Injetar script do AdSense
    const scriptAdSense = document.createElement('script');
    scriptAdSense.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7840722837940648';
    scriptAdSense.async = true;
    scriptAdSense.crossOrigin = 'anonymous';
    
    // Verificar se já existe antes de adicionar
    const existingScript = document.querySelector('script[src*="adsbygoogle"]');
    if (!existingScript) {
      document.head.appendChild(scriptAdSense);
    }

    // Adicionar dados estruturados para o Google
    const metaVerification = document.createElement('meta');
    metaVerification.name = 'google-site-verification';
    metaVerification.content = 'ca-pub-7840722837940648';
    
    const existingVerification = document.querySelector('meta[name="google-site-verification"]');
    if (!existingVerification) {
      document.head.appendChild(metaVerification);
    }

    return () => {
      // Cleanup não necessário - mantemos os scripts
    };
  }, []);

  return null; // Componente não renderiza nada
}