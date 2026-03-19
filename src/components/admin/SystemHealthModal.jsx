import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, Zap, MessageSquare, Home, Briefcase, Bell, Settings, Users, Send, Award, BarChart3 } from 'lucide-react';

const SYSTEM_SHORTCUTS = [
  { id: 'notifyNewJob', label: 'Notificar Nova Vaga', icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
  { id: 'notifyNewUser', label: 'Notificar Novo Usuário', icon: Users, color: 'bg-green-100 text-green-700' },
  { id: 'sendToTelegram', label: 'Enviar ao Telegram', icon: Send, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'pushSend', label: 'Push Notification', icon: Bell, color: 'bg-purple-100 text-purple-700' },
  { id: 'sendPromoNow', label: 'Enviar Promoção', icon: Award, color: 'bg-amber-100 text-amber-700' },
  { id: 'autoPublishPending', label: 'AutoPost Pendentes', icon: Zap, color: 'bg-emerald-100 text-emerald-700' },
];

export default function SystemHealthModal({ open, onOpenChange }) {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadCredits();
    }
  }, [open]);

  const loadCredits = async () => {
    setLoading(true);
    try {
      // Simular dados de créditos (será integrado com backend real)
      const mockData = {
        integration: { total: 10000, used: 3500, percentage: 35 },
        messages: { total: 50000, used: 12300, percentage: 24.6 },
        functions: [
          { id: 'notifyNewJob', name: 'Notificar Nova Vaga', costPerUse: 50, totalUsed: 1200, timesUsed: 24 },
          { id: 'notifyNewUser', name: 'Notificar Novo Usuário', costPerUse: 30, totalUsed: 900, timesUsed: 30 },
          { id: 'sendToTelegram', name: 'Enviar ao Telegram', costPerUse: 100, totalUsed: 2000, timesUsed: 20 },
          { id: 'pushSend', name: 'Push Notification', costPerUse: 25, totalUsed: 625, timesUsed: 25 },
          { id: 'sendPromoNow', name: 'Enviar Promoção', costPerUse: 200, totalUsed: 400, timesUsed: 2 },
          { id: 'autoPublishPending', name: 'AutoPost Pendentes', costPerUse: 150, totalUsed: 1500, timesUsed: 10 },
        ]
      };
      setCredits(mockData);
    } catch (e) {
      console.error('Erro ao carregar créditos:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage < 30) return 'text-green-600';
    if (percentage < 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Saúde do Sistema
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Créditos de Integração */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Créditos de Integração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Uso Total</span>
                    <span className={`text-lg font-bold ${getStatusColor(credits.integration.percentage)}`}>
                      {credits.integration.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(credits.integration.percentage)} transition-all duration-300`}
                      style={{ width: `${credits.integration.percentage}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Disponível</p>
                      <p className="font-bold text-slate-900">{credits.integration.total - credits.integration.used}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Usado</p>
                      <p className="font-bold text-slate-900">{credits.integration.used}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Total</p>
                      <p className="font-bold text-slate-900">{credits.integration.total}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Créditos de Mensagem */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Créditos de Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Uso Total</span>
                    <span className={`text-lg font-bold ${getStatusColor(credits.messages.percentage)}`}>
                      {credits.messages.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(credits.messages.percentage)} transition-all duration-300`}
                      style={{ width: `${credits.messages.percentage}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Disponível</p>
                      <p className="font-bold text-slate-900">{credits.messages.total - credits.messages.used}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Usado</p>
                      <p className="font-bold text-slate-900">{credits.messages.used}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Total</p>
                      <p className="font-bold text-slate-900">{credits.messages.total}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funções e Custo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Funções - Consumo de Créditos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {credits.functions.map((func) => (
                    <div key={func.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{func.name}</p>
                        <p className="text-xs text-slate-500">
                          {func.timesUsed}x executadas • {func.costPerUse} créditos/uso
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-700 whitespace-nowrap">
                          {func.totalUsed} créditos
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Atalhos Rápidos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Atalhos Rápidos de Funções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SYSTEM_SHORTCUTS.map((shortcut) => {
                    const Icon = shortcut.icon;
                    return (
                      <button
                        key={shortcut.id}
                        className={`p-3 rounded-lg ${shortcut.color} hover:shadow-md transition-shadow flex flex-col items-center gap-2`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">{shortcut.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}