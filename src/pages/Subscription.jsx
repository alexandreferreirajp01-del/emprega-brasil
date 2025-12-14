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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
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

    let message = plan.whatsapp_message || 
      `Olá! Quero assinar o plano ${plan.name} por R$${plan.price.toFixed(2)} no aplicativo Vagas Abertas Paraíba.`;
    
    message = message
      .replace(/{nome}/g, plan.name)
      .replace(/{preco}/g, `R$${plan.price.toFixed(2)}`);

    window.open(`https://wa.me/5583991971320?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 pt-8 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-0 mb-3 px-3 py-1.5 text-sm">
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Planos e Preços
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Escolha o plano ideal para você
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-2xl mx-auto">
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
            
            return (
              <Card 
                key={plan.id} 
                className={`shadow-xl rounded-2xl overflow-hidden border-0 ${isBlack ? 'bg-gradient-to-br from-slate-900 to-black text-white' : 'bg-white'} hover:shadow-2xl transition-all ${plan.is_featured ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className={`bg-gradient-to-br ${plan.color} p-4 text-center relative`}>
                  {plan.badge_text && (
                    <Badge className={`absolute top-2 right-2 ${plan.badge_color} border-0 text-xs font-bold px-2 py-0.5`}>
                      {plan.badge_text}
                    </Badge>
                  )}
                  <div className={`w-12 h-12 ${isBlack ? 'bg-white/10' : 'bg-white/20'} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-0.5">{plan.name}</h2>
                  <p className={`${isBlack ? 'text-purple-200' : 'text-white/80'} text-xs`}>{plan.description}</p>
                </div>
                
                <CardContent className={`p-4 ${isBlack ? 'bg-gradient-to-br from-slate-900 to-black' : ''}`}>
                  <div className="text-center mb-4">
                    <div className={`text-3xl font-bold ${isBlack ? 'text-purple-400' : plan.billing_cycle === 'free' ? 'text-green-600' : 'text-blue-600'} mb-1`}>
                      {plan.billing_cycle === 'free' ? 'GRÁTIS' : `R$ ${plan.price.toFixed(2)}`}
                    </div>
                    <p className={`${isBlack ? 'text-purple-200' : 'text-slate-500'} text-xs`}>
                      {plan.billing_cycle === 'monthly' ? 'por mês' : 
                       plan.billing_cycle === 'lifetime' ? 'pagamento único' : 
                       'Para sempre'}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features?.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-4 h-4 rounded-full ${isBlack ? 'bg-purple-500/20' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className={`w-2.5 h-2.5 ${isBlack ? 'text-purple-400' : 'text-blue-600'}`} />
                        </div>
                        <span className={`text-xs ${isBlack ? 'text-slate-200' : 'text-slate-700'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full h-10 ${
                      isBlack 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                        : plan.billing_cycle === 'free'
                        ? 'bg-slate-600 hover:bg-slate-700'
                        : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                    } text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2`}
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
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span className="text-xs font-medium">Ativação Imediata</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium">Suporte via WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}