import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function RequireAuth({ children, redirectTo = 'Splash' }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          sessionStorage.setItem('needs_login', 'true');
          window.location.href = createPageUrl(redirectTo);
          return;
        }
        
        setAuthenticated(true);
      } catch (e) {
        sessionStorage.setItem('needs_login', 'true');
        window.location.href = createPageUrl(redirectTo);
      } finally {
        setChecking(false);
      }
    };
    
    checkAuth();
  }, [redirectTo]);

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