import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Check, Shield, ArrowLeft, Copy, QrCode, 
  Loader2, CheckCircle, Smartphone
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Payment() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [premiumCode, setPremiumCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [generatingPix, setGeneratingPix] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Mercado Pago Public Key
  const MP_PUBLIC_KEY = 'APP_USR-e052182f-5ef8-4988-ab0c-c269aad27e6e';

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
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

      // Criar registro de pagamento
      await base44.entities.Payment.create({
        user_email: user.email,
        amount: 29.90,
        status: 'approved',
        payment_method: 'code',
        notes: `Código: ${premiumCode.toUpperCase()}`
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

  // Gerar PIX via Mercado Pago
  const handleGeneratePix = async () => {
    setGeneratingPix(true);
    
    try {
      // Criar registro de pagamento pendente
      const payment = await base44.entities.Payment.create({
        user_email: user.email,
        amount: 29.90,
        status: 'pending',
        payment_method: 'pix',
        notes: 'Aguardando pagamento PIX'
      });

      // Simular dados do PIX (em produção, isso viria da API do Mercado Pago)
      // Como não temos backend functions, vamos usar um PIX estático
      const pixKey = 'alexandreferreirajp01@gmail.com';
      const pixCode = `00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865802BR5925VAGAS ABERTAS PARAIBA6009SAO PAULO62070503***6304`;
      
      setPixData({
        qr_code: pixKey,
        qr_code_base64: null,
        payment_id: payment.id,
        external_id: `MP-${Date.now()}`
      });

      // Atualizar pagamento com external_id
      await base44.entities.Payment.update(payment.id, {
        external_id: `MP-${Date.now()}`
      });

    } catch (e) {
      console.error('Erro ao gerar PIX:', e);
    } finally {
      setGeneratingPix(false);
    }
  };

  // Simular verificação de pagamento (em produção, verificar via API)
  const handleCheckPayment = async () => {
    setCheckingPayment(true);
    
    try {
      // Simular delay de verificação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em produção, aqui verificaríamos o status do pagamento na API do Mercado Pago
      // Como não temos backend, mostrar mensagem para contato
      alert('Para confirmar seu pagamento, envie o comprovante via WhatsApp para (83) 99197-1320');
      
    } catch (e) {
      console.error('Erro ao verificar pagamento:', e);
    } finally {
      setCheckingPayment(false);
    }
  };

  // Ativar premium manualmente (admin pode fazer isso pelo painel)
  const activatePremium = async () => {
    try {
      await base44.auth.updateMe({
        subscription_type: 'premium',
        premium_activated_at: new Date().toISOString()
      });

      if (pixData?.payment_id) {
        await base44.entities.Payment.update(pixData.payment_id, {
          status: 'approved'
        });
      }

      window.location.href = createPageUrl('Home');
    } catch (e) {
      console.error('Erro ao ativar premium:', e);
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
                Já possui um código Premium?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Se você recebeu um código de ativação, digite abaixo para liberar seu acesso imediatamente.
              </p>
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
          <span className="text-slate-400 text-sm">ou pague via PIX</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Pagamento PIX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#0056ff]" />
                Pagamento via PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pixData ? (
                <>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-600">Plano Premium Vitalício</span>
                      <span className="text-2xl font-bold text-green-600">R$ 29,90</span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Acesso a todas as vagas exclusivas
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Pagamento único - acesso permanente
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Garantia de 7 dias
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleGeneratePix}
                    disabled={generatingPix}
                    className="w-full h-14 text-lg bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                  >
                    {generatingPix ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <QrCode className="w-5 h-5 mr-2" />
                    )}
                    Gerar PIX
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  {/* QR Code ou Copia e Cola */}
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-slate-600 mb-3">Chave PIX (E-mail):</p>
                    <div className="bg-white rounded-lg p-3 font-mono text-sm break-all border">
                      {pixData.qr_code}
                    </div>
                    <Button
                      onClick={handleCopyPix}
                      variant="outline"
                      className="mt-3 rounded-xl"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Chave PIX
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 text-sm">Valor</p>
                      <p className="text-xl font-bold text-green-600">R$ 29,90</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 text-sm">Nome</p>
                      <p className="font-medium text-slate-800">Vagas Abertas PB</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">
                      <strong>📱 Importante:</strong> Após fazer o pagamento, clique no botão abaixo para verificar 
                      ou envie o comprovante via WhatsApp para ativação imediata.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleCheckPayment}
                      disabled={checkingPayment}
                      variant="outline"
                      className="h-12 rounded-xl"
                    >
                      {checkingPayment ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Já Paguei
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => {
                        const msg = encodeURIComponent(`Olá! Fiz o pagamento PIX de R$ 29,90 para o Plano Premium.\n\nMeu email: ${user?.email}\n\nAguardo a ativação.`);
                        window.open(`https://wa.me/5583991971320?text=${msg}`, '_blank');
                      }}
                      className="h-12 bg-[#25D366] hover:bg-[#20bd5a] rounded-xl"
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
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

        {/* Suporte */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="rounded-xl bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-800">
                <strong>Precisa de ajuda?</strong> Entre em contato pelo WhatsApp: (83) 99197-1320
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}