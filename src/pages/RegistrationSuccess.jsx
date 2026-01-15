import React, { useEffect } from 'react';
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function RegistrationSuccess() {
  const email = new URLSearchParams(window.location.search).get('email');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <Link to={createPageUrl('Splash')} className="mb-6">
        <Button variant="ghost" className="text-slate-600">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para login
        </Button>
      </Link>

      <Card className="w-full max-w-lg rounded-2xl shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Cadastro realizado! 🎉
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <Mail className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <p className="text-slate-700 text-lg font-medium mb-2">
              Verifique seu email
            </p>
            <p className="text-slate-600 text-sm">
              Enviamos um link de verificação para:
            </p>
            <p className="text-[#0A66C2] font-semibold text-base mt-2">
              {email}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-left space-y-3 mb-6">
            <p className="text-slate-700 text-sm">
              <strong>📧 Próximos passos:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
              <li>Abra seu email</li>
              <li>Procure pelo email do Emprega Brasil+</li>
              <li>Clique no botão "Validar meu cadastro"</li>
              <li>Sua conta será ativada automaticamente</li>
            </ol>
          </div>

          <p className="text-slate-500 text-xs mb-6">
            ⚠️ O link expira em 24 horas. Não recebeu o email?{' '}
            <Link to={createPageUrl('ResendVerification')} className="text-[#0A66C2] hover:underline font-medium">
              Clique aqui para reenviar
            </Link>
          </p>

          <Link to={createPageUrl('Splash')}>
            <Button className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold">
              Ir para Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}