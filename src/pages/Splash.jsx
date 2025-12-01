import React, { useEffect } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

export default function Splash() {
  useEffect(() => {
    const checkSession = async () => {
      const lastLogin = localStorage.getItem('vagas_abertas_last_login');
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      
      // Se tem sessão válida (menos de 24h), vai direto para Home
      if (lastLogin) {
        const elapsed = Date.now() - parseInt(lastLogin);
        if (elapsed < SESSION_DURATION) {
          // Verifica se está autenticado
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
          // Sessão expirada, limpa
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

  // Tela de loading enquanto verifica
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] flex flex-col items-center justify-center">
      <div className="w-24 h-24 mb-6 animate-pulse">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/cbc7940a6_logoembranco.png" 
          alt="Vagas Abertas Paraíba" 
          className="w-full h-full object-contain"
        />
      </div>
      <p className="text-white/70 text-sm">Carregando...</p>
    </div>
  );
}