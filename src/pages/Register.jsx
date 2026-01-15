import React, { useState, useEffect } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Register() {
  const [step, setStep] = useState(1); // 1: escolha método, 2: formulário email
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    idade: '',
    localidade: '',
    username: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Verificar disponibilidade do username
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await base44.functions.invoke('authManual', {
          action: 'check_username',
          username: formData.username
        });
        setUsernameAvailable(response.data.available);
      } catch (e) {
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    };

    const timeout = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeout);
  }, [formData.username]);

  const handleSocialLogin = (provider) => {
    localStorage.setItem('vagas_abertas_last_login', Date.now().toString());
    base44.auth.redirectToLogin(createPageUrl('Home'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.nome || !formData.sobrenome) {
      setError('Nome e sobrenome são obrigatórios');
      return;
    }

    if (!formData.idade || formData.idade < 14) {
      setError('Você precisa ter pelo menos 14 anos');
      return;
    }

    if (!formData.localidade) {
      setError('Localidade é obrigatória');
      return;
    }

    if (formData.username.length < 3 || /\s/.test(formData.username)) {
      setError('Username deve ter no mínimo 3 caracteres e não pode conter espaços');
      return;
    }

    if (!usernameAvailable) {
      setError('Esse nome de usuário já está em uso. Tente outro.');
      return;
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Email inválido');
      return;
    }

    if (!formData.telefone) {
      setError('Telefone é obrigatório');
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await base44.functions.invoke('authManual', {
        action: 'register',
        ...formData
      });

      if (response.data.success) {
        // Redirecionar para página de sucesso
        window.location.href = createPageUrl('RegistrationSuccess') + `?email=${encodeURIComponent(formData.email)}`;
      } else {
        setError(response.data.error || 'Erro ao criar conta');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8 transition-colors">
        <div className="w-full max-w-md mb-4">
          <Link to={createPageUrl('Splash')}>
            <Button variant="ghost" className="text-slate-600 hover:bg-slate-100 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6 p-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/704fcb47f_file_000000001aec71f583d94b71860e2dbd.png" 
              alt="Emprega Brasil+" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-[#0A66C2] mb-2">Criar Conta</h1>
          <p className="text-slate-600 text-lg">Escolha como deseja se cadastrar</p>
        </div>

        <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
          <CardContent className="p-6 space-y-4">
            <Button
              onClick={() => setStep(2)}
              className="w-full h-14 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-base font-semibold"
            >
              📧 Cadastrar com Email e Senha
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-slate-400 text-sm">ou continue com</span>
              </div>
            </div>

            <Button
              onClick={() => handleSocialLogin('google')}
              variant="outline"
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
              onClick={() => handleSocialLogin('microsoft')}
              variant="outline"
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
              onClick={() => handleSocialLogin('facebook')}
              variant="outline"
              className="w-full h-14 rounded-xl border-2 border-[#1877F2] bg-[#1877F2] hover:bg-[#0C63D4] text-white text-base font-semibold"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>

            <p className="text-center text-xs text-slate-500 pt-4">
              Ao continuar, você concorda com nossos{' '}
              <a href={createPageUrl('Terms')} className="text-slate-600 hover:underline">Termos de Uso</a>
              {' e '}
              <a href={createPageUrl('Privacy')} className="text-slate-600 hover:underline">Política de Privacidade</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8">
      <div className="w-full max-w-md mb-4">
        <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-600 hover:bg-slate-100 -ml-2">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#0A66C2] mb-2">Criar Conta</h1>
        <p className="text-slate-600">Preencha seus dados</p>
      </div>

      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="nome"
                placeholder="Nome *"
                value={formData.nome}
                onChange={handleChange}
                required
              />
              <Input
                name="sobrenome"
                placeholder="Sobrenome *"
                value={formData.sobrenome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="idade"
                type="number"
                placeholder="Idade *"
                value={formData.idade}
                onChange={handleChange}
                min="14"
                required
              />
              <Input
                name="localidade"
                placeholder="Cidade/Estado *"
                value={formData.localidade}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <Input
                name="username"
                placeholder="Nome de usuário *"
                value={formData.username}
                onChange={handleChange}
                required
                className={usernameAvailable === false ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : ''}
              />
              {checkingUsername && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
              )}
              {!checkingUsername && usernameAvailable === true && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {!checkingUsername && usernameAvailable === false && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
              {usernameAvailable === false && (
                <p className="text-xs text-red-500 mt-1">Nome de usuário já em uso</p>
              )}
            </div>

            <Input
              name="email"
              type="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              name="telefone"
              type="tel"
              placeholder="Telefone (WhatsApp) *"
              value={formData.telefone}
              onChange={handleChange}
              required
            />

            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha (mín. 6 caracteres) *"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirmar senha *"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !usernameAvailable}
              className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Criar Conta'
              )}
            </Button>

            <p className="text-center text-xs text-slate-500">
              Já tem conta?{' '}
              <Link to={createPageUrl('Splash')} className="text-[#0A66C2] hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}