import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <Card className="max-w-4xl mx-auto rounded-2xl shadow-2xl border-2 border-slate-200">
        <div className="p-4 sm:p-6">
          <button
            onClick={handleReject}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 mb-2">Cookies e Privacidade</h3>
              <p className="text-sm text-slate-600 mb-4">
                Usamos cookies para melhorar sua experiência, analisar o tráfego e personalizar conteúdo. 
                Ao continuar navegando, você concorda com nossa{' '}
                <Link to={createPageUrl('Privacy')} className="text-blue-600 hover:underline">
                  Política de Privacidade
                </Link>
                {' '}e{' '}
                <Link to={createPageUrl('Cookies')} className="text-blue-600 hover:underline">
                  Política de Cookies
                </Link>.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleAccept}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10 px-6"
                >
                  Aceitar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  className="rounded-xl h-10 px-6"
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}