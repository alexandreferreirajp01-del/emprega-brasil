import React, { useEffect, useState } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

export default function Splash() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const checkSession = async () => {
      const lastLogin = localStorage.getItem('vagas_abertas_last_login');
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      
      // Se tem sessão válida (menos de 24h), vai direto para Home
      if (lastLogin) {
        const elapsed = Date.now() - parseInt(lastLogin);
        if (elapsed < SESSION_DURATION) {
          try {
            const isAuth = await base44.auth.isAuthenticated();
            if (isAuth) {
              window.location.href = createPageUrl('Home');
              return;
            }
          } catch (e) {
            // Se erro, continua para login
          }
        } else {
          localStorage.removeItem('vagas_abertas_last_login');
        }
      }
      
      // Se é visitante, vai direto
      if (visitorMode === 'true') {
        window.location.href = createPageUrl('Home');
        return;
      }
      
      // Primeira vez: faz login e salva timestamp
      localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
      base44.auth.redirectToLogin(createPageUrl('Home'));
    };
    
    checkSession();
  }, []);

  // Tela de loading minimalista - sem logo branca
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
      <p className="text-white/80 text-sm font-medium">Carregando...</p>
    </div>
  );
}