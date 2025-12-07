import React, { useEffect, useState } from 'react';
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import ManualPremiumActivation from "@/components/admin/ManualPremiumActivation";

export default function ActivatePremiumManual() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0056ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-8 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <button className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Ativação Manual de Premium</h1>
          <p className="text-white/80 text-sm sm:text-base mt-2">Ative o plano Premium para usuários específicos</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <ManualPremiumActivation />
      </div>
    </div>
  );
}