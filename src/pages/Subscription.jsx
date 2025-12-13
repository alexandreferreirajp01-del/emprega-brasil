import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap, Star, MessageCircle, Users, UserPlus, Briefcase } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Subscription() {
  const faqSectionRef = useRef(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: 'smooth' 
    });
  };

  const handleSubscribePremium = () => {
    scrollToBottom();
    setTimeout(() => {
      window.location.href = createPageUrl('Payment');
    }, 600);
  };

  const handleSubscribeRecruiter = () => {
    scrollToBottom();
    setTimeout(() => {
      const message = encodeURIComponent('Olá! Gostaria de assinar o plano Recrutador por R$ 9,90/mês');
      window.open(`https://wa.me/5583991971320?text=${message}`, '_blank');
    }, 600);
  };

  const handleChooseBasic = async () => {
    localStorage.removeItem('vagas_abertas_visitor_mode');
    
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        await base44.auth.updateMe({ subscription_type: 'basic' });
        window.location.href = createPageUrl('Home');
      } else {
        localStorage.setItem('pending_subscription', 'basic');
        base44.auth.redirectToLogin(createPageUrl('ActivateBasic'));
      }
    } catch (e) {
      localStorage.setItem('pending_subscription', 'basic');
      base44.auth.redirectToLogin(createPageUrl('ActivateBasic'));
    }
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
      <div className="bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] pt-8 pb-16 px-4 relative">
        <Button
          onClick={() => window.location.href = createPageUrl('Home')}
          variant="ghost"
          className="absolute top-4 left-4 text-white hover:bg-white/10"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Button>
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
          </motion.div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl rounded-3xl overflow-hidden border-0 h-full">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Membro Básico</h2>
                <p className="text-white/70 text-sm">Participe da comunidade</p>
              </div>
              
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold text-green-600">GRÁTIS</span>
                  <p className="text-slate-500 text-sm">Apenas crie sua conta</p>
                </div>

                <div className="space-y-3 mb-6">
                  {basicFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleChooseBasic}
                  variant="outline"
                  className="w-full h-12 font-semibold rounded-xl border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Escolher Básico
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
          >
           <Card className="shadow-xl rounded-3xl overflow-hidden border-0 h-full relative">
             <div className="absolute top-4 right-4">
               <Badge className="bg-yellow-400 text-yellow-900 border-0">
                 <Star className="w-3 h-3 mr-1" />
                 Recomendado
               </Badge>
             </div>
              <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Membro Premium</h2>
                <p className="text-white/70 text-sm">Acesso completo</p>
              </div>
              
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold text-slate-800">R$ 29,90</span>
                  <p className="text-slate-500 text-sm">Pagamento único</p>
                  <Badge variant="outline" className="mt-2 text-green-600 border-green-200 bg-green-50 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Garantia de 7 dias
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleSubscribePremium}
                  className="w-full h-12 font-semibold bg-[#25D366] hover:bg-[#20bd5a] rounded-xl"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Assinar Premium
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recruiter Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-xl rounded-3xl overflow-hidden border-0 ring-2 ring-purple-500 h-full relative">
              <div className="absolute top-4 right-4">
                <Badge className="bg-purple-500 text-white border-0">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Empresas
                </Badge>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Recrutador</h2>
                <p className="text-white/70 text-sm">Para empresas e RH</p>
              </div>
              
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold text-purple-600">R$ 9,90</span>
                  <p className="text-slate-500 text-sm">por mês</p>
                </div>

                <div className="space-y-3 mb-6">
                  {recruiterFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleSubscribeRecruiter}
                  className="w-full h-12 font-semibold bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Assinar Recrutador
                </Button>

                <p className="text-xs text-center text-slate-500 mt-3">
                  * Postagens sujeitas a aprovação do admin
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm">Acesso Imediato</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div ref={faqSectionRef} className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Dúvidas Frequentes</h2>
        
        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">Qual a diferença entre Premium e Recrutador?</h3>
              <p className="text-slate-600">
                O Premium é para candidatos que querem acesso completo às vagas e currículo profissional. 
                O Recrutador é para empresas e RH que querem publicar vagas e contatar candidatos.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">Como funciona o plano Recrutador?</h3>
              <p className="text-slate-600">
                Com o plano Recrutador você pode publicar vagas, notícias e acessar currículos de candidatos.
                Suas postagens passam por aprovação do administrador antes de serem publicadas.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">O Premium é realmente vitalício?</h3>
              <p className="text-slate-600">
                Sim! Com o pagamento único de R$ 29,90, você terá acesso permanente a todas as funcionalidades,
                incluindo atualizações futuras.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">E se eu não gostar?</h3>
              <p className="text-slate-600">
                Oferecemos garantia de reembolso de 7 dias. Se não ficar satisfeito, devolvemos 100% do valor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}