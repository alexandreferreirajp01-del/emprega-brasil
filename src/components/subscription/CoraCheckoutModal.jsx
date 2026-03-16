import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, Shield, Copy, Check, RefreshCw, ExternalLink, Smartphone, QrCode } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CoraCheckoutModal({ isOpen, onClose, plan, user }) {
  const [step, setStep] = useState('cpf'); // 'cpf' | 'loading' | 'pix' | 'paid'
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [invoiceId, setInvoiceId] = useState(null);
  const [pixCode, setPixCode] = useState('');
  const [pixQr, setPixQr] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setStep('cpf');
      setCpf('');
      setCpfError('');
      setInvoiceId(null);
      setPixCode('');
      setPixQr('');
      setPaymentUrl('');
      setCopied(false);
      setPollCount(0);
    }
  }, [isOpen]);

  // Polling automático após gerar PIX
  useEffect(() => {
    if (step !== 'pix' || !invoiceId) return;
    const interval = setInterval(async () => {
      setPollCount(c => c + 1);
      try {
        const res = await base44.functions.invoke('coraPayment', {
          action: 'check_status',
          invoice_id: invoiceId,
        });
        if (res.data?.paid) {
          clearInterval(interval);
          // Ativar premium
          await base44.auth.updateMe({ subscription_type: 'premium' });
          setStep('paid');
        }
      } catch {/* silencioso */}
    }, 5000);
    return () => clearInterval(interval);
  }, [step, invoiceId]);

  const formatCpf = (val) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  };

  const validateCpf = (cpf) => {
    const nums = cpf.replace(/\D/g, '');
    if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(nums[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(nums[10]);
  };

  const handleGeneratePix = async () => {
    if (!validateCpf(cpf)) {
      setCpfError('CPF inválido. Verifique e tente novamente.');
      return;
    }
    setCpfError('');
    setStep('loading');

    try {
      const res = await base44.functions.invoke('coraPayment', {
        action: 'create_pix',
        amount: plan.price,
        description: `Plano ${plan.name} - Vagas Abertas PB`,
        customer_name: user?.full_name || 'Cliente',
        customer_email: user?.email || '',
        customer_cpf: cpf.replace(/\D/g, ''),
        plan_id: plan.plan_id || plan.id,
      });

      if (res.data?.success) {
        setInvoiceId(res.data.invoice_id);
        setPixCode(res.data.pix_code || '');
        setPixQr(res.data.pix_qr_code_base64 || '');
        setPaymentUrl(res.data.payment_url || '');
        setStep('pix');
      } else {
        throw new Error(res.data?.error || 'Erro ao gerar cobrança');
      }
    } catch (err) {
      setStep('cpf');
      setCpfError('Erro ao gerar PIX: ' + (err.message || 'Tente novamente'));
    }
  };

  const handleCheckManual = async () => {
    if (!invoiceId) return;
    setChecking(true);
    try {
      const res = await base44.functions.invoke('coraPayment', {
        action: 'check_status',
        invoice_id: invoiceId,
      });
      if (res.data?.paid) {
        await base44.auth.updateMe({ subscription_type: 'premium' });
        setStep('paid');
      } else {
        alert('Pagamento ainda não identificado. Aguarde alguns segundos e tente novamente.');
      }
    } catch {
      alert('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-[#1E6FB6] to-[#0B2F5B] p-6 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              {step === 'paid' ? '🎉 Pagamento Confirmado!' : `Assinar ${plan?.name}`}
            </DialogTitle>
          </DialogHeader>
          {step !== 'paid' && (
            <p className="text-white/80 text-sm mt-1">
              R$ {plan?.price?.toFixed(2)} — {plan?.billing_cycle === 'monthly' ? 'por mês' : 'pagamento único'}
            </p>
          )}
        </div>

        <div className="p-6 space-y-5">

          {/* STEP: CPF */}
          {step === 'cpf' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3 text-center">
                  Informe seu CPF para gerar o <strong>QR Code PIX</strong>
                </p>
                <Input
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => { setCpf(formatCpf(e.target.value)); setCpfError(''); }}
                  className="text-center text-lg tracking-widest h-12"
                  maxLength={14}
                />
                {cpfError && <p className="text-red-500 text-xs mt-2 text-center">{cpfError}</p>}
              </div>
              <Button
                onClick={handleGeneratePix}
                className="w-full h-12 bg-[#1E6FB6] hover:bg-[#0B2F5B] text-white font-semibold rounded-xl"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Gerar PIX / Boleto
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                Pagamento seguro via Banco Cora — Pix ou Boleto
              </div>
            </div>
          )}

          {/* STEP: LOADING */}
          {step === 'loading' && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#1E6FB6]" />
              <p className="text-slate-600 font-medium">Gerando cobrança...</p>
              <p className="text-slate-400 text-sm">Aguarde um momento</p>
            </div>
          )}

          {/* STEP: PIX */}
          {step === 'pix' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <Badge className="bg-blue-100 text-blue-700 border-0 mb-2">Aguardando Pagamento</Badge>
                <p className="text-xs text-blue-600">O sistema detectará o pagamento automaticamente</p>
              </div>

              {pixQr && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixQr}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 border-2 border-slate-200 rounded-xl"
                  />
                </div>
              )}

              {pixCode && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 text-center font-medium">PIX Copia e Cola</p>
                  <div className="flex gap-2">
                    <Input
                      value={pixCode}
                      readOnly
                      className="text-xs font-mono bg-slate-50 flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopy}
                      className="shrink-0 px-3"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {paymentUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(paymentUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir link de pagamento (Boleto/PIX)
                </Button>
              )}

              <Button
                onClick={handleCheckManual}
                disabled={checking}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl"
              >
                {checking
                  ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  : <RefreshCw className="w-4 h-4 mr-2" />
                }
                Já paguei — Verificar agora
              </Button>
            </div>
          )}

          {/* STEP: PAID */}
          {step === 'paid' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">Parabéns! 🎉</h3>
                <p className="text-slate-600">
                  Você agora é <span className="font-bold text-[#1E6FB6]">Premium</span>!<br />
                  Aproveite todos os benefícios exclusivos.
                </p>
              </div>
              <Button
                onClick={() => { onClose(); window.location.reload(); }}
                className="w-full h-12 bg-[#1E6FB6] hover:bg-[#0B2F5B] text-white font-semibold rounded-xl"
              >
                Começar Agora
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}