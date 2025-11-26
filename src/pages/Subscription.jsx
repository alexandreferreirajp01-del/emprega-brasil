import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap, Star, MessageCircle, Users, UserPlus } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function Subscription() {
  const handleSubscribePremium = () => {
    const message = encodeURIComponent("Olá! Quero adquirir o plano PREMIUM vitalício do Vagas Abertas Paraíba.");
    window.open(`https://wa.me/5583991971320?text=${message}`, '_blank');
  };

  const handleCreateAccount = () => {
    localStorage.removeItem('vagas_abertas_visitor_mode');
    window.location.href = createPageUrl('Splash');
  };

  const basicFeatures = [
    "100% Gratuito",
    "Acesso às vagas gratuitas",
    "Participar da comunidade",
    "Postar e comentar",
    "Acesso aos grupos",
    "Basta criar uma conta"
  ];

  const premiumFeatures = [
    "Tudo do plano Básico",
    "Acesso a TODAS as vagas (exclusivas)",
    "Vagas Premium desbloqueadas",
    "Suporte prioritário",
    "Alertas de novas vagas",
    "Pagamento único - acesso vitalício",
    "Garantia de reembolso de 7 dias"
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] pt-8 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-white/20 text-white border-0 mb-4 px-4 py-1">
              <Crown className="w-4 h-4 mr-2" />
              Plano Premium
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Desbloqueie Todo o Potencial
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Tenha acesso a todas as vagas exclusivas e encontre sua oportunidade ideal
            </p>
          </motion.div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-2 gap-6">
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
                  onClick={handleCreateAccount}
                  variant="outline"
                  className="w-full h-12 font-semibold rounded-xl border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Criar Conta Grátis
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
            <Card className="shadow-2xl rounded-3xl overflow-hidden border-0 ring-2 ring-[#0056ff] h-full relative">
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
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Dúvidas Frequentes</h2>
        
        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">Qual a diferença entre Visitante e Básico?</h3>
              <p className="text-slate-600">
                O visitante pode apenas visualizar o aplicativo. Já o membro Básico (gratuito) pode participar 
                da comunidade, postar, comentar e acessar os grupos. Basta criar uma conta!
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">Como funciona o pagamento Premium?</h3>
              <p className="text-slate-600">
                Ao clicar em "Assinar Premium", você será redirecionado para conversar conosco via WhatsApp. 
                O pagamento é feito de forma segura e seu acesso é liberado imediatamente após a confirmação.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">O acesso é realmente vitalício?</h3>
              <p className="text-slate-600">
                Sim! Com o pagamento único de R$ 29,90, você terá acesso permanente a todas as funcionalidades 
                da plataforma, incluindo atualizações futuras.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-800 mb-2">E se eu não gostar?</h3>
              <p className="text-slate-600">
                Oferecemos garantia de reembolso de 7 dias. Se por qualquer motivo você não ficar satisfeito, 
                devolvemos 100% do valor pago, sem perguntas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}