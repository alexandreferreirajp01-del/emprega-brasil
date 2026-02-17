import React, { useState, useEffect } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Key, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('forgotPassword', {
        email: email.toLowerCase()
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.error || 'Erro ao enviar email');
      }
    } catch (err) {
      console.error('Erro ao recuperar senha:', err);
      setError(err?.response?.data?.error || 'Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg rounded-2xl shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Email Enviado! ✉️
            </h1>

            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Enviamos um link de recuperação para <strong>{email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-slate-700 text-sm font-medium mb-2">📧 Próximos passos:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-sm">
                <li>Abra seu email</li>
                <li>Procure por email de Vagas Abertas PB</li>
                <li>Clique no botão "Redefinir Minha Senha"</li>
                <li>Digite sua nova senha</li>
                <li>Faça login com a nova senha</li>
              </ol>
              <p className="text-slate-500 text-xs mt-3">
                ⚠️ O link expira em 1 hora
              </p>
            </div>

            <Link to={createPageUrl('Splash')}>
              <Button className="w-full h-12 bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-xl font-semibold">
                Voltar para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-start pt-12 px-4 pb-8">
      <div className="w-full max-w-md mb-4">
        <Link to={createPageUrl('Splash')}>
          <Button variant="ghost" className="text-slate-600 hover:bg-slate-100 -ml-2">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-10 h-10 text-[#1D4371]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1D4371] dark:text-blue-400 mb-2">
          Esqueci Minha Senha
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Digite seu email para receber um link de recuperação
        </p>
      </div>

      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-xl font-semibold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Enviar Link de Recuperação'
              )}
            </Button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Lembrou sua senha?{' '}
              <Link to={createPageUrl('Splash')} className="text-[#1D4371] hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}