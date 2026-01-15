import React, { useEffect, useState } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function Splash() {
  const [status, setStatus] = useState('checking');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const needsLogin = sessionStorage.getItem('needs_login');
    
    if (!needsLogin) {
      window.location.href = createPageUrl('Home');
      return;
    }
    
    const checkSession = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          sessionStorage.removeItem('needs_login');
          window.location.href = createPageUrl('Home');
          return;
        }
      } catch (e) {
        // Erro ao verificar auth
      }
      
      setStatus('login');
    };
    
    checkSession();
    
    const handlePopState = (event) => {
      event.preventDefault();
      sessionStorage.removeItem('needs_login');
      sessionStorage.removeItem('redirect_after_login');
      window.location.replace(createPageUrl('Home'));
    };
    
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('authManual', {
        action: 'login',
        identifier,
        password
      });

      if (response.data.success) {
        localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
        const redirectTo = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('needs_login');
        sessionStorage.removeItem('redirect_after_login');
        
        const targetPage = redirectTo || 'Home';
        window.location.href = createPageUrl(targetPage);
      } else {
        if (response.data.needsVerification) {
          setError(
            <span>
              {response.data.error}.{' '}
              <Link to={createPageUrl('ResendVerification')} className="underline font-medium">
                Clique aqui para reenviar
              </Link>
            </span>
          );
        } else {
          setError(response.data.error || 'Erro ao fazer login');
        }
        setLoading(false);
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
    const redirectTo = sessionStorage.getItem('redirect_after_login');
    sessionStorage.removeItem('needs_login');
    sessionStorage.removeItem('redirect_after_login');
    const targetPage = redirectTo || 'Home';
    base44.auth.redirectToLogin(createPageUrl(targetPage));
  };

  const handleMicrosoftLogin = () => {
    localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
    const redirectTo = sessionStorage.getItem('redirect_after_login');
    sessionStorage.removeItem('needs_login');
    sessionStorage.removeItem('redirect_after_login');
    const targetPage = redirectTo || 'Home';
    base44.auth.redirectToLogin(createPageUrl(targetPage));
  };

  const handleFacebookLogin = () => {
    localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
    const redirectTo = sessionStorage.getItem('redirect_after_login');
    sessionStorage.removeItem('needs_login');
    sessionStorage.removeItem('redirect_after_login');
    const targetPage = redirectTo || 'Home';
    base44.auth.redirectToLogin(createPageUrl(targetPage));
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-32 h-32 mb-6 animate-pulse">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/704fcb47f_file_000000001aec71f583d94b71860e2dbd.png"
            alt="Emprega Brasil+"
            className="w-full h-full object-contain"
          />
        </div>
        <Loader2 className="w-12 h-12 text-[#0A66C2] animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8 transition-colors">
      <div className="w-full max-w-md mb-4">
        <Button
          variant="ghost"
          onClick={() => {
            sessionStorage.removeItem('needs_login');
            window.location.href = createPageUrl('Home');
          }}
          className="text-slate-600 hover:bg-slate-100 -ml-2"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Início
        </Button>
      </div>

      <div className="text-center mb-8">
        <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6 p-4">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/704fcb47f_file_000000001aec71f583d94b71860e2dbd.png" 
            alt="Emprega Brasil+" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-[#0A66C2] mb-2">Emprega Brasil+</h1>
        <p className="text-slate-600 text-lg">Oportunidades em Todo o País</p>
      </div>

      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
        <CardContent className="p-6 space-y-5">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="Email ou nome de usuário"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-12 rounded-xl"
            />
            
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </Button>

            <div className="flex justify-center">
              <Link to={createPageUrl('ForgotPassword')} className="text-sm text-slate-600 hover:text-slate-800 hover:underline">
                Esqueci minha senha
              </Link>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-slate-400 text-sm">ou</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-14 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-base font-semibold"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleMicrosoftLogin}
              className="w-full h-14 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-base font-semibold"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 23 23">
                <path fill="#f25022" d="M0 0h11v11H0z"/>
                <path fill="#00a4ef" d="M12 0h11v11H12z"/>
                <path fill="#7fba00" d="M0 12h11v11H0z"/>
                <path fill="#ffb900" d="M12 12h11v11H12z"/>
              </svg>
              Microsoft
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleFacebookLogin}
              className="w-full h-14 rounded-xl border-2 border-[#1877F2] bg-[#1877F2] hover:bg-[#0C63D4] text-white text-base font-semibold"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>

          <Link to={createPageUrl('Register')}>
            <Button className="w-full h-12 rounded-xl bg-slate-100 text-[#0A66C2] hover:bg-slate-200 font-semibold">
              Criar Cadastro
            </Button>
          </Link>

          <p className="text-center text-xs text-slate-500 pt-2">
            Ao entrar, você concorda com nossos{' '}
            <a href={createPageUrl('Terms')} className="text-slate-600 hover:underline">Termos de Uso</a>
            {' e '}
            <a href={createPageUrl('Privacy')} className="text-slate-600 hover:underline">Política de Privacidade</a>
          </p>
        </CardContent>
      </Card>

      <p className="text-slate-500 text-xs mt-8 text-center">
        © {new Date().getFullYear()} Emprega Brasil+
      </p>
    </div>
  );
}