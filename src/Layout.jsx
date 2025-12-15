import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
          Home, Briefcase, User, Menu, X, 
          LogOut, Newspaper, Users, MessageCircle, Moon, Sun, Settings
        } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ErrorBoundary from "@/components/ErrorBoundary";
import FloatingButtons from "@/components/common/FloatingButtons";
import NativePermissionModal from "@/components/common/NativePermissionModal";
import PushManager from "@/components/push/PushManager";
import ServiceWorkerManager from "@/components/push/ServiceWorkerManager";
import NotificationBell from "@/components/notifications/NotificationBell";
import ApplyBasicPermissions from "@/components/common/ApplyBasicPermissions";
import CookieConsent from "@/components/common/CookieConsent";
import RouteGuard from "@/components/common/RouteGuard";
import NavigationFallback from "@/components/common/NavigationFallback";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [navItems, setNavItems] = useState([]);

  // Scroll para o topo ao mudar de página
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentPageName]);

  // Carregar itens de navegação e escutar mudanças
  useEffect(() => {
    const loadItems = () => {
      const defaultItems = [
        { name: 'Início', icon: Home, page: 'Home' },
        { name: 'Vagas', icon: Briefcase, page: 'Jobs' },
        { name: 'Utilidades', icon: Settings, page: 'Utilidades' },
        { name: 'Feed', icon: MessageCircle, page: 'Feed' },
        { name: 'Perfil', icon: User, page: 'Profile' },
      ];
      
      try {
        const pages = JSON.parse(localStorage.getItem('app_pages_v2') || '{}');
        const updatedItems = defaultItems.map(item => {
          const pageKey = `page_${item.page.toLowerCase()}`;
          if (pages[pageKey] && pages[pageKey].name) {
            return { ...item, name: pages[pageKey].name };
          }
          return item;
        });
        setNavItems(updatedItems);
      } catch (e) {
        setNavItems(defaultItems);
      }
    };

    // Carregar inicialmente
    loadItems();
    
    // Listener para atualizações
    const handleUpdate = () => {
      loadItems();
    };
    
    window.addEventListener('app_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('app_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Carregar e aplicar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
      updateThemeColor('#0f172a');
    } else {
      document.documentElement.classList.remove('dark');
      updateThemeColor('#FFFFFF');
    }
  }, []);

  // Função para atualizar a cor da barra de endereços
  const updateThemeColor = (color) => {
    // Atualizar ou criar meta tag theme-color
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color);

    // Atualizar meta tags para diferentes modos
    let metaThemeLight = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    if (!metaThemeLight) {
      metaThemeLight = document.createElement('meta');
      metaThemeLight.setAttribute('name', 'theme-color');
      metaThemeLight.setAttribute('media', '(prefers-color-scheme: light)');
      document.head.appendChild(metaThemeLight);
    }
    
    let metaThemeDark = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    if (!metaThemeDark) {
      metaThemeDark = document.createElement('meta');
      metaThemeDark.setAttribute('name', 'theme-color');
      metaThemeDark.setAttribute('media', '(prefers-color-scheme: dark)');
      document.head.appendChild(metaThemeDark);
    }
    
    if (color === '#0f172a') {
      metaThemeLight.setAttribute('content', '#FFFFFF');
      metaThemeDark.setAttribute('content', '#0f172a');
    } else {
      metaThemeLight.setAttribute('content', '#FFFFFF');
      metaThemeDark.setAttribute('content', '#0f172a');
    }
  };

  // Alternar tema
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateThemeColor('#0f172a'); // slate-900
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      updateThemeColor('#FFFFFF');
    }
  };

  // Pages that don't need layout
  const noLayoutPages = ['Splash', 'Login', 'Register'];
  const publicPages = ['Home', 'Jobs', 'JobDetail', 'News', 'NewsDetail', 'Groups', 'Subscription', 'About', 'Contact', 'FAQ', 'Terms', 'Privacy', 'Cookies', 'Security', 'LGPD', 'Advertise', 'Careers', 'Parcerias'];

  // Esconder botão Base44 edit no modo produção/APK - FORÇADO
  useEffect(() => {
    const hideBase44Button = () => {
      // Buscar TODOS os elementos que possam ser do Base44
      const selectors = [
        '[data-base44-edit]',
        '.base44-edit-button',
        '[class*="base44"]',
        'iframe[src*="base44"]',
        '#base44-widget'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; height: 0 !important; width: 0 !important;';
        });
      });
      
      // Buscar por texto "Edit with Base44"
      document.querySelectorAll('button, div, span, a').forEach(el => {
        if (el.textContent?.includes('Edit') && el.textContent?.includes('Base44')) {
          el.style.cssText = 'display: none !important; visibility: hidden !important;';
          if (el.parentElement) {
            el.parentElement.style.cssText = 'display: none !important; visibility: hidden !important;';
          }
        }
      });
      
      // Esconder botões fixos no bottom que não são do app
      document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
        if (el.textContent?.includes('Base44') || el.textContent?.includes('Edit with')) {
          el.style.cssText = 'display: none !important;';
        }
      });
    };
    
    // Executar imediatamente
    hideBase44Button();
    
    // Executar após um delay para pegar elementos carregados depois
    setTimeout(hideBase44Button, 500);
    setTimeout(hideBase44Button, 1000);
    setTimeout(hideBase44Button, 2000);
    
    // Observer para mudanças no DOM
    const observer = new MutationObserver(hideBase44Button);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    // Interval como backup
    const interval = setInterval(hideBase44Button, 3000);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (!isAuthenticated) {
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Erro ao verificar autenticação
      }
    };
    checkAuth();
  }, []);

  if (noLayoutPages.includes(currentPageName)) {
    return children;
  }

  const isAdmin = user?.email === 'alexandreferreirajp01@gmail.com' || user?.role === 'admin' || user?.subscription_type === 'admin';
  
  // Verificar acesso premium (para mensagens)
  const hasPremiumAccess = user?.subscription_type === 'premium' || 
    user?.subscription_type === 'admin' || 
    user?.subscription_type === 'recruiter' ||
    user?.role === 'admin';
  
  // Verificar se pode usar currículo (apenas Premium)
  const canUseResume = user?.subscription_type === 'premium';

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = createPageUrl('Splash');
  };

  // Bloquear tradução no HTML root
    useEffect(() => {
      // Aplicar atributos anti-tradução no HTML e body
      document.documentElement.setAttribute('translate', 'no');
      document.documentElement.setAttribute('lang', 'pt-BR');
      document.documentElement.classList.add('notranslate');
      document.body.setAttribute('translate', 'no');
      document.body.classList.add('notranslate');

      // Criar meta tags de bloqueio se não existirem
      const metaTags = [
        { name: 'google', content: 'notranslate' },
        { name: 'googlebot', content: 'notranslate' },
        { httpEquiv: 'Content-Language', content: 'pt-BR' },
      ];

      metaTags.forEach(meta => {
        const selector = meta.name ? `meta[name="${meta.name}"]` : `meta[http-equiv="${meta.httpEquiv}"]`;
        if (!document.querySelector(selector)) {
          const tag = document.createElement('meta');
          if (meta.name) tag.setAttribute('name', meta.name);
          if (meta.httpEquiv) tag.setAttribute('http-equiv', meta.httpEquiv);
          tag.setAttribute('content', meta.content);
          document.head.appendChild(tag);
        }
      });

      // Bloquear eventos de tradução
      const blockTranslation = (e) => {
        if (e.type === 'DOMNodeInserted' && e.target.nodeName === 'FONT') {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      document.addEventListener('DOMNodeInserted', blockTranslation, true);

      return () => {
        document.removeEventListener('DOMNodeInserted', blockTranslation, true);
      };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col notranslate transition-colors duration-300" translate="no" lang="pt-BR">
      {/* Fallback de navegação anti-tela-branca */}
      <NavigationFallback />

      {/* Service Worker Manager - registra SW inline */}
      <ServiceWorkerManager />

      {/* Modal Nativo de Permissões */}
      <NativePermissionModal />

      {/* Aplicar permissões básicas automaticamente */}
      <ApplyBasicPermissions user={user} />
      {/* PWA/APK Meta Tags - Injeta no head */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="theme-color" content="#FFFFFF" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#FFFFFF" />
      <meta name="msapplication-navbutton-color" content="#FFFFFF" />
      <meta name="msapplication-TileColor" content="#FFFFFF" />
      <meta name="application-name" content="Vagas Abertas PB" />
      <meta name="apple-mobile-web-app-title" content="Vagas Abertas PB" />
      {/* Bloqueio total de tradução - todos os navegadores */}
      <meta name="google" content="notranslate" />
      <meta name="googlebot" content="notranslate" />
      <meta httpEquiv="Content-Language" content="pt-BR" />
      <style>{`
        /* Safe area para notch de celulares */
        :root {
          --sat: env(safe-area-inset-top, 0px);
          --sar: env(safe-area-inset-right, 0px);
          --sab: env(safe-area-inset-bottom, 0px);
          --sal: env(safe-area-inset-left, 0px);
          --primary-color: #0A66C2;
        }

        /* Force primary color consistency */
        .bg-primary,
        [class*="bg-blue"],
        [class*="bg-indigo"],
        [style*="background: blue"],
        [style*="background: rgb(0, 86, 255)"] {
          background-color: #0A66C2 !important;
          background-image: none !important;
        }
        
        .safe-area-top { padding-top: var(--sat); }
        .safe-area-bottom { padding-bottom: var(--sab); }
        .pb-safe { padding-bottom: max(1rem, var(--sab)); }
        .pb-nav { padding-bottom: calc(4rem + var(--sab)); }
        
/* Esconder elementos Base44 */
        [data-base44-edit],
        .base44-edit-button,
        #base44-widget,
        .base44-floating-button {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Mobile optimizations */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
        
        input, textarea, select {
          font-size: 16px !important; /* Previne zoom no iOS */
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Remove scrollbar em mobile */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            width: 0;
            height: 0;
          }
        }
        
        /* Status bar style for PWA */
        @media (display-mode: standalone) {
          body {
            padding-top: var(--sat);
          }
        }
      `}</style>
      {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-40 transition-colors duration-300" translate="no">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src={(() => {
                    try {
                      const config = JSON.parse(localStorage.getItem('app_config_v2') || '{}');
                      return config.logoUrl || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg';
                    } catch {
                      return 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg';
                    }
                  })()} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-bold text-[#1D2226] dark:text-white leading-tight transition-colors">
                  {(() => {
                    try {
                      const config = JSON.parse(localStorage.getItem('app_config_v2') || '{}');
                      return config.appName || 'Vagas Abertas';
                    } catch {
                      return 'Vagas Abertas';
                    }
                  })()}
                </span>
                <span className="text-sm text-[#0A66C2] dark:text-blue-400 font-medium transition-colors">
                  {(() => {
                    try {
                      const config = JSON.parse(localStorage.getItem('app_config_v2') || '{}');
                      return config.appSubtitle || 'Paraíba';
                    } catch {
                      return 'Paraíba';
                    }
                  })()}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-wrap max-w-[60%]">
              {navItems.map((item) => (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <Button 
                    variant={currentPageName === item.page ? "secondary" : "ghost"}
                    className={`rounded-xl text-sm px-3 py-2 h-auto whitespace-nowrap transition-colors ${currentPageName === item.page ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-[#1D2226] dark:text-slate-200'}`}
                  >
                    <item.icon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}
                  </nav>

            {/* User Actions */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="text-[#1D2226] dark:text-white rounded-xl"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              {user ? (
                <>
                  <NotificationBell user={user} />
                  <Link to={createPageUrl('Profile')}>
                    <Button variant="outline" className="rounded-xl text-sm px-3 text-[#1D2226] dark:text-white border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <User className="w-4 h-4 mr-1.5" />
                      Perfil
                    </Button>
                  </Link>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    sessionStorage.setItem('needs_login', 'true');
                    window.location.href = createPageUrl('Splash');
                  }}
                  className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-sm px-6 font-semibold"
                >
                  Entrar
                </Button>
              )}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <div className="lg:hidden flex items-center gap-1">
              {user && <NotificationBell user={user} />}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="text-[#1D2226] dark:text-white"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#1D2226] dark:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white dark:bg-slate-800 dark:border-slate-700 transition-colors">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.page} 
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button 
                    variant={currentPageName === item.page ? "secondary" : "ghost"}
                    className={`w-full justify-start rounded-xl transition-colors ${currentPageName === item.page ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'dark:text-slate-200'}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              ))}

              <div className="pt-2 border-t dark:border-slate-700">
                {user ? (
                  <>
                    <Link to={createPageUrl('Profile')} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-xl mb-2 dark:border-slate-600 dark:text-white">
                        <User className="w-5 h-5 mr-3" />
                        Meu Perfil
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full text-red-600 dark:text-red-400 rounded-xl"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <Link to={createPageUrl('Splash')} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold">
                      Entrar / Cadastrar
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-nav">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer - Completo e AdSense Ready */}
      <footer className="bg-slate-800 dark:bg-slate-950 text-white py-12 hidden md:block transition-colors" translate="no">
        <div className="max-w-7xl mx-auto px-4">
          {/* Criador e Foto */}
          <div className="text-center mb-10">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/60fbd7fb5_Screenshot_20251104-2348032.png"
              alt="Alexandre Ferreira"
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white/10 shadow-xl"
            />
            <h3 className="text-xl font-bold text-white mb-2">Alexandre Ferreira</h3>
            <p className="text-slate-300 text-sm mb-1">Criador & Desenvolvedor</p>
            <p className="text-slate-400 text-sm">CNPJ: 62.874.724/0001-11</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <a href="mailto:rhvagasabertasparaiba@gmail.com" className="text-slate-300 hover:text-white transition-colors text-sm">
                rhvagasabertasparaiba@gmail.com
              </a>
              <span className="text-slate-600">•</span>
              <a 
                href="https://wa.me/5583991971320" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                (83) 99197-1320
              </a>
            </div>
          </div>

          {/* Links Organizados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 max-w-5xl mx-auto">
            <div>
              <h4 className="font-semibold mb-3 text-white">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to={createPageUrl('Privacy')} className="block text-slate-400 hover:text-white transition-colors">Política de Privacidade</Link>
                <Link to={createPageUrl('Terms')} className="block text-slate-400 hover:text-white transition-colors">Termos de Uso</Link>
                <Link to={createPageUrl('Cookies')} className="block text-slate-400 hover:text-white transition-colors">Política de Cookies</Link>
                <Link to={createPageUrl('Security')} className="block text-slate-400 hover:text-white transition-colors">Política de Segurança</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white">Empresa</h4>
              <div className="space-y-2 text-sm">
                <Link to={createPageUrl('About')} className="block text-slate-400 hover:text-white transition-colors">Sobre Nós</Link>
                <Link to={createPageUrl('Contact')} className="block text-slate-400 hover:text-white transition-colors">Contato</Link>
                <Link to={createPageUrl('Careers')} className="block text-slate-400 hover:text-white transition-colors">Trabalhe Conosco</Link>
                <Link to={createPageUrl('Parcerias')} className="block text-slate-400 hover:text-white transition-colors">Parcerias</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white">Recursos</h4>
              <div className="space-y-2 text-sm">
                <Link to={createPageUrl('FAQ')} className="block text-slate-400 hover:text-white transition-colors">FAQ</Link>
                <Link to={createPageUrl('LGPD')} className="block text-slate-400 hover:text-white transition-colors">LGPD – Seus Direitos</Link>
                <Link to={createPageUrl('Groups')} className="block text-slate-400 hover:text-white transition-colors">Grupos WhatsApp</Link>
                <Link to={createPageUrl('News')} className="block text-slate-400 hover:text-white transition-colors">Notícias</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white">Anuncie</h4>
              <div className="space-y-2 text-sm">
                <Link to={createPageUrl('Advertise')} className="block text-slate-400 hover:text-white transition-colors">Anunciar Conosco</Link>
                <Link to={createPageUrl('Subscription')} className="block text-slate-400 hover:text-white transition-colors">Planos</Link>
                <a href="mailto:rhvagasabertasparaiba@gmail.com" className="block text-slate-400 hover:text-white transition-colors">Suporte</a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-700 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
              <p>© {new Date().getFullYear()} Vagas Abertas Paraíba. Todos os direitos reservados.</p>
              <div className="flex items-center gap-4">
                <span>Made with ❤️ in Paraíba</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shadow-lg z-40 safe-area-bottom transition-colors" translate="no">
        <div className="flex items-center justify-around h-16 pb-safe">
          {navItems.slice(0, 5).map((item) => (
            <Link 
              key={item.page} 
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 transition-colors ${
                currentPageName === item.page ? 'text-[#0A66C2] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5 mb-0.5 flex-shrink-0" />
              <span className="text-[10px] truncate max-w-full">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Buttons */}
      <FloatingButtons />

      {/* Cookie Consent */}
      <CookieConsent />
      </div>
      );
      }