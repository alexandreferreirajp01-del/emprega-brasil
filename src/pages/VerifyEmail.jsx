import React, { useEffect, useState } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function VerifyEmail() {
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não encontrado');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await base44.functions.invoke('verifyEmail', { token });

        if (response.data.success) {
          setStatus('success');
          setMessage('Email verificado com sucesso! Você já pode fazer login.');
        } else {
          if (response.data.expired) {
            setStatus('expired');
            setMessage(response.data.error);
          } else {
            setStatus('error');
            setMessage(response.data.error || 'Erro ao verificar email');
          }
        }
      } catch (err) {
        setStatus('error');
        setMessage('Erro ao verificar email. Tente novamente.');
      }
    };

    verifyToken();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg rounded-2xl shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-[#0A66C2] animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Verificando seu email...
              </h1>
              <p className="text-slate-600">
                Aguarde enquanto confirmamos sua conta
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Email verificado! 🎉
              </h1>
              <p className="text-slate-600 text-lg mb-6">
                {message}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm font-medium">
                  ✅ Sua conta foi ativada com <strong>Plano Básico Gratuito</strong>
                </p>
              </div>
              <Link to={createPageUrl('Splash')}>
                <Button className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold">
                  Fazer Login
                </Button>
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Link expirado
              </h1>
              <p className="text-slate-600 mb-6">
                {message}
              </p>
              <Link to={createPageUrl('ResendVerification')}>
                <Button className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold mb-3">
                  Solicitar novo link
                </Button>
              </Link>
              <Link to={createPageUrl('Splash')}>
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  Voltar para Login
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Erro na verificação
              </h1>
              <p className="text-slate-600 mb-6">
                {message}
              </p>
              <Link to={createPageUrl('Splash')}>
                <Button className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold">
                  Voltar para Login
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}