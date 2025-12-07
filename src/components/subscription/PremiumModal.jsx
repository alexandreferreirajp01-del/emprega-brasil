import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, CreditCard, Zap, CheckCircle, X, Loader2,
  Shield, Star, Briefcase, MessageCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PremiumModal({ isOpen, onClose, user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');

  const features = [
    { icon: Zap, text: 'Acesso vitalício a todas as vagas premium' },
    { icon: Briefcase, text: 'Vagas exclusivas de empresas parceiras' },
    { icon: MessageCircle, text: 'Prioridade no suporte' },
    { icon: Star, text: 'Ferramentas de currículo e carta' },
    { icon: Shield, text: 'Sem anúncios' }
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      // Para sandbox/teste: ativar premium diretamente
      // Em produção, integrar com gateway de pagamento
      
      // Atualizar usuário para Premium
      await base44.auth.updateMe({ 
        subscription_type: 'premium',
        premium_since: new Date().toISOString(),
        premium_expires: null // vitalício
      });

      // Criar registro de pagamento
      await base44.entities.Payment.create({
        user_email: user.email,
        amount: 29.90,
        status: 'approved',
        payment_method: paymentMethod,
        notes: couponCode ? `Cupom: ${couponCode}` : 'Ativação Premium'
      });

      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 500));

      onSuccess?.();
      onClose();
      
      // Recarregar página para atualizar todas as permissões
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Erro ao assinar:', err);
      setError('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-7 h-7 text-yellow-500" />
            Seja Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preço */}
          <div className="text-center p-6 bg-gradient-to-br from-[#0056ff] to-[#003399] rounded-2xl text-white">
            <div className="text-5xl font-bold mb-2">R$ 29,90</div>
            <div className="text-white/80 text-sm">Pagamento único • Acesso vitalício</div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-slate-700">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Métodos de Pagamento */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Método de Pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'pix' 
                    ? 'border-[#0056ff] bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-800">PIX</div>
                <div className="text-xs text-slate-500">Aprovação instantânea</div>
              </button>
              <button
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'credit_card' 
                    ? 'border-[#0056ff] bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-800">Cartão</div>
                <div className="text-xs text-slate-500">Em até 12x</div>
              </button>
            </div>
          </div>

          {/* Cupom */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Cupom de Desconto (opcional)</label>
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Digite o código"
              className="rounded-xl h-11"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex-1 h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Confirmar Assinatura
                </>
              )}
            </Button>
          </div>

          {/* Garantia */}
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Shield className="w-4 h-4" />
            <span>Garantia de 7 dias • Pagamento seguro</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}