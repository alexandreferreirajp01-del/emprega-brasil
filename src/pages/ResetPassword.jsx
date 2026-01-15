import React, { useState, useEffect } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Key, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('validating'); // validating, valid, invalid, expired, success
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const urlToken = new URLSearchParams(window.location.search).get('token');
    
    if (!urlToken) {
      setStatus('invalid');
      return;
    }

    setToken(urlToken);

    // Validar token
    const validateToken = async () => {
      try {
        const response = await base44.functions.invoke('resetPassword', {
          action: 'validate_token',
          token: urlToken
        });

        if (response.data.success) {
          setStatus('valid');
        } else {
          if (response.data.expired) {
            setStatus('expired');
          } else {
            setStatus('invalid');
          }
        }
      } catch (err) {
        setStatus('invalid');
      }
    };

    validateToken();
  }, []);

  const handleSubmit = async (e) => {
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
        token,
        newPassword: password
      });

      if (response.data.success) {
        setStatus('success');
      } else {
        setError(response.data.error || 'Erro ao redefinir senha');
        setLoading(false);
      }
    } catch (err) {
      setError('Erro ao redefinir senha. Tente novamente.');
      setLoading(false);
    }
  };

  if (status === 'validating') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0A66C2] animate-spin mb-4" />
        <p className="text-slate-600">Validando link...</p>
      </div>
    );
  }

  if (status === 'invalid' || status === 'expired') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg rounded-2xl shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {status === 'expired' ? 'Link expirado' : 'Link inválido'}
            </h1>

            <p className="text-slate-600 mb-6">
              {status === 'expired' 
                ? 'Este link de recuperação expirou. Solicite um novo.'
                : 'Este link de recuperação é inválido ou já foi usado.'}
            </p>

            <Link to={createPageUrl('ForgotPassword')}>
              <Button className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold mb-3">
                Solicitar novo link
              </Button>
            </Link>

            <Link to={createPageUrl('Splash')}>
              <Button variant="outline" className="w-full h-12 rounded-xl">
                Voltar para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg rounded-2xl shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Senha alterada! 🎉
            </h1>

            <p className="text-slate-600 mb-6">
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-10 h-10 text-[#0A66C2]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0A66C2] mb-2">
          Nova Senha
        </h1>
        <p className="text-slate-600">
          Digite sua nova senha
        </p>
      </div>

      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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