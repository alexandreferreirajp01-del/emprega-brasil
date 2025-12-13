import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap, Star, MessageCircle, Users, UserPlus, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (e) {
        console.log('Erro ao carregar usuário:', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleBasic = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        await base44.auth.updateMe({ subscription_type: 'basic' });
        window.location.href = '/info/Home';
      } else {
        sessionStorage.setItem('needs_login', 'true');
        window.location.href = '/info/Splash';
      }
    } catch (error) {
      console.error('Erro ao ativar básico:', error);
      sessionStorage.setItem('needs_login', 'true');
      window.location.href = '/info/Splash';
    }
  };

  const handlePremium = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const userName = user?.full_name || user?.email || 'interessado';
    const message = `Olá! Sou ${userName} e gostaria de assinar o plano Premium por R$ 29,90 (pagamento único)`;
    const whatsappUrl = `https://wa.me/5583991971320?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRecruiter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const userName = user?.full_name || user?.email || 'interessado';
    const message = `Olá! Sou ${userName} e gostaria de assinar o plano Recrutador por R$ 9,90/mês`;
    const whatsappUrl = `https://wa.me/5583991971320?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
    <div className="min-h-screen bg-slate-50 pb-20" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 pt-8 pb-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-0 mb-4 px-4 py-1.5 inline-flex items-center">
            <Crown className="w-4 h-4 mr-2" />
            Escolha seu Plano
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Desbloqueie Todo o Potencial
          </h1>
          <p className="text-white/80 text-lg">
            Tenha acesso a todas as funcionalidades exclusivas
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BÁSICO */}
          <Card className="shadow-xl rounded-2xl overflow-hidden border-0 bg-white">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Básico</h2>
              <p className="text-white/70 text-sm">Participe da comunidade</p>
            </div>
            
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-green-600 mb-2">GRÁTIS</div>
                <p className="text-slate-500 text-sm">Apenas crie sua conta</p>
              </div>

              <div className="space-y-3 mb-8" style={{ minHeight: '200px' }}>
                {basicFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleBasic}
                onTouchEnd={handleBasic}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                style={{ cursor: 'pointer', touchAction: 'manipulation' }}
              >
                <UserPlus className="w-5 h-5" />
                Escolher Básico
              </button>
            </CardContent>
          </Card>

          {/* PREMIUM */}
          <Card className="shadow-2xl rounded-2xl overflow-hidden border-0 ring-2 ring-yellow-400 relative bg-white">
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-yellow-400 text-yellow-900 border-0 font-semibold inline-flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Recomendado
              </Badge>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Premium</h2>
              <p className="text-white/70 text-sm">Acesso completo</p>
            </div>
            
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-slate-800 mb-2">R$ 29,90</div>
                <p className="text-slate-500 text-sm mb-3">Pagamento único</p>
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 inline-flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Garantia de 7 dias
                </Badge>
              </div>

              <div className="space-y-3 mb-8" style={{ minHeight: '200px' }}>
                {premiumFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePremium}
                onTouchEnd={handlePremium}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                style={{ cursor: 'pointer', touchAction: 'manipulation' }}
              >
                <MessageCircle className="w-5 h-5" />
                Assinar Premium
              </button>
            </CardContent>
          </Card>

          {/* RECRUTADOR */}
          <Card className="shadow-xl rounded-2xl overflow-hidden border-0 ring-2 ring-purple-500 relative bg-white">
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-purple-500 text-white border-0 font-semibold inline-flex items-center">
                <Briefcase className="w-3 h-3 mr-1" />
                Empresas
              </Badge>
            </div>
            
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Recrutador</h2>
              <p className="text-white/70 text-sm">Para empresas e RH</p>
            </div>
            
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">R$ 9,90</div>
                <p className="text-slate-500 text-sm">por mês</p>
              </div>

              <div className="space-y-3 mb-8" style={{ minHeight: '200px' }}>
                {recruiterFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRecruiter}
                onTouchEnd={handleRecruiter}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                style={{ cursor: 'pointer', touchAction: 'manipulation' }}
              >
                <MessageCircle className="w-5 h-5" />
                Assinar Recrutador
              </button>

              <p className="text-xs text-center text-slate-500 mt-3">
                * Postagens sujeitas a aprovação do admin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">Acesso Imediato</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-10">
          Dúvidas Frequentes
        </h2>
        
        <div className="space-y-4">
          <Card className="rounded-xl bg-white">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                Qual a diferença entre Premium e Recrutador?
              </h3>
              <p className="text-slate-600 text-sm">
                O Premium é para candidatos que querem acesso completo às vagas e currículo profissional. 
                O Recrutador é para empresas e RH que querem publicar vagas e contatar candidatos.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl bg-white">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                Como funciona o plano Recrutador?
              </h3>
              <p className="text-slate-600 text-sm">
                Com o plano Recrutador você pode publicar vagas, notícias e acessar currículos de candidatos.
                Suas postagens passam por aprovação do administrador antes de serem publicadas.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl bg-white">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                O Premium é realmente vitalício?
              </h3>
              <p className="text-slate-600 text-sm">
                Sim! Com o pagamento único de R$ 29,90, você terá acesso permanente a todas as funcionalidades.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl bg-white">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">
                E se eu não gostar?
              </h3>
              <p className="text-slate-600 text-sm">
                Oferecemos garantia de reembolso de 7 dias. Se não ficar satisfeito, devolvemos 100% do valor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}