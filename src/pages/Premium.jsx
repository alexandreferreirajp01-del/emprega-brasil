import React, { useEffect, useState } from 'react';
import { Crown, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function Premium() {
  const [loading, setLoading] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showAlreadyPremiumPopup, setShowAlreadyPremiumPopup] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const activatePremium = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const code = urlParams.get('code');
        
        // Verificar autenticação primeiro
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          sessionStorage.setItem('needs_login', 'true');
          sessionStorage.setItem('premium_activation_pending', 'true');
          window.location.href = createPageUrl('Splash');
          return;
        }

        const currentUser = await base44.auth.me();
        
        const isPremium = currentUser?.subscription_type === 'premium' || 
          currentUser?.subscription_type === 'admin' || 
          currentUser?.role === 'admin';
        
        if (isPremium) {
          setShowAlreadyPremiumPopup(true);
          setLoading(false);
          window.history.replaceState({}, '', createPageUrl('Premium'));
          return;
        }

        // Link com código único
        if (code) {
          const links = await base44.entities.AccessLink.filter({ code });
          if (links.length === 0) {
            setError('Link inválido ou não encontrado');
            setLoading(false);
            return;
          }

          const link = links[0];

          if (!link.is_active) {
            setError('Este link foi desativado');
            setLoading(false);
            return;
          }

          if (link.expires_at && new Date(link.expires_at) < new Date()) {
            setError('Este link expirou');
            setLoading(false);
            return;
          }

          if (link.used_by && link.is_single_use) {
            setError('Este link já foi utilizado');
            setLoading(false);
            return;
          }

          // Ativar acesso
          await base44.auth.updateMe({ subscription_type: link.link_type });

          // Marcar link como usado
          if (link.is_single_use) {
            await base44.asServiceRole.entities.AccessLink.update(link.id, {
              used_by: currentUser.email,
              used_at: new Date().toISOString(),
              is_active: false
            });
          }

          setShowSuccessPopup(true);
          setLoading(false);
          window.history.replaceState({}, '', createPageUrl('Premium'));
          return;
        }

        // Link Premium principal (status=ativo)
        if (status === 'ativo') {
          const premiumEnabled = localStorage.getItem('premium_link_enabled');
          if (premiumEnabled === 'false') {
            setError('Link Premium desativado temporariamente');
            setLoading(false);
            return;
          }

          await base44.auth.updateMe({ subscription_type: 'premium' });
          setShowSuccessPopup(true);
          setLoading(false);
          window.history.replaceState({}, '', createPageUrl('Premium'));
          return;
        }

        // Sem status ou code válido
        window.location.href = createPageUrl('Subscription');
      } catch (e) {
        console.error('Erro ao ativar premium:', e);
        setError('Erro ao ativar Premium. Tente novamente.');
        setLoading(false);
      }
    };

    activatePremium();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-[#0A66C2] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Processando ativação Premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Erro</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = createPageUrl('Subscription')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Ver Planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center p-4">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#0A66C2] to-[#004182] rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Parabéns! 🎉
            </h2>
            <p className="text-slate-600 text-lg mb-8">
              Você agora é um membro <span className="font-bold text-[#0A66C2]">Premium</span>!<br />
              Aproveite todos os benefícios exclusivos.
            </p>
            <button
              onClick={() => window.location.href = createPageUrl('Home')}
              className="w-full bg-gradient-to-r from-[#0A66C2] to-[#004182] hover:opacity-90 text-white font-semibold py-4 rounded-xl transition-all text-lg"
            >
              Começar Agora
            </button>
          </div>
        </div>
      )}

      {/* Already Premium Popup */}
      {showAlreadyPremiumPopup && (
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#0A66C2] to-[#004182] rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Você já é Premium! ⭐
            </h2>
            <p className="text-slate-600 text-lg mb-8">
              Sua conta já possui o plano <span className="font-bold text-[#0A66C2]">Premium</span> ativo.<br />
              Continue aproveitando todos os benefícios!
            </p>
            <button
              onClick={() => window.location.href = createPageUrl('Home')}
              className="w-full bg-gradient-to-r from-[#0A66C2] to-[#004182] hover:opacity-90 text-white font-semibold py-4 rounded-xl transition-all text-lg"
            >
              Ir para Início
            </button>
          </div>
        </div>
      )}
    </div>
  );
}