import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap, Star, MessageCircle, Users, UserPlus, Briefcase, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function Subscription() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Tentar carregar usuário em background, sem bloquear renderização
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (e) {
        // Usuário não autenticado - OK, página é pública
      }
    };
    
    loadUser();
  }, []);

  const handleSubscribePremium = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Premium clicked');
    const userName = user?.full_name || user?.email || 'interessado';
    const message = encodeURIComponent(`Olá! Sou ${userName} e gostaria de assinar o plano Premium por R$ 29,90 (pagamento único)`);
    const whatsappUrl = `https://wa.me/5583991971320?text=${message}`;
    console.log('Opening WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  };

  const handleSubscribeRecruiter = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Recruiter clicked');
    const userName = user?.full_name || user?.email || 'interessado';
    const message = encodeURIComponent(`Olá! Sou ${userName} e gostaria de assinar o plano Recrutador por R$ 9,90/mês`);
    const whatsappUrl = `https://wa.me/5583991971320?text=${message}`;
    console.log('Opening WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  };

  const handleChooseBasic = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Basic clicked');
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('User authenticated, updating to basic');
        await base44.auth.updateMe({ subscription_type: 'basic' });
        window.location.href = createPageUrl('Home');
      } else {
        console.log('User not authenticated, redirecting to login');
        sessionStorage.setItem('needs_login', 'true');
        sessionStorage.setItem('redirect_after_login', 'Home');
        window.location.href = createPageUrl('Splash');
      }
    } catch (e) {
      console.log('Error checking auth, redirecting to login');
      sessionStorage.setItem('needs_login', 'true');
      sessionStorage.setItem('redirect_after_login', 'Home');
      window.location.href = createPageUrl('Splash');
    }
  };

  const handleGoBack = () => {
    const lastRoute = localStorage.getItem('last_valid_route') || 'Home';
    window.location.href = createPageUrl(lastRoute);
  };

  const basicFeatures = [
    "100% Gratuito",
    "Acesso às vagas gratuitas",
    "Participar da comunidade",
    "Postar e comentar",
    "Acesso aos grupos"
  ];

  const premiumFeatures = [
    "Tudo do plano Básico",
    "Acesso a TODAS as vagas exclusivas",
    "Currículo Profissional completo",
    "Inbox de Mensagens",
    "Baixar currículo em PDF",
    "Pagamento único - acesso vitalício",
    "Garantia de 7 dias"
  ];

  const recruiterFeatures = [
    "Postar vagas normais",
    "Postar vagas por IA",
    "Postar vagas home office",
    "Postar notícias",
    "Postar na área social",
    "Editar suas postagens",
    "Enviar mensagens via Inbox",
    "Ver currículos de candidatos"
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#003399] pt-8 pb-16 px-4 relative">
        <Button
          onClick={handleGoBack}
          variant="ghost"
          className="absolute top-4 left-4 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
        <div className="max-w-5xl mx-auto text-center pt-8">
          <Badge className="bg-white/20 text-white border-0 mb-4 px-4 py-1">
            <Crown className="w-4 h-4 mr-2" />
            Escolha seu Plano
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Desbloqueie Todo o Potencial
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Tenha acesso a todas as funcionalidades exclusivas
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Basic Plan */}
          <Card className="shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden border-0 h-full">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Básico</h2>
              <p className="text-white/70 text-xs sm:text-sm">Participe da comunidade</p>
            </div>
            
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-green-600">GRÁTIS</span>
                <p className="text-slate-500 text-xs sm:text-sm">Apenas crie sua conta</p>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 min-h-[140px]">
                {basicFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                type="button"
                onClick={handleChooseBasic}
                variant="outline"
                className="w-full h-11 sm:h-12 font-semibold rounded-xl border-blue-500 text-blue-600 hover:bg-blue-50 text-sm sm:text-base cursor-pointer"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Escolher Básico
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden border-0 h-full relative">
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
              <Badge className="bg-yellow-400 text-yellow-900 border-0 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                Recomendado
              </Badge>
            </div>
            <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Premium</h2>
              <p className="text-white/70 text-xs sm:text-sm">Acesso completo</p>
            </div>
            
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-slate-800">R$ 29,90</span>
                <p className="text-slate-500 text-xs sm:text-sm">Pagamento único</p>
                <Badge variant="outline" className="mt-2 text-green-600 border-green-200 bg-green-50 text-xs px-2 py-0.5">
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  Garantia de 7 dias
                </Badge>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 min-h-[140px]">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                type="button"
                onClick={handleSubscribePremium}
                className="w-full h-11 sm:h-12 font-semibold bg-[#25D366] hover:bg-[#20bd5a] rounded-xl text-white text-sm sm:text-base cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Assinar Premium
              </Button>
            </CardContent>
          </Card>

          {/* Recruiter Plan */}
          <Card className="shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden border-0 ring-2 ring-purple-500 h-full relative">
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
              <Badge className="bg-purple-500 text-white border-0 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                Empresas
              </Badge>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Recrutador</h2>
              <p className="text-white/70 text-xs sm:text-sm">Para empresas e RH</p>
            </div>
            
            <CardContent className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-purple-600">R$ 9,90</span>
                <p className="text-slate-500 text-xs sm:text-sm">por mês</p>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 min-h-[140px]">
                {recruiterFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                type="button"
                onClick={handleSubscribeRecruiter}
                className="w-full h-11 sm:h-12 font-semibold bg-purple-600 hover:bg-purple-700 rounded-xl text-white text-sm sm:text-base cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Assinar Recrutador
              </Button>

              <p className="text-[10px] sm:text-xs text-center text-slate-500 mt-2 sm:mt-3">
                * Postagens sujeitas a aprovação do admin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">Acesso Imediato</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 text-center mb-6 sm:mb-8">Dúvidas Frequentes</h2>
        
        <div className="space-y-3 sm:space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">Qual a diferença entre Premium e Recrutador?</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                O Premium é para candidatos que querem acesso completo às vagas e currículo profissional. 
                O Recrutador é para empresas e RH que querem publicar vagas e contatar candidatos.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">Como funciona o plano Recrutador?</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                Com o plano Recrutador você pode publicar vagas, notícias e acessar currículos de candidatos.
                Suas postagens passam por aprovação do administrador antes de serem publicadas.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">O Premium é realmente vitalício?</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                Sim! Com o pagamento único de R$ 29,90, você terá acesso permanente a todas as funcionalidades,
                incluindo atualizações futuras.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">E se eu não gostar?</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                Oferecemos garantia de reembolso de 7 dias. Se não ficar satisfeito, devolvemos 100% do valor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}