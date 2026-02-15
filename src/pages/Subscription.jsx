import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap, MessageCircle, Sparkles, X, Briefcase, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const ICON_MAP = {
  Crown: Crown,
  Sparkles: Sparkles,
  Briefcase: Briefcase,
  Users: Users
};

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showAlreadyPremiumPopup, setShowAlreadyPremiumPopup] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
          
          // Verificar se há parâmetro status=ativo na URL
          const urlParams = new URLSearchParams(window.location.search);
          const status = urlParams.get('status');
          
          if (status === 'ativo') {
            const isPremium = currentUser?.subscription_type === 'premium' || 
              currentUser?.subscription_type === 'admin' || 
              currentUser?.role === 'admin';
            
            if (isPremium) {
              setShowAlreadyPremiumPopup(true);
              window.history.replaceState({}, '', window.location.pathname);
            } else {
              // Ativar Premium
              await base44.auth.updateMe({ subscription_type: 'premium' });
              setShowSuccessPopup(true);
              window.history.replaceState({}, '', window.location.pathname);
              
              // Recarregar usuário
              setTimeout(async () => {
                const updatedUser = await base44.auth.me();
                setUser(updatedUser);
              }, 500);
            }
          }
        }
      } catch (e) {
        console.log('Não autenticado - OK');
      }
    };
    loadUser();
  }, []);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['active-plans'],
    queryFn: async () => {
      const allPlans = await base44.entities.Plan.list('order', 100);
      return allPlans.filter(p => p.is_active);
    }
  });

  const handlePlanClick = (plan) => {
    if (plan.billing_cycle === 'free') {
      sessionStorage.setItem('needs_login', 'true');
      sessionStorage.setItem('from_subscription', 'true');
      window.location.replace('https://vagasabertasparaiba.info/splash');
      return;
    }

    // Redirecionar para Mercado Pago baseado no plano
    const mercadoPagoLinks = {
      '9.90': 'https://mpago.la/2QMKuFo',
      '19.90': 'https://mpago.la/2QMKuFo',
      '27.00': 'https://mpago.la/1EwRFu9'
    };

    const priceKey = plan.price.toFixed(2);
    const link = mercadoPagoLinks[priceKey] || mercadoPagoLinks['27.00'];
    
    window.open(link, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1E6FB6] via-[#0B2F5B] to-[#0B2F5B] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-8 pb-20 px-4 transition-colors">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-0 mb-3 px-3 py-1.5 text-sm">
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Planos e Preços
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Escolha o plano ideal para você
          </h1>
          <p className="text-white/90 dark:text-slate-300 text-sm md:text-base max-w-2xl mx-auto">
            Tenha acesso às melhores oportunidades e ferramentas exclusivas para impulsionar sua carreira.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-14 pb-12">
        <div className={`grid grid-cols-1 ${plans.length === 2 ? 'md:grid-cols-2' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
          {plans.map((plan) => {
            const Icon = ICON_MAP[plan.icon] || Crown;
            const isBlack = plan.color?.includes('slate-900') || plan.color?.includes('black');
            const hasCustomGradient = plan.custom_gradient_start && plan.custom_gradient_end;
            const hasCustomBadge = plan.custom_badge_bg && plan.custom_badge_text;
            
            return (
              <Card 
                key={plan.id} 
                className={`shadow-xl rounded-2xl overflow-hidden border-0 ${isBlack ? 'bg-gradient-to-br from-slate-900 to-black text-white' : 'bg-white dark:bg-slate-800 dark:border-slate-700'} hover:shadow-2xl transition-all ${plan.is_featured ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
              >
                <div 
                  className={`p-4 text-center relative ${!hasCustomGradient ? `bg-gradient-to-br ${plan.color}` : ''}`}
                  style={hasCustomGradient ? {
                    background: `linear-gradient(to bottom right, ${plan.custom_gradient_start}, ${plan.custom_gradient_end})`
                  } : {}}
                >
                  {plan.badge_text && (
                    <Badge 
                      className={`absolute top-2 right-2 border-0 text-xs font-bold px-2 py-0.5 ${!hasCustomBadge ? plan.badge_color : ''}`}
                      style={hasCustomBadge ? {
                        backgroundColor: plan.custom_badge_bg,
                        color: plan.custom_badge_text
                      } : {}}
                    >
                      {plan.badge_text}
                    </Badge>
                  )}
                  <div className={`w-12 h-12 ${isBlack ? 'bg-white/10' : 'bg-white/20'} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-0.5">{plan.name}</h2>
                  <p className={`${isBlack ? 'text-purple-200' : 'text-white/80'} text-xs`}>{plan.description}</p>
                </div>
                
                <CardContent className={`p-4 ${isBlack ? 'bg-gradient-to-br from-slate-900 to-black' : 'dark:bg-slate-800'}`}>
                  <div className="text-center mb-4">
                    <div className={`text-3xl font-bold ${isBlack ? 'text-purple-400' : plan.billing_cycle === 'free' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'} mb-1`}>
                      {plan.billing_cycle === 'free' ? 'GRÁTIS' : `R$ ${plan.price.toFixed(2)}`}
                    </div>
                    <p className={`${isBlack ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'} text-xs`}>
                      {plan.billing_cycle === 'monthly' ? 'por mês' : 
                       plan.billing_cycle === 'lifetime' ? 'pagamento único' : 
                       'Para sempre'}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features?.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-4 h-4 rounded-full ${isBlack ? 'bg-purple-500/20' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className={`w-2.5 h-2.5 ${isBlack ? 'text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
                        </div>
                        <span className={`text-xs ${isBlack ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full h-10 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      isBlack 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                        : plan.billing_cycle === 'free'
                        ? 'bg-slate-600 hover:bg-slate-700'
                        : !hasCustomGradient ? `bg-gradient-to-r ${plan.color} hover:opacity-90` : ''
                    }`}
                    style={hasCustomGradient && !isBlack && plan.billing_cycle !== 'free' ? {
                      background: `linear-gradient(to right, ${plan.custom_gradient_start}, ${plan.custom_gradient_end})`
                    } : {}}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {plan.billing_cycle === 'free' ? 'Usar Plano Gratuito' : `Quero ${plan.name.split(' ')[0]}`}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium">Ativação Imediata</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium">Suporte via WhatsApp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Parabéns! 🎉
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Você agora é um membro <span className="font-bold text-purple-600 dark:text-purple-400">Premium</span>! Aproveite todos os benefícios exclusivos.
              </p>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  window.location.reload();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Começar Agora
              </button>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  window.location.reload();
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already Premium Popup */}
      {showAlreadyPremiumPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Você já é Premium! ⭐
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Sua conta já possui o plano <span className="font-bold text-purple-600 dark:text-purple-400">Premium</span> ativo. Continue aproveitando todos os benefícios!
              </p>
              <button
                onClick={() => setShowAlreadyPremiumPopup(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Entendi
              </button>
              <button
                onClick={() => setShowAlreadyPremiumPopup(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}