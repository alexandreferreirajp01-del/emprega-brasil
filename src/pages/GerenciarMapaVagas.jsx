import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, MapPin, Loader2, CheckCircle, XCircle, AlertTriangle,
  Database, RefreshCw, Play, BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function GerenciarMapaVagas() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin' && currentUser.subscription_type !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(currentUser);
    } catch {
      window.location.href = createPageUrl('Splash');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await base44.functions.invoke('geocodeSystem', {
        action: 'stats'
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  const processarLote = async (batchSize = 50) => {
    setProcessing(true);
    setProgress({ current: 0, total: 0, message: 'Iniciando...' });

    try {
      let totalProcessados = 0;
      let totalSucessos = 0;
      let totalFalhas = 0;
      let hasMore = true;

      while (hasMore) {
        setProgress({ 
          current: totalProcessados, 
          total: stats?.pendentes || 0, 
          message: `Processando lote ${Math.floor(totalProcessados / batchSize) + 1}...` 
        });

        const response = await base44.functions.invoke('geocodeSystem', {
          action: 'batch',
          batchSize
        });

        totalProcessados += response.data.processados;
        totalSucessos += response.data.sucessos;
        totalFalhas += response.data.falhas;

        if (response.data.total_encontrado < batchSize) {
          hasMore = false;
        }

        await new Promise(r => setTimeout(r, 2000)); // Delay entre lotes
      }

      setProgress({ 
        current: totalProcessados, 
        total: totalProcessados, 
        message: `✅ Concluído! ${totalSucessos} sucessos, ${totalFalhas} falhas` 
      });

      await loadStats();
    } catch (error) {
      alert('Erro ao processar: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Gerenciar Mapa de Vagas</h1>
          <p className="text-white/70 text-sm">Processar geolocalização das vagas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-xs text-slate-500">Total de vagas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.com_coords}</p>
                    <p className="text-xs text-slate-500">Com coordenadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.pendentes}</p>
                    <p className="text-xs text-slate-500">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.falhas}</p>
                    <p className="text-xs text-slate-500">Falhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detalhes */}
        {stats && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Detalhes
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Remotas: <span className="font-semibold">{stats.remotas}</span></p>
                  <p className="text-slate-600">Exibindo no mapa: <span className="font-semibold">{stats.exibindo_mapa}</span></p>
                </div>
                <div>
                  <p className="text-slate-600">Sem cidade: <span className="font-semibold text-red-600">{stats.sem_cidade}</span></p>
                  <p className="text-slate-600">Sem UF: <span className="font-semibold text-red-600">{stats.sem_uf}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Processar Vagas</h3>
              <p className="text-sm text-slate-600 mb-4">
                Geocodifica automaticamente todas as vagas pendentes usando cidade, UF e bairro.
                Usa fallback inteligente quando necessário.
              </p>
              
              {processing && (
                <div className="mb-4 space-y-2">
                  <Progress value={(progress.current / (progress.total || 1)) * 100} />
                  <p className="text-sm text-slate-600 text-center">
                    {progress.message} ({progress.current} de {progress.total})
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => processarLote(50)}
                  disabled={processing || !stats?.pendentes}
                  className="bg-[#0A66C2] hover:bg-[#004182]"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Processar Pendentes ({stats?.pendentes || 0})
                    </>
                  )}
                </Button>

                <Button
                  onClick={loadStats}
                  disabled={processing}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Stats
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
              <MapPin className="w-4 h-4" />
              Como funciona
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Vagas remotas são marcadas automaticamente</li>
              <li>• Geocode usa: Bairro + Cidade + UF (quando disponível)</li>
              <li>• Fallback para cidade quando bairro não existe</li>
              <li>• Fallback para capital do estado em último caso</li>
              <li>• Cache inteligente evita chamadas repetidas</li>
              <li>• Rate limit de 1 segundo entre requisições</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}