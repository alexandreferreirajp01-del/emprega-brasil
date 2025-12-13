import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function RequireAuth({ children, redirectTo = 'Splash', requirePremium = false }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          sessionStorage.setItem('needs_login', 'true');
          const currentPath = window.location.pathname;
          sessionStorage.setItem('redirect_after_login', currentPath);
          window.location.replace(createPageUrl(redirectTo));
          return;
        }

        // Se requer premium, validar
        if (requirePremium) {
          const user = await base44.auth.me();
          const hasPremium = user.subscription_type === 'premium' || 
                            user.subscription_type === 'admin' ||
                            user.subscription_type === 'recruiter' ||
                            user.role === 'admin';
          
          if (!hasPremium) {
            const lastValidRoute = localStorage.getItem('last_valid_route') || 'Home';
            window.location.replace(createPageUrl(lastValidRoute));
            return;
          }
        }
        
        setAuthenticated(true);
      } catch (e) {
        sessionStorage.setItem('needs_login', 'true');
        window.location.replace(createPageUrl(redirectTo));
      } finally {
        setChecking(false);
      }
    };
    
    checkAuth();
  }, [redirectTo, requirePremium]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}