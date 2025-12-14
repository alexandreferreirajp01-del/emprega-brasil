import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, DollarSign, Crown, Sparkles, Briefcase, Save, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const DEFAULT_PRICES = {
  premium_monthly: 9.90,
  premium_black: 29.90,
  recruiter_monthly: 9.90
};

export default function GerenciarPrecos() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [prices, setPrices] = useState(DEFAULT_PRICES);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);

        // Carregar preços do localStorage
        const savedPrices = localStorage.getItem('subscription_prices');
        if (savedPrices) {
          setPrices(JSON.parse(savedPrices));
        }
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('subscription_prices', JSON.stringify(prices));
      showToast('Preços atualizados com sucesso!');
    } catch (err) {
      showToast('Erro ao salvar preços', 'error');
    }
  };

  const handleReset = () => {
    setPrices(DEFAULT_PRICES);
    localStorage.setItem('subscription_prices', JSON.stringify(DEFAULT_PRICES));
    showToast('Preços restaurados para os valores padrão');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  const plans = [
    {
      id: 'premium_monthly',
      name: 'Premium Mensal',
      icon: Crown,
      color: 'from-blue-600 to-blue-700',
      description: 'Assinatura mensal com renovação automática',
    },
    {
      id: 'premium_black',
      name: 'Premium Black Vitalício',
      icon: Sparkles,
      color: 'from-purple-600 to-purple-700',
      description: 'Pagamento único com acesso vitalício',
    },
    {
      id: 'recruiter_monthly',
      name: 'Recrutador Mensal',
      icon: Briefcase,
      color: 'from-orange-600 to-orange-700',
      description: 'Plano para empresas e recrutadores',
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white text-sm flex items-center gap-2`}>
          <AlertCircle className="w-4 h-4" />
          {toast.message}
        </div>
      )}

      <div className="bg-gradient-to-r from-green-600 to-emerald-600 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Gerenciar Preços dos Planos
          </h1>
          <p className="text-white/70 text-sm">Configure os valores de cada plano de assinatura</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Alerta */}
        <Card className="rounded-2xl border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium mb-1">Importante</p>
              <p className="text-xs text-amber-700">
                As alterações de preços serão salvas localmente e aplicadas imediatamente na página de assinaturas. 
                Certifique-se de atualizar também os valores no WhatsApp quando necessário.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Preços */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className="rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-slate-500">{plan.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Valor (R$)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={prices[plan.id]}
                          onChange={(e) => setPrices({ ...prices, [plan.id]: parseFloat(e.target.value) || 0 })}
                          className="pl-9 h-12 rounded-xl text-lg font-semibold"
                        />
                      </div>
                    </div>
                    <div className="text-center pt-6">
                      <Badge className="bg-blue-100 text-blue-700">
                        R$ {prices[plan.id].toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-12 px-6 rounded-xl"
          >
            Restaurar Padrão
          </Button>
        </div>
      </div>
    </div>
  );
}