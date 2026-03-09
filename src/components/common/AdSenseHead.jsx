import { Helmet } from 'react-helmet';

export default function AdSenseHead() {
  return (
    <Helmet>
      {/* Meta tag de verificação do AdSense */}
      <meta name="google-adsense-account" content="ca-pub-8005400849298455" />
      
      {/* Script do AdSense - Anúncios Automáticos */}
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8005400849298455"
        crossOrigin="anonymous"
      />
      
      {/* Meta para robots */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
    </Helmet>
  );
}