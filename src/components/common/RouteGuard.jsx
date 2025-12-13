import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

// Páginas públicas que não precisam de autenticação
const PUBLIC_PAGES = [
  'Splash', 'Home', 'Jobs', 'JobDetail', 'News', 'NewsDetail', 
  'Groups', 'Subscription', 'About', 'Contact', 'FAQ', 
  'Terms', 'Privacy', 'Cookies', 'Security', 'LGPD', 
  'Advertise', 'Careers', 'Parcerias', 'Login', 'Register',
  'ForgotPassword', 'ResetPassword'
];

// Páginas que exigem Premium
const PREMIUM_PAGES = [
  'Utilidades', 'BibliotecaProfissional', 'ProfessionalResume'
];

export default function RouteGuard({ children, currentPageName }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    const validateRoute = async () => {
      try {
        // Salvar última rota válida
        const lastValidRoute = localStorage.getItem('last_valid_route');
        
        // Se é página pública, liberar imediatamente
        if (PUBLIC_PAGES.includes(currentPageName)) {
          localStorage.setItem('last_valid_route', currentPageName);
          setCanAccess(true);
          setChecking(false);
          return;
        }

        // Verificar autenticação
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          // Não autenticado tentando acessar página restrita
          console.log('Usuário não autenticado, redirecionando...');
          sessionStorage.setItem('needs_login', 'true');
          sessionStorage.setItem('redirect_after_login', currentPageName);
          window.location.replace(createPageUrl('Splash'));
          return;
        }

        // Buscar dados do usuário
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Verificar se é página premium
        if (PREMIUM_PAGES.includes(currentPageName)) {
          const hasPremium = currentUser.subscription_type === 'premium' || 
                            currentUser.subscription_type === 'admin' ||
                            currentUser.subscription_type === 'recruiter' ||
                            currentUser.role === 'admin';
          
          if (!hasPremium) {
            console.log('Usuário não tem premium, redirecionando...');
            // Redirecionar para planos ou home
            const fallbackRoute = lastValidRoute && PUBLIC_PAGES.includes(lastValidRoute) 
              ? lastValidRoute 
              : 'Home';
            window.location.replace(createPageUrl(fallbackRoute));
            return;
          }
        }

        // Validações adicionais de permissões podem ser adicionadas aqui
        
        // Tudo OK, permitir acesso
        localStorage.setItem('last_valid_route', currentPageName);
        setCanAccess(true);
        
      } catch (e) {
        console.error('Erro ao validar rota:', e);
        // Em caso de erro, redirecionar para home
        window.location.replace(createPageUrl('Home'));
      } finally {
        setChecking(false);
      }
    };

    validateRoute();
  }, [currentPageName]);

  // Listener para botão voltar do navegador
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('Botão voltar pressionado');
      
      // Verificar se a rota atual é válida
      const currentRoute = window.location.pathname;
      
      // Se estiver em página de login/splash, voltar para home
      if (currentRoute.includes('Splash') || currentRoute.includes('Login')) {
        event.preventDefault();
        sessionStorage.removeItem('needs_login');
        window.location.replace(createPageUrl('Home'));
        return;
      }

      // Tentar recuperar última rota válida
      const lastValidRoute = localStorage.getItem('last_valid_route');
      
      // Se a navegação falhar, redirecionar para última rota válida ou home
      setTimeout(() => {
        if (!document.body.innerHTML || document.body.innerHTML.trim() === '') {
          console.log('Detectada tela branca, redirecionando...');
          const fallback = lastValidRoute || 'Home';
          window.location.replace(createPageUrl(fallback));
        }
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fallback anti-tela-branca
  useEffect(() => {
    const checkBlankScreen = setInterval(() => {
      const bodyContent = document.body.innerHTML;
      const isBlank = !bodyContent || bodyContent.trim() === '' || 
                      bodyContent.length < 100;
      
      if (isBlank && !checking) {
        console.log('Tela branca detectada, aplicando fallback...');
        clearInterval(checkBlankScreen);
        const lastValidRoute = localStorage.getItem('last_valid_route') || 'Home';
        window.location.replace(createPageUrl(lastValidRoute));
      }
    }, 500);

    // Limpar após 5 segundos (página já deve estar carregada)
    setTimeout(() => clearInterval(checkBlankScreen), 5000);

    return () => clearInterval(checkBlankScreen);
  }, [checking]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
}