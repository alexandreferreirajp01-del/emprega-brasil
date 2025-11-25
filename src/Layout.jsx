import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, Briefcase, Users, Crown, User, Menu, X, 
  Shield, Rss, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pages that don't need layout
  const noLayoutPages = ['Splash', 'Login', 'Register'];
  
  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('workly_visitor_mode');
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

  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Vagas', icon: Briefcase, page: 'Jobs' },
    { name: 'Feed', icon: Rss, page: 'Feed' },
    { name: 'Grupos', icon: Users, page: 'Groups' },
    { name: 'Planos', icon: Crown, page: 'Subscription' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('workly_visitor_mode');
    window.location.href = createPageUrl('Splash');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0056ff] rounded-xl flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">Workly</span>
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
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => (
            <Link 
              key={item.page} 
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                currentPageName === item.page ? 'text-[#0056ff]' : 'text-slate-500'
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}