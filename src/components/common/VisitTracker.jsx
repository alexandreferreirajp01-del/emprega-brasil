import { useEffect } from 'react';
import { base44 } from "@/api/base44Client";

export default function VisitTracker({ pageName, user }) {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Gerar ou recuperar ID do visitante
        let visitorId = localStorage.getItem('vagas_visitor_id');
        if (!visitorId) {
          visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('vagas_visitor_id', visitorId);
        }

        // Gerar ou recuperar ID da sessão
        let sessionId = sessionStorage.getItem('vagas_session_id');
        if (!sessionId) {
          sessionId = `s_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem('vagas_session_id', sessionId);
        }

        // Verificar se já registrou esta página nesta sessão
        const visitedPages = JSON.parse(sessionStorage.getItem('vagas_visited_pages') || '[]');
        if (visitedPages.includes(pageName)) {
          return; // Já registrou esta página nesta sessão
        }

        // Detectar dispositivo
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isTablet = /iPad|Android/i.test(navigator.userAgent) && !(/Mobile/i.test(navigator.userAgent));
        const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

        // Detectar navegador
        const getBrowser = () => {
          const ua = navigator.userAgent;
          if (ua.includes('Chrome')) return 'Chrome';
          if (ua.includes('Firefox')) return 'Firefox';
          if (ua.includes('Safari')) return 'Safari';
          if (ua.includes('Edge')) return 'Edge';
          if (ua.includes('Opera')) return 'Opera';
          return 'Outro';
        };

        // Obter dados de localização via IP
        let geoData = {};
        try {
          const geoResponse = await fetch('https://ipapi.co/json/');
          if (geoResponse.ok) {
            const geo = await geoResponse.json();
            geoData = {
              city: geo.city || '',
              state: geo.region || '',
              country: geo.country_name || 'Brasil',
              latitude: geo.latitude,
              longitude: geo.longitude,
              ip_address: geo.ip
            };
          }
        } catch (e) {
          console.log('Geolocation não disponível');
        }

        // Registrar visita
        await base44.entities.AppVisit.create({
          visitor_id: visitorId,
          user_email: user?.email || '',
          page: pageName,
          device_type: deviceType,
          browser: getBrowser(),
          referrer: document.referrer || '',
          session_id: sessionId,
          ...geoData
        });

        // Marcar página como visitada nesta sessão
        visitedPages.push(pageName);
        sessionStorage.setItem('vagas_visited_pages', JSON.stringify(visitedPages));

      } catch (e) {
        console.log('Erro ao registrar visita:', e);
      }
    };

    trackVisit();
  }, [pageName, user?.email]);

  return null;
}