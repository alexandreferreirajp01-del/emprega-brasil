import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Crown, Check, Loader2, Briefcase, FileText, MessageSquare, 
  Shield, Zap, Eye, CreditCard, Smartphone, Barcode, Handshake,
  Target, Users, TrendingUp, Award, ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function ModernCheckoutModal({ isOpen, onClose, user, onSuccess, initialPlan = 'premium' }) {
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = {
    basic: {
      name: 'Básico',
      price: 'Grátis',
      period: 'Para sempre',
      subtitle: 'Acesso Limitado',
      icon: Users,
      color: 'slate',
      benefits: [
        { icon: Eye, text: 'Visualizar vagas públicas' },
        { icon: Briefcase, text: 'Candidatar-se às vagas' },
        { icon: MessageSquare, text: 'Acesso ao feed da comunidade' },
      ],
      limitations: [
        'Sem acesso a vagas premium',
        'Anúncios visíveis',
        'Ferramentas limitadas'
      ]
    },
    premium: {
      name: 'Premium',
      price: 'R$ 29,90',
      period: 'Pagamento único',
      subtitle: 'Acesso Vitalício',
      icon: Crown,
      color: 'purple',
      benefits: [
        { icon: Zap, text: 'Acesso vitalício às vagas premium' },
        { icon: Briefcase, text: 'Vagas exclusivas de empresas parceiras' },
        { icon: Shield, text: 'Prioridade no suporte' },
        { icon: FileText, text: 'Ferramentas de currículo e carta' },
        { icon: Eye, text: 'Navegação sem anúncios' },
        { icon: Award, text: 'Acesso a cursos profissionalizantes' },
        { icon: TrendingUp, text: 'Aplicativos de renda extra exclusivos' },
        { icon: Users, text: 'Comunidade premium de networking' },
      ]
    },
    recruiter: {
      name: 'Recrutador',
      price: 'R$ 9,90',
      period: 'Por mês',
      subtitle: 'Para empresas',
      icon: Briefcase,
      color: 'blue',
      benefits: [
        { icon: Target, text: 'Postar vagas ilimitadas' },
        { icon: FileText, text: 'Acessar currículos dos candidatos' },
        { icon: MessageSquare, text: 'Enviar mensagens aos usuários' },
        { icon: Users, text: 'Painel exclusivo para empresas' },
        { icon: TrendingUp, text: 'Prioridade nas buscas' },
        { icon: Award, text: 'Selo de "Vaga Verificada"' },
      ]
    }
  };

  const currentPlan = plans[selectedPlan];

  const paymentMethods = [
    { id: 'pix', name: 'PIX', icon: Smartphone, desc: 'Aprovação instantânea' },
    { id: 'credit_card', name: 'Cartão', icon: CreditCard, desc: selectedPlan === 'recruiter' ? 'Renovação automática' : 'Até 12x sem juros' },
    { id: 'boleto', name: 'Boleto', icon: Barcode, desc: selectedPlan === 'recruiter' ? 'Mensal' : 'À vista' },
  ];

  const handleSubscribe = async () => {
    if (!user && !localStorage.getItem('vagas_abertas_visitor_mode')) {
      window.location.href = createPageUrl('Splash');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const subscriptionType = selectedPlan === 'premium' ? 'premium' : 'recruiter';
      const price = selectedPlan === 'premium' ? 29.90 : 9.90;

      // Criar registro de pagamento pendente
      await base44.entities.Payment.create({
        user_email: user?.email || 'visitor@temp.com',
        amount: price,
        status: 'pending',
        payment_method: paymentMethod,
        notes: `Assinatura ${currentPlan.name} - ${paymentMethod}`
      });

      // Mensagem WhatsApp
      const whatsappMessage = `🌟 *Nova Assinatura - ${currentPlan.name}*\n\n` +
        `👤 *Cliente:* ${user?.full_name || 'Visitante'}\n` +
        `📧 *Email:* ${user?.email || 'N/A'}\n` +
        `💳 *Plano:* ${currentPlan.name} - ${currentPlan.price}\n` +
        `💰 *Método:* ${paymentMethods.find(m => m.id === paymentMethod)?.name}\n` +
        `\n✅ *Aguardando confirmação de pagamento*`;

      const whatsappURL = `https://wa.me/5583991971320?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappURL, '_blank');

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 border-b p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">Escolha seu Plano</DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Banner Parcerias */}
          <Card 
            className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => window.location.href = createPageUrl('Parcerias')}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Handshake className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Seja Parceiro</h3>
                  <p className="text-white/90 text-sm">Empresas têm benefícios exclusivos. Clique aqui.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white" />
            </CardContent>
          </Card>

          {/* Seleção de Planos */}
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(plans).map(([key, plan]) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === key;
              const isFree = key === 'basic';
              return (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? `border-2 border-${plan.color}-600 shadow-lg` 
                      : 'border-2 border-transparent hover:border-slate-200'
                  } ${isFree ? 'opacity-90' : ''}`}
                  onClick={() => !isFree && setSelectedPlan(key)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-${plan.color}-100 rounded-xl flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <p className="text-sm text-slate-500">{plan.subtitle}</p>
                        </div>
                      </div>
                      {isSelected && !isFree && (
                        <div className={`w-6 h-6 bg-${plan.color}-600 rounded-full flex items-center justify-center`}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="text-3xl font-bold text-slate-800">{plan.price}</div>
                      <div className="text-sm text-slate-500">{plan.period}</div>
                    </div>

                    <div className="space-y-2">
                      {plan.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <benefit.icon className={`w-4 h-4 text-${plan.color}-600 flex-shrink-0`} />
                          <span className="text-slate-700">{benefit.text}</span>
                        </div>
                      ))}
                      {plan.limitations && (
                        <div className="pt-2 mt-2 border-t space-y-1">
                          {plan.limitations.map((limit, i) => (
                            <div key={i} className="text-xs text-slate-400">• {limit}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Métodos de Pagamento */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Método de Pagamento</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                      <method.icon className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-slate-500">{method.desc}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>



          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Ação */}
          <div className="space-y-3">
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-[#1E6FB6] hover:bg-[#0B2F5B]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <currentPlan.icon className="w-5 h-5 mr-2" />
                  Assinar {currentPlan.name} - {currentPlan.price}
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4" />
              <span>Garantia de 7 dias ou seu dinheiro de volta</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}