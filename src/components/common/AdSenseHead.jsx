import { Helmet } from 'react-helmet';

export default function AdSenseHead() {
  return (
    <Helmet>
      {/* Meta tag de verificação do AdSense */}
      <meta name="google-adsense-account" content="ca-pub-7840722837940648" />
      
      {/* Script do AdSense */}
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7840722837940648"
        crossOrigin="anonymous"
      />
      
      {/* Meta adicional para robots */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Helmet>
  );
}