import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap, Star, MessageCircle, Users, UserPlus, Briefcase, Sparkles, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

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

  const handleBasic = () => {
    sessionStorage.setItem('needs_login', 'true');
    sessionStorage.setItem('from_subscription', 'true');
    window.location.replace('https://vagasabertasparaiba.info/splash');
  };

  const handlePremium = () => {
    const message = 'Olá! Quero assinar o Plano Premium mensal de R$9,90 no aplicativo Vagas Abertas Paraíba.';
    window.open(`https://wa.me/5583991971320?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePremiumBlack = () => {
    const message = 'Olá! Quero adquirir o Plano Premium Limited Black vitalício por R$59,00 no aplicativo Vagas Abertas Paraíba.';
    window.open(`https://wa.me/5583991971320?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleRecruiter = () => {
    const message = 'Olá! Tenho interesse no Plano Recrutador mensal de R$9,90 no aplicativo Vagas Abertas Paraíba.';
    window.open(`https://wa.me/5583991971320?text=${encodeURIComponent(message)}`, '_blank');
  };

  const basicFeatures = [
    { text: "Visualizar vagas públicas", included: true },
    { text: "Candidatar-se às vagas disponíveis", included: true },
    { text: "Acesso ao feed da comunidade", included: true },
    { text: "Criar e editar perfil básico", included: true },
    { text: "Notificações de novas vagas", included: true },
    { text: "Sem acesso a vagas premium", included: false },
    { text: "Ferramentas profissionais limitadas", included: false },
    { text: "Exibição de anúncios", included: false },
  ];

  const premiumFeatures = [
    "Todas as vantagens do plano básico",
    "Acesso a vagas premium",
    "Vagas exclusivas de empresas parceiras",
    "Prioridade no suporte",
    "Ferramentas de currículo e carta de apresentação",
    "Navegação sem anúncios",
    "Acesso a cursos profissionalizantes"
  ];

  const premiumBlackFeatures = [
    "Todos os benefícios do Plano Premium",
    "Acesso vitalício (sem mensalidades)",
    "Prioridade máxima no suporte",
    "Acesso antecipado a novas funções",
    "Recursos e ferramentas exclusivas",
    "Perfil com destaque especial"
  ];

  const recruiterFeatures = [
    "Publicar vagas ilimitadas",
    "Gerenciar candidatos",
    "Destaque nas vagas publicadas",
    "Acesso a banco de talentos",
    "Contato direto com candidatos",
    "Painel exclusivo para recrutador"
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* PLANO BÁSICO */}
          <Card className="shadow-xl rounded-2xl overflow-hidden border-0 bg-white hover:shadow-2xl transition-all">
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-4 text-center relative">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-0.5">Básico</h2>
              <p className="text-white/80 text-xs">Para começar</p>
            </div>
            
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-green-600 mb-1">GRÁTIS</div>
                <p className="text-slate-500 text-xs">Para sempre</p>
              </div>

              <div className="space-y-2 mb-4">
                {basicFeatures.slice(0, 5).map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {feature.included ? (
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-2.5 h-2.5 text-red-600" />
                      </div>
                    )}
                    <span className={`text-xs ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleBasic}
                className="w-full h-10 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Usar Plano Gratuito
              </button>
            </CardContent>
          </Card>

          {/* PLANO PREMIUM */}
          <Card className="shadow-xl rounded-2xl overflow-hidden border-0 bg-white hover:shadow-2xl transition-all ring-2 ring-blue-400">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-center relative">
              <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 border-0 text-xs font-bold px-2 py-0.5">
                <Star className="w-2.5 h-2.5 mr-0.5" />
                Popular
              </Badge>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-0.5">Premium</h2>
              <p className="text-white/80 text-xs">Completo</p>
            </div>
            
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">R$ 9,90</div>
                <p className="text-slate-500 text-xs">por mês</p>
              </div>

              <div className="space-y-2 mb-4">
                {premiumFeatures.slice(0, 5).map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                    <span className="text-xs text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePremium}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Quero ser Premium
              </button>
            </CardContent>
          </Card>

          {/* PLANO PREMIUM BLACK */}
          <Card className="shadow-xl rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-black text-white hover:shadow-2xl transition-all ring-2 ring-purple-500">
            <div className="bg-gradient-to-br from-purple-900 to-purple-950 p-4 text-center relative">
              <Badge className="absolute top-2 right-2 bg-purple-500 text-white border-0 text-xs font-bold px-2 py-0.5">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Limitado
              </Badge>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-7 h-7 text-purple-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-0.5">Premium Black</h2>
              <p className="text-purple-200 text-xs">Vitalício</p>
            </div>
            
            <CardContent className="p-4 bg-gradient-to-br from-slate-900 to-black">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-purple-400 mb-1">R$ 59,00</div>
                <p className="text-purple-200 text-xs">pagamento único</p>
              </div>

              <div className="space-y-2 mb-4">
                {premiumBlackFeatures.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                    <span className="text-xs text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePremiumBlack}
                className="w-full h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Premium Black Vitalício
              </button>
            </CardContent>
          </Card>

          {/* PLANO RECRUTADOR */}
          <Card className="shadow-xl rounded-2xl overflow-hidden border-0 bg-white hover:shadow-2xl transition-all ring-2 ring-orange-400">
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-4 text-center relative">
              <Badge className="absolute top-2 right-2 bg-orange-200 text-orange-900 border-0 text-xs font-bold px-2 py-0.5">
                <Briefcase className="w-2.5 h-2.5 mr-0.5" />
                Empresas
              </Badge>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-0.5">Recrutador</h2>
              <p className="text-white/80 text-xs">Para RH</p>
            </div>
            
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-orange-600 mb-1">R$ 9,90</div>
                <p className="text-slate-500 text-xs">por mês</p>
              </div>

              <div className="space-y-2 mb-4">
                {recruiterFeatures.slice(0, 5).map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-orange-600" />
                    </div>
                    <span className="text-xs text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleRecruiter}
                className="w-full h-10 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Plano Recrutador
              </button>
            </CardContent>
          </Card>
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