import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Check, Shield, ArrowLeft, Copy, QrCode, 
  CreditCard, Smartphone, Loader2, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Payment() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [premiumCode, setPremiumCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chave PIX (você pode substituir pela sua chave real)
  const PIX_KEY = 'alexandreferreirajp01@gmail.com';
  const PIX_NAME = 'Vagas Abertas Paraíba';
  const PIX_VALUE = '29.90';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Se já é premium, redirecionar
        if (currentUser.subscription_type === 'premium' || currentUser.subscription_type === 'admin') {
          window.location.href = createPageUrl('Home');
        }
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidateCode = async () => {
    if (!premiumCode.trim() || premiumCode.length !== 8) {
      setCodeError('O código deve ter 8 caracteres');
      return;
    }

    setValidatingCode(true);
    setCodeError('');

    try {
      // Buscar código
      const codes = await base44.entities.PremiumCode.filter({ code: premiumCode.toUpperCase() });
      
      if (codes.length === 0) {
        setCodeError('Código inválido');
        return;
      }

      const code = codes[0];
      if (code.is_used) {
        setCodeError('Este código já foi utilizado');
        return;
      }

      // Marcar código como usado
      await base44.entities.PremiumCode.update(code.id, {
        is_used: true,
        used_by: user.email,
        used_at: new Date().toISOString()
      });

      // Atualizar usuário para premium
      await base44.auth.updateMe({
        subscription_type: 'premium',
        premium_code_used: premiumCode.toUpperCase(),
        premium_activated_at: new Date().toISOString()
      });

      // Enviar email de confirmação
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: '🎉 Bem-vindo ao Vagas Abertas Premium!',
        body: `Olá ${user.full_name || 'usuário'}!

Seu código Premium foi ativado com sucesso!

Você agora tem acesso a:
✅ Todas as vagas exclusivas
✅ Alertas de novas vagas
✅ Suporte prioritário

Acesse agora: ${window.location.origin}

Obrigado por fazer parte do Vagas Abertas Paraíba!

Atenciosamente,
Equipe Vagas Abertas Paraíba`
      });

      // Redirecionar
      window.location.href = createPageUrl('Home');
    } catch (e) {
      console.error('Erro ao validar código:', e);
      setCodeError('Erro ao validar código. Tente novamente.');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCreatePayment = async () => {
    try {
      // Criar registro de pagamento pendente
      await base44.entities.Payment.create({
        user_email: user.email,
        amount: 29.90,
        status: 'pending',
        payment_method: paymentMethod,
        notes: `Pagamento via ${paymentMethod.toUpperCase()}`
      });
      
      setPaymentCreated(true);
    } catch (e) {
      console.error('Erro ao criar pagamento:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Subscription')} className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="text-center">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Ativar Premium</h1>
            <p className="text-white/70 mt-2">Acesso vitalício por apenas R$ 29,90</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Opção de código */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-xl rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Tem um código Premium?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={premiumCode}
                  onChange={(e) => {
                    setPremiumCode(e.target.value.toUpperCase());
                    setCodeError('');
                  }}
                  placeholder="Digite seu código (8 caracteres)"
                  maxLength={8}
                  className="rounded-xl font-mono text-lg tracking-wider uppercase"
                />
                <Button
                  onClick={handleValidateCode}
                  disabled={validatingCode || premiumCode.length !== 8}
                  className="bg-purple-600 hover:bg-purple-700 rounded-xl px-6"
                >
                  {validatingCode ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Ativar'
                  )}
                </Button>
              </div>
              {codeError && (
                <p className="text-red-500 text-sm mt-2">{codeError}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Divisor */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-slate-400 text-sm">ou pague com</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Métodos de pagamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Escolha a forma de pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de método */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'pix' 
                      ? 'border-[#0056ff] bg-[#0056ff]/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <QrCode className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'pix' ? 'text-[#0056ff]' : 'text-slate-400'}`} />
                  <p className="font-medium">PIX</p>
                  <p className="text-xs text-slate-500">Instantâneo</p>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'whatsapp' 
                      ? 'border-[#25D366] bg-[#25D366]/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'whatsapp' ? 'text-[#25D366]' : 'text-slate-400'}`} />
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-slate-500">Suporte direto</p>
                </button>
              </div>

              {/* Instruções PIX */}
              {paymentMethod === 'pix' && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Chave PIX (E-mail):</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white px-4 py-3 rounded-lg font-mono text-sm border">
                        {PIX_KEY}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyPix}
                        className="rounded-lg"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Valor:</p>
                      <p className="font-bold text-lg text-green-600">R$ 29,90</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Nome:</p>
                      <p className="font-medium">{PIX_NAME}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    <p>⚠️ Após o pagamento, envie o comprovante pelo WhatsApp para liberação imediata.</p>
                  </div>

                  {!paymentCreated ? (
                    <Button
                      onClick={handleCreatePayment}
                      className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                    >
                      Já fiz o PIX - Notificar Equipe
                    </Button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">Pagamento registrado!</p>
                      <p className="text-green-600 text-sm">Aguarde a confirmação em até 24h</p>
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp */}
              {paymentMethod === 'whatsapp' && (
                <div className="bg-[#25D366]/10 rounded-xl p-4 space-y-4">
                  <p className="text-sm text-slate-600">
                    Prefere resolver tudo pelo WhatsApp? Fale diretamente com nossa equipe para efetuar o pagamento.
                  </p>
                  
                  <Button
                    onClick={() => {
                      const message = encodeURIComponent(`Olá! Quero adquirir o plano Premium do Vagas Abertas Paraíba.\n\nMeu email: ${user?.email}`);
                      window.open(`https://wa.me/5583991971320?text=${message}`, '_blank');
                    }}
                    className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] rounded-xl"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    Falar no WhatsApp
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Garantias */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span className="text-sm">Garantia 7 dias</span>
            </div>
          </div>
        </motion.div>

        {/* Nota sobre integrações */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="rounded-xl bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Para uma experiência de pagamento ainda mais automatizada, 
                você pode integrar plataformas como <strong>Mercado Pago</strong>, <strong>PagSeguro</strong>, 
                <strong>Stripe</strong> ou <strong>Pagar.me</strong> que oferecem APIs para processamento 
                automático de pagamentos via PIX, cartão e boleto.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}