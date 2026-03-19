import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, TrendingDown, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import moment from 'moment';

export default function SaudeDoSistema() {
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);
  const [functionLogs, setFunctionLogs] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });
  const [user, setUser] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Buscar dados de saúde do sistema
        const response = await base44.functions.invoke('getSystemHealth', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        if (response.data) {
          setSystemHealth(response.data);
          setFunctionLogs(response.data.functionLogs || []);
        }
      } catch (e) {
        console.warn('Erro ao carregar saúde do sistema:', e);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getSystemHealth', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      if (response.data) {
        setSystemHealth(response.data);
        setFunctionLogs(response.data.functionLogs || []);
      }
      toast.success('Dados atualizados');
    } catch (e) {
      toast.error('Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const creditUsagePercent = systemHealth
    ? Math.round(
        ((systemHealth.creditsUsed || 0) / (systemHealth.creditsTotal || 1)) * 100
      )
    : 0;

  const messageCreditsPercent = systemHealth
    ? Math.round(
        ((systemHealth.messageCreditsUsed || 0) / (systemHealth.messageCreditsTotal || 1)) * 100
      )
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Saúde do Sistema</h1>
              <p className="text-blue-100">Monitore créditos e desempenho de funções</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6 mb-8">
        {/* Filtro de Data */}
        <Card className="shadow-lg rounded-2xl mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Período de Análise
              </CardTitle>
              <Button
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Créditos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Créditos de Integração */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-blue-600" />
                Créditos de Integração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth ? (
                <>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Utilizados
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {systemHealth.creditsUsed || 0} / {systemHealth.creditsTotal || 0}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {creditUsagePercent}% utilizado
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t dark:border-slate-700">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Disponível</p>
                      <p className="text-lg font-bold text-green-600">
                        {(systemHealth.creditsTotal || 0) - (systemHealth.creditsUsed || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Renovação</p>
                      <p className="text-lg font-bold text-orange-600">
                        {systemHealth.nextRenewal || '-'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">Carregando...</p>
              )}
            </CardContent>
          </Card>

          {/* Créditos de Mensagens IA */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Créditos de Mensagens IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth ? (
                <>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Utilizados
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {systemHealth.messageCreditsUsed || 0} / {systemHealth.messageCreditsTotal || 0}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                        style={{ width: `${Math.min(messageCreditsPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {messageCreditsPercent}% utilizado
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t dark:border-slate-700">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Disponível</p>
                      <p className="text-lg font-bold text-green-600">
                        {(systemHealth.messageCreditsTotal || 0) - (systemHealth.messageCreditsUsed || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Limite</p>
                      <p className="text-lg font-bold text-blue-600">
                        {systemHealth.messageCreditsTotal || 0}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">Carregando...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Uso de Funções */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Uso de Créditos por Função
            </CardTitle>
          </CardHeader>
          <CardContent>
            {functionLogs && functionLogs.length > 0 ? (
              <div className="space-y-3">
                {functionLogs.map((func, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {func.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chamadas: {func.callCount} | Total período: {func.creditsUsed}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {func.creditsPerCall} cr/call
                      </p>
                      <Badge className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {func.totalCreditsUsed} total
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">Nenhuma função utilizada neste período</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}