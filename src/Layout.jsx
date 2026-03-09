import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
        Home, Briefcase, User, Menu, X, 
        LogOut, Newspaper, Users, MessageCircle, Moon, Sun, Settings, Bot, ArrowLeft, ChevronRight, PlusCircle, Sparkles, FileText, Wrench, AlertTriangle, BookOpen
      } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FloatingButtons from "@/components/common/FloatingButtons";
import AdSenseHead from "@/components/common/AdSenseHead";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import SupportButton from "@/components/support/SupportButton";
import NativePermissionModal from "@/components/common/NativePermissionModal";
import PushManager from "@/components/push/PushManager";
import PopupManager from "@/components/common/PopupManager";
import ServiceWorkerManager from "@/components/push/ServiceWorkerManager";
import NotificationBell from "@/components/notifications/NotificationBell";
import ApplyBasicPermissions from "@/components/common/ApplyBasicPermissions";
import CookieConsent from "@/components/common/CookieConsent";
import RouteGuard from "@/components/common/RouteGuard";
import NavigationFallback from "@/components/common/NavigationFallback";
import PopunderAd from "@/components/ads/PopunderAd";
import SocialBarAd from "@/components/ads/SocialBarAd";
import BannerAd from "@/components/ads/BannerAd";
import WelcomePopup from "@/components/common/WelcomePopup";


const vagasSubmenuItems = [
  { id: 'gerenciar-vagas', name: 'Gerenciador de Vagas', icon: Briefcase, color: 'indigo', page: 'GerenciarVagas', description: 'Central única de controle e manutenção', roles: ['admin', 'dono'] },
  { id: 'gerenciador-filtros', name: 'Gerenciador de Filtros', icon: Settings, color: 'slate', page: 'GerenciadorFiltros', description: 'Gerenciar categorias, funções, tipos de vaga e filtros', permissionId: 'gerenciador_filtros' },
  { id: 'postar-vaga', name: 'Postar Vagas', icon: PlusCircle, color: 'blue', page: 'PostarVaga', description: 'Criar novas vagas de emprego', permissionId: 'postar_vagas' },
  { id: 'posts-massa', name: 'Posts em Massa', icon: Sparkles, color: 'purple', page: 'PostsEmMassa', description: 'Upload múltiplas imagens e extraia vagas com IA', permissionId: 'posts_massa' },
  { id: 'posts-massa-txt', name: 'Posts em Massa TXT', icon: FileText, color: 'indigo', page: 'PostsEmMassaTXT', description: 'Upload arquivos TXT/DOC/PDF e extraia até 50 vagas', permissionId: 'posts_massa_txt' },
  { id: 'vagas-ia', name: 'Vagas por IA', icon: Sparkles, color: 'violet', page: 'VagasPorIA', description: 'Gerar vagas com inteligência artificial', permissionId: 'vagas_ia' },
  { id: 'vagas-home', name: 'Vagas Home Office', icon: Home, color: 'teal', page: 'VagasHomeOffice', description: 'Publicar vagas remotas', permissionId: 'vagas_home_office' },
];

