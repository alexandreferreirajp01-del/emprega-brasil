import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Timer, Lock, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import PromoCard from "@/components/subscription/PromoCard";

function toLocalDatetimeValue(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStatus(config) {
  if (!config?.is_enabled) return 'disabled';
  const now = new Date();
  if (config.start_date && new Date(config.start_date) > now) return 'upcoming';
  if (config.end_date && new Date(config.end_date) < now) return 'expired';
  return 'active';
}

export default function GerenciarPromocao() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ is_enabled: false, start_date: '', end_date: '' });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { window.location.href = createPageUrl('Splash'); return; }
        const u = await base44.auth.me();
        if (u.role !== 'admin' && u.subscription_type !== 'admin') {
          window.location.href = createPageUrl('Home'); return;
        }
        setUser(u);
      } catch { window.location.href = createPageUrl('Splash'); }
    };
    checkAuth();
  }, []);

  const { data: configs = [] } = useQuery({
    queryKey: ['promo-config'],
    queryFn: () => base44.entities.PromoConfig.list('-created_date', 1),
    enabled: !!user,
  });

  const config = configs[0] || null;

  useEffect(() => {
    if (config) {
      setForm({
        is_enabled: config.is_enabled ?? false,
        start_date: toLocalDatetimeValue(config.start_date),
        end_date: toLocalDatetimeValue(config.end_date),
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        is_enabled: data.is_enabled,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      };
      if (config?.id) {
        return base44.entities.PromoConfig.update(config.id, payload);
      } else {
        return base44.entities.PromoConfig.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['promo-config']);
      toast.success('Promoção atualizada com sucesso!');
    },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const status = getStatus(config ? { ...config, ...{ is_enabled: form.is_enabled, start_date: form.start_date ? new Date(form.start_date).toISOString() : null, end_date: form.end_date ? new Date(form.end_date).toISOString() : null } } : null);

  const statusInfo = {
    disabled: { label: 'Desativada', color: 'bg-slate-100 text-slate-700', icon: Lock },
    upcoming: { label: 'Agendada', color: 'bg-blue-100 text-blue-700', icon: Clock },
    active: { label: 'Ativa agora!', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    expired: { label: 'Encerrada', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  }[status];

  const StatusIcon = statusInfo.icon;

  if (!user) return null;

  const previewConfig = {
    is_enabled: form.is_enabled,
    start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
    end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-600 pt-4 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
              <ArrowLeft className="w-4 h-4" /> Configurações
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gerenciar Promoção</h1>
              <p className="text-white/70 text-xs mt-0.5">Controle o período do Plano Premium Promocional (R$ 4,99)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4 pb-12 space-y-6">
        {/* Status Card */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status atual da promoção</p>
                <Badge className={`${statusInfo.color} border-0 flex items-center gap-1.5 text-sm px-3 py-1`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Valor do plano</p>
                <p className="text-2xl font-bold text-orange-600">R$ 4,99</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuração */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange-500" />
                Configurar Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <Switch
                  checked={form.is_enabled}
                  onCheckedChange={v => setForm(p => ({ ...p, is_enabled: v }))}
                />
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">Promoção habilitada</p>
                  <p className="text-xs text-slate-500">{form.is_enabled ? 'Visível para usuários' : 'Oculta para usuários'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm">Data e Hora de Início</Label>
                <Input
                  type="datetime-local"
                  className="mt-1"
                  value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-sm">Data e Hora de Término</Label>
                <Input
                  type="datetime-local"
                  className="mt-1"
                  value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                />
                <p className="text-xs text-slate-400 mt-1">Ao atingir essa data, o card trava automaticamente.</p>
              </div>

              {form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date) && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> A data de término deve ser depois do início.
                </p>
              )}

              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-90 text-white"
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Pré-visualização</p>
            {form.is_enabled ? (
              <PromoCard config={previewConfig} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400">
                <Lock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Habilite a promoção para visualizar o card</p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <Card className="rounded-2xl shadow bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
          <CardContent className="p-4">
            <p className="text-blue-800 dark:text-blue-300 text-sm font-semibold mb-1">ℹ️ Como funciona</p>
            <ul className="text-blue-700 dark:text-blue-200 text-xs space-y-1">
              <li>• Quando <strong>habilitada</strong>, o card aparece na página de planos para todos os usuários.</li>
              <li>• A contagem regressiva fica ativa até a data de término.</li>
              <li>• Quando o período acaba, o card <strong>trava automaticamente</strong> e o botão some.</li>
              <li>• Para nova promoção, basta ajustar as datas e salvar.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}