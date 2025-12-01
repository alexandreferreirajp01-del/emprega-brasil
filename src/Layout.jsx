import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, Briefcase, Users, Crown, User, Menu, X, 
  Shield, Rss, LogOut, MessageCircle, Newspaper, Info, Handshake, Sparkles, Home as HomeIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ErrorBoundary from "@/components/ErrorBoundary";
import FloatingButtons from "@/components/common/FloatingButtons";
import PermissionPrompt from "@/components/common/PermissionPrompt";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pages that don't need layout
  const noLayoutPages = ['Splash', 'Login', 'Register'];

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
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (!isAuthenticated) {
          setIsVisitor(true);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  if (noLayoutPages.includes(currentPageName)) {
    return children;
  }

  const isAdmin = user?.email === 'alexandreferreirajp01@gmail.com' || user?.role === 'admin' || user?.subscription_type === 'admin';

  const navItems = [
            { name: 'Início', icon: Home, page: 'Home' },
            { name: 'Vagas', icon: Briefcase, page: 'Jobs' },
            { name: 'Social', icon: Users, page: 'Social' },
            { name: 'Notícias', icon: Newspaper, page: 'News' },
            { name: 'Perfil', icon: User, page: 'Profile' },
          ];

          // Adicionar Mensagens ao menu se tiver plano
          const hasSubscription = user?.subscription_type === 'basic' || user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin';

      // Mostrar Planos apenas para visitantes e básicos
      const showSubscription = !user || isVisitor || (user && user.subscription_type !== 'premium' && user.subscription_type !== 'admin' && user.role !== 'admin');

      if (showSubscription) {
        navItems.push({ name: 'Planos', icon: Crown, page: 'Subscription' });
      }

  const handleLogout = () => {
    localStorage.removeItem('vagas_abertas_visitor_mode');
    window.location.href = createPageUrl('Splash');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* PWA/APK Meta Tags - Injeta no head */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#0056ff" />
      <meta name="application-name" content="Vagas Abertas PB" />
      <meta name="apple-mobile-web-app-title" content="Vagas Abertas PB" />
      <meta name="google" content="notranslate" />
      <style>{`
        /* Safe area para notch de celulares */
        :root {
          --sat: env(safe-area-inset-top, 0px);
          --sar: env(safe-area-inset-right, 0px);
          --sab: env(safe-area-inset-bottom, 0px);
          --sal: env(safe-area-inset-left, 0px);
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
      <header className="bg-white shadow-sm sticky top-0 z-40" translate="no">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg" 
                  alt="Vagas Abertas Paraíba" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">Vagas Abertas</span>
                <span className="text-sm text-[#0056ff] font-medium">Paraíba</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-wrap max-w-[60%]">
              {navItems.map((item) => (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <Button 
                    variant={currentPageName === item.page ? "secondary" : "ghost"}
                    className={`rounded-xl text-sm px-3 py-2 h-auto whitespace-nowrap ${currentPageName === item.page ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                  >
                    <item.icon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}

              {isAdmin && (
                <>
                  <Link to={createPageUrl('Admin')}>
                    <Button 
                      variant={currentPageName === 'Admin' ? "secondary" : "ghost"}
                      className={`rounded-xl text-sm px-3 py-2 h-auto whitespace-nowrap ${currentPageName === 'Admin' ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                    >
                      <Shield className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span>Admin</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('PostarVaga')}>
                    <Button 
                      variant={currentPageName === 'PostarVaga' ? "secondary" : "ghost"}
                      className={`rounded-xl text-sm px-3 py-2 h-auto whitespace-nowrap ${currentPageName === 'PostarVaga' ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                    >
                      <Briefcase className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span>Postar</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('VagasPorIA')}>
                    <Button 
                      variant={currentPageName === 'VagasPorIA' ? "secondary" : "ghost"}
                      className={`rounded-xl text-sm px-3 py-2 h-auto whitespace-nowrap ${currentPageName === 'VagasPorIA' ? 'bg-purple-100 text-purple-700' : ''}`}
                    >
                      <Sparkles className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span>IA</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('VagasHomeOffice')}>
                      <Button 
                        variant={currentPageName === 'VagasHomeOffice' ? "secondary" : "ghost"}
                        className={`rounded-xl text-sm px-3 py-2 h-auto whitespace-nowrap ${currentPageName === 'VagasHomeOffice' ? 'bg-green-100 text-green-700' : ''}`}
                      >
                        <HomeIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                        <span>Home Office</span>
                      </Button>
                    </Link>
                    </>
                    )}
                  </nav>

            {/* User Actions */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {!isVisitor && user && (
                <NotificationBell user={user} />
              )}
              {isVisitor ? (
                <Link to={createPageUrl('Splash')}>
                  <Button className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl text-sm px-4">
                    Entrar
                  </Button>
                </Link>
              ) : (
                <Link to={createPageUrl('Profile')}>
                  <Button variant="outline" className="rounded-xl text-sm px-3">
                    <User className="w-4 h-4 mr-1.5" />
                    Perfil
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile/Tablet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.page} 
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button 
                    variant={currentPageName === item.page ? "secondary" : "ghost"}
                    className={`w-full justify-start rounded-xl ${currentPageName === item.page ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              ))}

              <Link to={createPageUrl('Groups')} onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={currentPageName === 'Groups' ? "secondary" : "ghost"}
                  className={`w-full justify-start rounded-xl ${currentPageName === 'Groups' ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                >
                  <Users className="w-5 h-5 mr-3" />
                  Grupos
                </Button>
              </Link>
              
              {isAdmin && (
                <>
                  <Link to={createPageUrl('Admin')} onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={currentPageName === 'Admin' ? "secondary" : "ghost"}
                      className={`w-full justify-start rounded-xl ${currentPageName === 'Admin' ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                    >
                      <Shield className="w-5 h-5 mr-3" />
                      Admin
                    </Button>
                  </Link>
                  <Link to={createPageUrl('PostarVaga')} onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={currentPageName === 'PostarVaga' ? "secondary" : "ghost"}
                      className={`w-full justify-start rounded-xl ${currentPageName === 'PostarVaga' ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                    >
                      <Briefcase className="w-5 h-5 mr-3" />
                      Postar Vaga
                    </Button>
                  </Link>
                  <Link to={createPageUrl('VagasPorIA')} onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={currentPageName === 'VagasPorIA' ? "secondary" : "ghost"}
                      className={`w-full justify-start rounded-xl ${currentPageName === 'VagasPorIA' ? 'bg-purple-100 text-purple-700' : ''}`}
                    >
                      <Sparkles className="w-5 h-5 mr-3" />
                      Vagas por IA
                    </Button>
                  </Link>
                  <Link to={createPageUrl('VagasHomeOffice')} onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant={currentPageName === 'VagasHomeOffice' ? "secondary" : "ghost"}
                        className={`w-full justify-start rounded-xl ${currentPageName === 'VagasHomeOffice' ? 'bg-green-100 text-green-700' : ''}`}
                      >
                        <HomeIcon className="w-5 h-5 mr-3" />
                        Vagas Home Office
                      </Button>
                    </Link>
                    </>
                    )}

              <div className="pt-2 border-t">
                {isVisitor ? (
                  <Link to={createPageUrl('Splash')} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                      Entrar
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to={createPageUrl('Profile')} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-xl mb-2">
                        <User className="w-5 h-5 mr-3" />
                        Meu Perfil
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full text-red-600 rounded-xl"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sair
                    </Button>
                  </>
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

      {/* Footer - Desktop Only */}
      <footer className="hidden md:block bg-slate-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-6 h-6 text-[#0056ff]" />
                <span className="font-bold">Vagas Abertas Paraíba</span>
              </div>
              <p className="text-slate-400 text-sm">
                Conectando talentos e oportunidades no estado da Paraíba.
              </p>
            </div>
            <div>
                                  <h4 className="font-semibold mb-4">Links Úteis</h4>
                                  <div className="space-y-2 text-sm">
                                    <Link to={createPageUrl('Groups')} className="block text-slate-400 hover:text-white">Grupos</Link>
                                    <Link to={createPageUrl('Parcerias')} className="block text-slate-400 hover:text-white">Parcerias</Link>
                                    <Link to={createPageUrl('About')} className="block text-slate-400 hover:text-white">Sobre Nós</Link>
                                    <Link to={createPageUrl('Terms')} className="block text-slate-400 hover:text-white">Termos de Uso</Link>
                                    <Link to={createPageUrl('Privacy')} className="block text-slate-400 hover:text-white">Política de Privacidade</Link>
                                  </div>
                                </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>WhatsApp: (83) 99197-1320</p>
                <p>E-mail: alexandreferreirajp01@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} Vagas Abertas Paraíba. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 safe-area-bottom" translate="no">
        <div className="flex items-center justify-around h-16 pb-safe">
          {navItems.slice(0, 5).map((item) => (
            <Link 
              key={item.page} 
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 ${
                currentPageName === item.page ? 'text-[#0056ff]' : 'text-slate-500'
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

      {/* Permission Prompt - aparece na primeira instalação */}
      <PermissionPrompt />
      </div>
      );
      }