const colorClasses = {
  indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600',
  slate: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600',
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600',
  violet: 'bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600',
  teal: 'bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600',
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [showVagasSubmenu, setShowVagasSubmenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Rotas que são consideradas "filhas" e devem mostrar botão voltar
  const childRoutes = ['JobDetail', 'NewsDetail', 'Profile', 'Configuracoes', 'PostarVaga', 
    'GerenciarVagas', 'GerenciarUsuarios', 'PaymentsPage', 'GerenciarPlanos', 'BibliotecaAdmin',
    'RecruiterArea', 'Favoritos', 'Historico', 'ProfessionalResume', 'AnalyticsPage'];
  const isChildRoute = childRoutes.includes(currentPageName);

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
        { name: 'Notícias', icon: Newspaper, page: 'News' },
        { name: 'Blog', icon: BookOpen, page: 'Blog' },
        { name: 'Feed', icon: MessageCircle, page: 'Feed' },
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

    loadItems();
    
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

  const updateThemeColor = (color) => {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color);

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

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateThemeColor('#0f172a');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      updateThemeColor('#FFFFFF');
    }
  };

  const noLayoutPages = ['Splash', 'Login', 'Register', 'PreLander'];

  useEffect(() => {
    const hideBase44Button = () => {
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
      
      document.querySelectorAll('button, div, span, a').forEach(el => {
        if (el.textContent?.includes('Edit') && el.textContent?.includes('Base44')) {
          el.style.cssText = 'display: none !important; visibility: hidden !important;';
          if (el.parentElement) {
            el.parentElement.style.cssText = 'display: none !important; visibility: hidden !important;';
          }
        }
      });
      
      document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
        if (el.textContent?.includes('Base44') || el.textContent?.includes('Edit with')) {
          el.style.cssText = 'display: none !important;';
        }
      });
    };
    
    hideBase44Button();
    setTimeout(hideBase44Button, 500);
    setTimeout(hideBase44Button, 1000);
    setTimeout(hideBase44Button, 2000);
    
    const observer = new MutationObserver(hideBase44Button);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
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
  const isDono = user?.email === 'alexandreferreirajp01@gmail.com' || user?.subscription_type === 'dono';
  const showVagasButton = isDono || isAdmin;

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = createPageUrl('Splash');
  };

  useEffect(() => {
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.setAttribute('lang', 'pt-BR');
    document.documentElement.classList.add('notranslate');
    document.body.setAttribute('translate', 'no');
    document.body.classList.add('notranslate');

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col notranslate">
      <AdSenseHead />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col notranslate" translate="no" lang="pt-BR">
  {/* AdsTerra Ads */}
  <PopunderAd pageName={currentPageName} />
  <SocialBarAd pageName={currentPageName} />

  <NavigationFallback />
  <ServiceWorkerManager />
  <NativePermissionModal />
  <ApplyBasicPermissions user={user} />

  {/* Top Navigation - Fixed com z-index máximo */}
  <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 fixed top-0 left-0 right-0 z-[9999]" translate="no" style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 'env(safe-area-inset-top, 0px)'
  }}>
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center h-16 lg:h-20 relative">
        {/* Mobile: Notification Bell - Left */}
        <div className="lg:hidden absolute left-0">
          {user && <NotificationBell user={user} />}
        </div>

        {/* Logo - Desktop only */}
        <Link to={createPageUrl('Home')} className="hidden lg:flex items-center gap-3">
          <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png" 
              alt="Vagas Abertas PB" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-black dark:text-white leading-tight">
              Vagas Abertas PB
            </span>
            <span className="text-sm text-[#2B5A8F] dark:text-blue-400 font-medium">
              Empregos na Paraíba
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2 flex-wrap max-w-[50%] ml-4">
          {navItems.map((item) => (
            <Link key={item.page} to={createPageUrl(item.page)}>
              <Button 
                variant={currentPageName === item.page ? "secondary" : "ghost"}
                className={`rounded-xl text-sm px-4 py-2 h-auto whitespace-nowrap ${currentPageName === item.page ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-[#1D2226] dark:text-slate-200'}`}
              >
                <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{item.name}</span>
              </Button>
            </Link>
          ))}
              </nav>

              <div className="hidden lg:block">
                <BannerAd size="728x90" pageName={currentPageName} location="header" />
              </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 absolute right-0 lg:relative lg:ml-auto">
          {/* Desktop: Notification Bell + Alerta Pendências + Settings + Users Button + Vagas Button + Theme */}
          {user && <NotificationBell user={user} className="hidden lg:block" />}

          {showVagasButton && (
            <Link to={createPageUrl('VagasPendentes')} title="Vagas Pendentes" className="hidden lg:inline-flex">
              <Button variant="ghost" size="icon" className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                <AlertTriangle className="w-5 h-5" />
              </Button>
            </Link>
          )}

          {showVagasButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.location.href = createPageUrl('Configuracoes')}
              className="text-[#1D2226] dark:text-white hidden lg:block"
              title="Configurações Gerais"
            >
              <Wrench className="w-5 h-5" />
            </Button>
          )}
          {showVagasButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.location.href = createPageUrl('GerenciarUsuarios')}
              className="text-[#1D2226] dark:text-white hidden lg:block"
              title="Gerenciar Usuários"
            >
              <Users className="w-5 h-5" />
            </Button>
          )}
          {showVagasButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowVagasSubmenu(true)}
              className="text-[#1D2226] dark:text-white hidden lg:block"
              title="Gestão de Vagas"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-[#1D2226] dark:text-white hidden lg:block"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Mobile: Chat + Settings + Theme + Users Button + Vagas Button + Menu */}
          <div className="lg:hidden flex items-center gap-1">

            {showVagasButton && (
              <Link to={createPageUrl('VagasPendentes')} title="Vagas Pendentes">
                <Button variant="ghost" size="icon" className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                  <AlertTriangle className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {showVagasButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.location.href = createPageUrl('Configuracoes')}
                className="text-[#1D2226] dark:text-white"
                title="Configurações Gerais"
              >
                <Wrench className="w-5 h-5" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-[#1D2226] dark:text-white"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {showVagasButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.location.href = createPageUrl('GerenciarUsuarios')}
                className="text-[#1D2226] dark:text-white"
                title="Gerenciar Usuários"
              >
                <Users className="w-5 h-5" />
              </Button>
            )}
            {showVagasButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowVagasSubmenu(true)}
                className="text-[#1D2226] dark:text-white"
                title="Gestão de Vagas"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#1D2226] dark:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 stroke-[2.5]" /> : <Menu className="w-6 h-6 stroke-[2.5]" />}
            </Button>
          </div>
          {user ? (
            <Link to={createPageUrl('Profile')} className="hidden lg:block">
              <Button variant="outline" className="rounded-xl text-sm px-3 text-[#1D2226] dark:text-white border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                <User className="w-4 h-4 mr-1.5" />
                Perfil
              </Button>
            </Link>
          ) : (
            <>
              <Button 
                onClick={() => {
                  sessionStorage.setItem('needs_login', 'true');
                  window.location.href = createPageUrl('Splash');
                }}
                className="bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-xl text-sm px-6 font-semibold hidden lg:block"
              >
                Entrar
              </Button>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/378c9b540_135266-removebg-preview1.png"
                alt="Criador"
                className="w-8 h-8 rounded-full border-2 border-[#1D4371] ml-2 hidden lg:block"
                title="Criado por Alexandre Ferreira"
              />
            </>
          )}
        </div>
      </div>
    </div>

    {/* Mobile/Tablet Menu */}
    {mobileMenuOpen && (
      <div className="lg:hidden border-t bg-white dark:bg-slate-800 dark:border-slate-700">
        <nav className="p-4 space-y-2">
          {navItems.filter(item => item.page !== 'Profile').map((item) => (
            <Link 
              key={item.page} 
              to={createPageUrl(item.page)}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button 
                variant={currentPageName === item.page ? "secondary" : "ghost"}
                className={`w-full justify-start rounded-xl ${currentPageName === item.page ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'dark:text-slate-200'}`}
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
              <>
                <Link to={createPageUrl('Splash')} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-xl font-semibold mb-2">
                    Entrar / Cadastrar
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/378c9b540_135266-removebg-preview1.png"
                    alt="Alexandre Ferreira"
                    className="w-10 h-10 rounded-full border-2 border-[#1D4371]"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Alexandre Ferreira</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Criador</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    )}
  </header>

  {/* Main Content com padding-top para o header fixo */}
  <main className="flex-1" style={{ paddingTop: '4rem', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  </main>

  {/* Footer */}
  <footer className="bg-slate-800 dark:bg-slate-950 text-white py-12 hidden md:block" translate="no">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center mb-6">
          <SupportButton user={user} discrete={true} />
        </div>
        <div className="text-center mb-10">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/378c9b540_135266-removebg-preview1.png"
          alt="Alexandre Ferreira"
          className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-[#1D4371] shadow-xl bg-white p-1"
        />
        <h3 className="text-xl font-bold text-white mb-2">Alexandre Ferreira</h3>
        <p className="text-slate-300 text-sm mb-1">Criador & Desenvolvedor</p>
        <p className="text-slate-400 text-sm">CNPJ: 62.874.724/0001-11</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <a href="mailto:contato@vagasabertaspb.com.br" className="text-slate-300 hover:text-white text-sm">
            contato@vagasabertaspb.com.br
          </a>
          <span className="text-slate-600">•</span>
          <a 
            href="https://wa.me/5583991971320" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-1"
          >
            <MessageCircle className="w-4 h-4" />
            (83) 99197-1320
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 max-w-5xl mx-auto">
        <div>
          <h4 className="font-semibold mb-3 text-white">Legal</h4>
          <div className="space-y-2 text-sm">
            <Link to={createPageUrl('Privacy')} className="block text-slate-400 hover:text-white">Política de Privacidade</Link>
            <Link to={createPageUrl('Terms')} className="block text-slate-400 hover:text-white">Termos de Uso</Link>
            <Link to={createPageUrl('Cookies')} className="block text-slate-400 hover:text-white">Política de Cookies</Link>
            <Link to={createPageUrl('Security')} className="block text-slate-400 hover:text-white">Política de Segurança</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-white">Empresa</h4>
          <div className="space-y-2 text-sm">
            <Link to={createPageUrl('About')} className="block text-slate-400 hover:text-white">Sobre Nós</Link>
            <Link to={createPageUrl('Contact')} className="block text-slate-400 hover:text-white">Contato</Link>
            <Link to={createPageUrl('Careers')} className="block text-slate-400 hover:text-white">Trabalhe Conosco</Link>
            <Link to={createPageUrl('Parcerias')} className="block text-slate-400 hover:text-white">Parcerias</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-white">Recursos</h4>
          <div className="space-y-2 text-sm">
            <Link to={createPageUrl('FAQ')} className="block text-slate-400 hover:text-white">FAQ</Link>
            <Link to={createPageUrl('LGPD')} className="block text-slate-400 hover:text-white">LGPD – Seus Direitos</Link>
            <Link to={createPageUrl('Groups')} className="block text-slate-400 hover:text-white">Grupos WhatsApp</Link>
            <Link to={createPageUrl('News')} className="block text-slate-400 hover:text-white">Notícias</Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-white">Anuncie</h4>
          <div className="space-y-2 text-sm">
            <Link to={createPageUrl('Advertise')} className="block text-slate-400 hover:text-white">Anunciar Conosco</Link>
            <Link to={createPageUrl('Subscription')} className="block text-slate-400 hover:text-white">Planos</Link>
            <a href="mailto:rhvagasabertasparaiba@gmail.com" className="block text-slate-400 hover:text-white">Suporte</a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} Vagas Abertas PB. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Made with ❤️ no Brasil</span>
          </div>
        </div>
      </div>
    </div>
  </footer>

  {/* Bottom Navigation (Mobile) - Fixed com z-index alto */}
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-lg z-[9998]" translate="no" style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)'
  }}>
    <div className="flex items-center justify-around h-16">
      {navItems.slice(0, 5).map((item) => (
        <Link 
          key={item.page} 
          to={createPageUrl(item.page)}
          className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 ${
            currentPageName === item.page ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <item.icon className="w-5 h-5 mb-0.5 flex-shrink-0" />
          <span className="text-[10px] truncate max-w-full">{item.name}</span>
        </Link>
      ))}
    </div>
  </nav>

  {/* AdsTerra Banner 320x50 - Mobile Footer */}
  <div className="md:hidden fixed z-[9997] bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-1" style={{
    bottom: '64px',
    left: 0,
    right: 0,
    zIndex: 9997
  }}>
    <BannerAd size="320x50" pageName={currentPageName} location="footer" className="mx-auto" />
  </div>

  <FloatingButtons />
  <CookieConsent />
  <PopupManager />
  <WelcomePopup />

  {/* Submenu de Gestão de Vagas */}
  <Dialog open={showVagasSubmenu} onOpenChange={setShowVagasSubmenu}>
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6" />
          Gestão de Vagas
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-2 mt-4">
        {vagasSubmenuItems.map((item, index) => {
          // Verificar permissões
          if (!isDono && !isAdmin) {
            if (item.permissionId) {
              const userPermissions = user?.permissions || {};
              if (userPermissions[item.permissionId] === false) {
                return null;
              }
            }
          }

          if (item.roles) {
            const hasAccess = item.roles.some(role => {
              if (role === 'dono') return isDono;
              if (role === 'admin') return isAdmin;
              return false;
            });
            if (!hasAccess) return null;
          }

          const Icon = item.icon;
          const isLast = index === vagasSubmenuItems.length - 1;

          return (
            <button
              key={item.id}
              onClick={() => {
                setShowVagasSubmenu(false);
                window.location.href = createPageUrl(item.page);
              }}
              className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left rounded-xl ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white text-sm">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </DialogContent>
  </Dialog>
  </div>
  );
  }