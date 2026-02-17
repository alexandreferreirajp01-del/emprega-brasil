import React, { useState, useEffect } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Key, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: verificar código, 2: nova senha, 3: sucesso

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Pegar email da URL se existir
    const urlEmail = new URLSearchParams(window.location.search).get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, []);

  const handleValidateCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !code) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const response = await base44.functions.invoke('resetPassword', {
        action: 'validate_code',
        email: email.toLowerCase(),
        code: code.trim()
      });

      if (response.data.success) {
        setStep(2);
      } else {
        setError(response.data.error || 'Código inválido');
      }
    } catch (err) {
      console.error('Erro ao validar código:', err);
      setError('Erro ao validar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await base44.functions.invoke('resetPassword', {
        action: 'reset_password',
        email: email.toLowerCase(),
        code: code.trim(),
        newPassword: password
      });

      if (response.data.success) {
        setStep(3);
      } else {
        setError(response.data.error || 'Erro ao redefinir senha');
      }
    } catch (err) {
      console.error('Erro ao resetar senha:', err);
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Sucesso
  if (step === 3) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg rounded-2xl shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Senha alterada! 🎉
            </h1>

            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Sua senha foi alterada com sucesso. Agora você já pode fazer login com sua nova senha.
            </p>

            <Link to={createPageUrl('Splash')}>
              <Button className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold">
                Fazer Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 2: Nova senha
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8">
        <div className="w-full max-w-md mb-4">
          <Button 
            variant="ghost" 
            className="text-slate-600 hover:bg-slate-100 -ml-2"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-10 h-10 text-[#0A66C2]" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A66C2] dark:text-blue-400 mb-2">
            Nova Senha
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Digite sua nova senha
          </p>
        </div>

        <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
          <CardContent className="p-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="h-12 rounded-xl pr-10"
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
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className="h-12 rounded-xl pr-10"
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
                disabled={loading}
                className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 1: Validar código
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8">
      <div className="w-full max-w-md mb-4">
        <Link to={createPageUrl('ForgotPassword')}>
          <Button variant="ghost" className="text-slate-600 hover:bg-slate-100 -ml-2">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-10 h-10 text-[#0A66C2]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0A66C2] dark:text-blue-400 mb-2">
          Confirmar Código
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Digite o código de 6 dígitos enviado para seu email
        </p>
      </div>

      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
        <CardContent className="p-6">
          <form onSubmit={handleValidateCode} className="space-y-4">
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="h-12 rounded-xl"
              required
            />

            <Input
              type="text"
              placeholder="Código (ex: 123456)"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              className="h-12 rounded-xl text-center text-2xl tracking-widest"
              maxLength={6}
              required
            />

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
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Validar Código'
              )}
            </Button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Não recebeu o código?{' '}
              <Link to={createPageUrl('ForgotPassword')} className="text-[#0A66C2] hover:underline font-medium">
                Solicitar novo código
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}