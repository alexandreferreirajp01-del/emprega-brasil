import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, Briefcase, Users, Crown, User, Menu, X, 
  Shield, Rss, LogOut, MessageCircle, Newspaper, Info, Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ErrorBoundary from "@/components/ErrorBoundary";
import FloatingButtons from "@/components/common/FloatingButtons";

export default function Layout({ children, currentPageName }) {
  // Esconder botão do Base44 "Edit with Base44"
  useEffect(() => {
    const hideBase44Button = () => {
      const style = document.createElement('style');
      style.id = 'hide-base44-button';
      style.textContent = `
        [data-base44-edit], 
        .base44-edit-button,
        [class*="base44"],
        #base44-floating-button,
        button[aria-label*="base44" i],
        button[aria-label*="edit" i][aria-label*="base44" i],
        div[class*="fixed"][class*="bottom"][class*="right"] > button:has(svg),
        .fixed.bottom-4.right-4,
        .fixed.bottom-6.right-6 {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      if (!document.getElementById('hide-base44-button')) {
        document.head.appendChild(style);
      }
    };
    hideBase44Button();
    
    // Também tentar remover via JavaScript
    const interval = setInterval(() => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        if (text.includes('base44') || ariaLabel.includes('base44') || text.includes('edit with')) {
          btn.style.display = 'none';
          btn.remove();
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pages that don't need layout
  const noLayoutPages = ['Splash', 'Login', 'Register'];
  
  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      
      try {
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
            { name: 'Notícias', icon: Newspaper, page: 'News' },
            { name: 'Comunidade', icon: MessageCircle, page: 'Community' },
            { name: 'Grupos', icon: Users, page: 'Groups' },
            { name: 'Parcerias', icon: Handshake, page: 'Parcerias' },
          ];

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
      {/* Top Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
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
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <Button 
                    variant={currentPageName === item.page ? "secondary" : "ghost"}
                    className={`rounded-xl ${currentPageName === item.page ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              ))}
              
              {isAdmin && (
                <Link to={createPageUrl('Admin')}>
                  <Button 
                    variant={currentPageName === 'Admin' ? "secondary" : "ghost"}
                    className={`rounded-xl ${currentPageName === 'Admin' ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
            </nav>

            {/* User Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isVisitor ? (
                <Link to={createPageUrl('Splash')}>
                  <Button className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                    Entrar
                  </Button>
                </Link>
              ) : (
                <Link to={createPageUrl('Profile')}>
                  <Button variant="outline" className="rounded-xl">
                    <User className="w-4 h-4 mr-2" />
                    Perfil
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
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
              
              {isAdmin && (
                <Link to={createPageUrl('Admin')} onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant={currentPageName === 'Admin' ? "secondary" : "ghost"}
                    className={`w-full justify-start rounded-xl ${currentPageName === 'Admin' ? 'bg-[#0056ff]/10 text-[#0056ff]' : ''}`}
                  >
                    <Shield className="w-5 h-5 mr-3" />
                    Admin
                  </Button>
                </Link>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 safe-area-bottom">
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
    </div>
  );
}