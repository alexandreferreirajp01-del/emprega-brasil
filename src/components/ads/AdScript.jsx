import React, { useEffect, useRef } from 'react';

export default function AdScript({ adType }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Limpar container
      containerRef.current.innerHTML = '';

      // Scripts diretos do AdsTerra
      const scripts = {
        popunder: '<script src="https://pl28444602.effectivegatecpm.com/72/ee/cd/72eecd4d68c9f39c279778e483c3f902.js"><\/script>',
        
        native_banner: '<script async="async" data-cfasync="false" src="https://pl28444604.effectivegatecpm.com/328bd49baf2bb1a30ceb5a98cef197ad/invoke.js"><\/script><div id="container-328bd49baf2bb1a30ceb5a98cef197ad"></div>',
        
        social_bar: '<script src="https://pl28444629.effectivegatecpm.com/70/81/18/708118f31f2ddd48f6ceaaa62c994562.js"><\/script>',
        
        banner_300x250: '<script>atOptions={"key":"8cf4c65b9747abef8b5e0ae459fbe4fb","format":"iframe","height":250,"width":300,"params":{}};<\/script><script src="https://www.highperformanceformat.com/8cf4c65b9747abef8b5e0ae459fbe4fb/invoke.js"><\/script>',
        
        banner_460x60: '<script>atOptions={"key":"78ac10ddcfa5199286b8135361511493","format":"iframe","height":60,"width":468,"params":{}};<\/script><script src="https://www.highperformanceformat.com/78ac10ddcfa5199286b8135361511493/invoke.js"><\/script>',
        
        banner_160x300: '<script>atOptions={"key":"7ffbe7ac452187cbc4f9a506052a73b3","format":"iframe","height":300,"width":160,"params":{}};<\/script><script src="https://www.highperformanceformat.com/7ffbe7ac452187cbc4f9a506052a73b3/invoke.js"><\/script>',
        
        banner_320x50: '<script>atOptions={"key":"dc451df2bafe779e9960db247896801d","format":"iframe","height":50,"width":320,"params":{}};<\/script><script src="https://www.highperformanceformat.com/dc451df2bafe779e9960db247896801d/invoke.js"><\/script>',
        
        banner_728x90: '<script>atOptions={"key":"fdffa60a70ba5cdfc588ad973d0af1a6","format":"iframe","height":90,"width":728,"params":{}};<\/script><script src="https://www.highperformanceformat.com/fdffa60a70ba5cdfc588ad973d0af1a6/invoke.js"><\/script>',
        
        banner_160x600: '<script>atOptions={"key":"3141ca7dda59035941769eb3a8dd0006","format":"iframe","height":600,"width":160,"params":{}};<\/script><script src="https://www.highperformanceformat.com/3141ca7dda59035941769eb3a8dd0006/invoke.js"><\/script>'
      };

      const html = scripts[adType];
      if (!html) return;

      // Parse e carregar
      const temp = document.createElement('div');
      temp.innerHTML = html;

      Array.from(temp.children).forEach(child => {
        if (child.tagName === 'SCRIPT') {
          const script = document.createElement('script');
          script.src = child.src;
          if (child.textContent) script.textContent = child.textContent;
          if (child.getAttribute('data-cfasync')) script.setAttribute('data-cfasync', child.getAttribute('data-cfasync'));
          if (child.async) script.async = true;
          containerRef.current.appendChild(script);
        } else {
          containerRef.current.appendChild(child.cloneNode(true));
        }
      });
    } catch (e) {
      console.error('Erro ao carregar anúncio:', e);
    }
  }, [adType]);

  return <div ref={containerRef} />;
}