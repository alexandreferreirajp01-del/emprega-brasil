import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap, Star, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Subscription() {
  const handleSubscribe = () => {
    const message = encodeURIComponent("Olá! Quero adquirir o plano vitalício da Workly.");
    window.open(`https://wa.me/5583991971320?text=${message}`, '_blank');
  };

  const features = [
    "Acesso ilimitado a todas as vagas",
    "Vagas exclusivas para assinantes",
    "Alertas de novas vagas",
    "Acesso aos grupos exclusivos",
    "Suporte prioritário",
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

      {/* Plan Card */}
      <div className="max-w-lg mx-auto px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-2xl rounded-3xl overflow-hidden border-0">
            <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Plano Vitalício</h2>
              <p className="text-white/70">Pagamento único, acesso para sempre</p>
            </div>
            
            <CardContent className="p-8">
              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-800">R$ 29,90</span>
                </div>
                <p className="text-slate-500">Pagamento único</p>
                <Badge variant="outline" className="mt-3 text-green-600 border-green-200 bg-green-50">
                  <Shield className="w-3 h-3 mr-1" />
                  Garantia de 7 dias
                </Badge>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-slate-700">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Subscribe Button */}
              <Button 
                onClick={handleSubscribe}
                className="w-full h-14 text-lg font-semibold bg-[#25D366] hover:bg-[#20bd5a] rounded-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Assinar via WhatsApp
              </Button>

              <p className="text-center text-sm text-slate-500 mt-4">
                Ao clicar, você será redirecionado para o WhatsApp
              </p>
            </CardContent>
          </Card>
        </motion.div>

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
              <h3 className="font-semibold text-slate-800 mb-2">Como funciona o pagamento?</h3>
              <p className="text-slate-600">
                Ao clicar em "Assinar via WhatsApp", você será redirecionado para conversar conosco. 
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