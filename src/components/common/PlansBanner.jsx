import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle, ChevronRight, Star, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function PlansBanner() {
  const { data: plans = [] } = useQuery({
    queryKey: ['active-plans-banner'],
    queryFn: async () => {
      const allPlans = await base44.entities.Plan.list('order', 100);
      return allPlans.filter(p => p.is_active).slice(0, 3);
    }
  });

  if (plans.length === 0) return null;

  return (
    <Card 
      className="rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700 cursor-pointer hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 overflow-hidden relative"
      onClick={() => window.location.href = createPageUrl('Subscription')}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl leading-tight">Planos Premium</h3>
              <p className="text-white/90 text-sm">Escolha o plano ideal para você</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white" />
        </div>
        
        <div className={`grid ${plans.length === 3 ? 'grid-cols-3' : plans.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-4`}>
          {plans.map((plan, idx) => {
            const isBlack = plan.color?.includes('slate-900') || plan.color?.includes('black');
            return (
              <div 
                key={plan.id}
                className={`${
                  isBlack 
                    ? 'bg-gradient-to-br from-purple-700 to-purple-900' 
                    : idx === 1 
                    ? 'bg-white/30 backdrop-blur-sm border-2 border-yellow-300' 
                    : 'bg-white/20 backdrop-blur-sm'
                } rounded-lg p-3 text-center`}
              >
                <div className={`${isBlack ? 'text-purple-200' : idx === 1 ? 'text-yellow-200' : 'text-white/90'} text-xs mb-1 flex items-center justify-center gap-1`}>
                  {plan.is_featured && <Star className="w-2.5 h-2.5" />}
                  {plan.badge_text || plan.name.split(' ')[0]}
                </div>
                <div className="text-white font-bold text-base">
                  {plan.billing_cycle === 'free' ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2 text-white/90 text-xs mb-3">
          <CheckCircle className="w-4 h-4 text-green-300" />
          <span>Acesso a vagas exclusivas</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs mb-3">
          <CheckCircle className="w-4 h-4 text-green-300" />
          <span>Ferramentas profissionais completas</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs mb-4">
          <CheckCircle className="w-4 h-4 text-green-300" />
          <span>Suporte prioritário via WhatsApp</span>
        </div>
        
        <Button className="w-full bg-white text-blue-600 hover:bg-white/90 rounded-xl font-bold h-11 shadow-lg">
          <Crown className="w-4 h-4 mr-2" />
          Ver Todos os Planos
        </Button>
      </CardContent>
    </Card>
  );
}