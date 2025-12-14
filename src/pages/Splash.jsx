import React, { useEffect, useState } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, Lock, Briefcase, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PasswordInput from "@/components/common/PasswordInput";

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export default function Splash() {
  const [status, setStatus] = useState('checking'); // 'checking', 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Verificar se veio de um redirecionamento para login
    const needsLogin = sessionStorage.getItem('needs_login');
    
    if (!needsLogin) {
      // Se não precisa de login, vai direto para Home
      window.location.href = createPageUrl('Home');
      return;
    }
    
    // Não limpar flag aqui - apenas ao fazer login ou clicar em voltar
    
    const checkSession = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          // Se já está autenticado, vai pra Home
          sessionStorage.removeItem('needs_login');
          window.location.href = createPageUrl('Home');
          return;
        }
      } catch (e) {
        // Erro ao verificar auth
      }
      
      // Mostra a tela de login
      setStatus('login');
    };
    
    checkSession();
    
    // Listener para botão voltar do navegador
    const handlePopState = (event) => {
      event.preventDefault();
      sessionStorage.removeItem('needs_login');
      sessionStorage.removeItem('redirect_after_login');
      window.location.replace(createPageUrl('Home'));
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Também interceptar navegação do navegador
    window.history.pushState(null, '', window.location.href);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Login com email/senha ou username/senha
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/functions/auth/manual_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
        
        // Verificar se havia redirecionamento pendente
        const redirectTo = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('needs_login');
        sessionStorage.removeItem('redirect_after_login');

        // Notificar admins sobre novo login
        try {
          await base44.functions.invoke('notifyNewUser', {
            user_email: email,
            user_name: email
          });
        } catch (e) {
          // Ignorar erro de notificação
        }

        // Redirecionar para página que tentou acessar ou Home
        const targetPage = redirectTo || 'Home';
        window.location.replace(createPageUrl(targetPage));
      } else {
        setError(data.error || 'Erro ao fazer login');
        setLoading(false);
      }
    } catch (err) {
      setError('Usuário ou senha inválidos');
      setLoading(false);
    }
  };

  // Login com Google
  const handleGoogleLogin = async () => {
    localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
    
    // Verificar se havia redirecionamento pendente
    const redirectTo = sessionStorage.getItem('redirect_after_login');
    sessionStorage.removeItem('needs_login');
    sessionStorage.removeItem('redirect_after_login');
    
    // Tentar notificar admins (será executado após o login bem-sucedido)
    try {
      const user = await base44.auth.me();
      if (user) {
        await base44.functions.invoke('notifyNewUser', {
          user_email: user.email,
          user_name: user.custom_full_name || user.username || user.email
        });
      }
    } catch (e) {
      // Ignorar - usuário ainda não autenticado
    }
    
    // Redirecionar para página que tentou acessar ou Home
    const targetPage = redirectTo || 'Home';
    base44.auth.redirectToLogin(createPageUrl(targetPage));
  };



  // Tela de carregamento
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#0A66C2] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
        <p className="text-white/80 text-sm font-medium">Carregando...</p>
      </div>
    );
  }

  // Tela de login
  return (
    <div className="min-h-screen bg-[#0A66C2] dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8 transition-colors">
      {/* Botão Voltar */}
      <div className="w-full max-w-md mb-4">
        <Button
          variant="ghost"
          onClick={() => {
            sessionStorage.removeItem('needs_login');
            window.location.href = createPageUrl('Home');
          }}
          className="text-white hover:bg-white/10 -ml-2"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Início
        </Button>
      </div>
      
      {/* Logo e Nome */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg" 
            alt="Logo" 
            className="w-16 h-16 object-contain rounded-xl"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">Vagas Abertas</h1>
        <p className="text-white/80 text-lg">Paraíba</p>
        <p className="text-white/60 text-sm mt-2">Encontre sua próxima oportunidade</p>
        </div>

      {/* Card de Login */}
      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
        <CardContent className="p-6 space-y-5">
          {/* Formulário de Email/Senha */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-3">
              {/* Campo Email ou Username */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="E-mail ou nome de usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-slate-200 text-base"
                />
              </div>
              
              {/* Campo Senha */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="pl-11 h-12 rounded-xl border-slate-200 text-base"
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Botão Entrar */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white text-[#0A66C2] hover:bg-white/90 rounded-xl text-base font-semibold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-slate-400 text-sm">ou</span>
            </div>
          </div>

          {/* Botão Google */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-14 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-base font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </Button>

          {/* Links de recuperação */}
          <div className="flex justify-center gap-4 text-sm">
            <Link to={createPageUrl('ForgotPassword')} className="text-slate-600 hover:text-slate-800 hover:underline">
              Esqueci minha senha
            </Link>
          </div>



          {/* Botão Criar Cadastro */}
          <Link to={createPageUrl('Register')}>
            <Button
              type="button"
              className="w-full h-12 rounded-xl bg-white text-[#0A66C2] hover:bg-white/90 text-base font-semibold"
            >
              Criar Cadastro
            </Button>
          </Link>

          {/* Texto informativo */}
          <p className="text-center text-xs text-slate-500 pt-2">
            Ao entrar, você concorda com nossos{' '}
            <a href={createPageUrl('Terms')} className="text-slate-600 hover:text-slate-800 hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href={createPageUrl('Privacy')} className="text-slate-600 hover:text-slate-800 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-white/70 text-xs mt-8 text-center">
        © {new Date().getFullYear()} Vagas Abertas Paraíba
      </p>
    </div>
  );
}