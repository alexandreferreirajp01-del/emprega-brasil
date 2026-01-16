import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, CheckCircle, XCircle, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GerenciarMapa() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [jobsWithoutCoords, setJobsWithoutCoords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role !== 'admin' && currentUser.subscription_type !== 'admin') {
          alert('Acesso negado');
          window.history.back();
          return;
        }

        await loadStats();
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('mapManagement', { action: 'stats' });
      setStats(response.data.stats);
      setJobsWithoutCoords(response.data.jobsWithoutCoords || []);
    } catch (error) {
      alert('Erro ao carregar estatísticas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeocodeAll = async () => {
    if (!confirm(`Geocodificar TODAS as ${stats?.ativasSemCoords || 0} vagas sem coordenadas?\n\nIsso pode levar alguns minutos.`)) {
      return;
    }

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('mapManagement', { 
        action: 'geocode',
        mode: 'all'
      });

      alert(
        `✅ CONCLUÍDO!\n\n` +
        `📍 ${response.data.successCount} geocodificadas\n` +
        `⚠️ ${response.data.fallbackCount} com fallback\n` +
        `❌ ${response.data.failCount} falhas\n\n` +
        `Total: ${response.data.totalProcessed}`
      );

      await loadStats();
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleGeocodeSelected = async () => {
    if (selected.length === 0) {
      alert('Selecione pelo menos uma vaga');
      return;
    }

    if (!confirm(`Geocodificar ${selected.length} vagas selecionadas?`)) {
      return;
    }

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('mapManagement', { 
        action: 'geocode',
        mode: 'selected',
        jobIds: selected
      });

      alert(
        `✅ CONCLUÍDO!\n\n` +
        `📍 ${response.data.successCount} geocodificadas\n` +
        `⚠️ ${response.data.fallbackCount} com fallback\n` +
        `❌ ${response.data.failCount} falhas`
      );

      await loadStats();
      setSelected([]);
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelect = (jobId) => {
    setSelected(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const selectAll = () => {
    setSelected(filteredJobs.map(j => j.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const filteredJobs = jobsWithoutCoords.filter(job => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return job.title?.toLowerCase().includes(search) ||
           job.company?.toLowerCase().includes(search) ||
           job.city?.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerenciar Mapa de Vagas</h1>
            <p className="text-slate-600">Geocodificar e gerenciar coordenadas das vagas</p>
          </div>
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.ativas || 0}</p>
                  <p className="text-xs text-slate-600">Vagas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.ativasComCoords || 0}</p>
                  <p className="text-xs text-slate-600">Com Coordenadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.ativasSemCoords || 0}</p>
                  <p className="text-xs text-slate-600">Sem Coordenadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.coordsInvalidas || 0}</p>
                  <p className="text-xs text-slate-600">Coords Inválidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações em Massa */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ações em Massa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={selectAll} variant="outline" size="sm">
                Selecionar Todas ({filteredJobs.length})
              </Button>
              <Button onClick={deselectAll} variant="outline" size="sm">
                Desmarcar Todas
              </Button>
              <Button onClick={loadStats} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleGeocodeAll}
                disabled={processing || !stats?.ativasSemCoords}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                Geocodificar TODAS ({stats?.ativasSemCoords || 0})
              </Button>
              
              <Button 
                onClick={handleGeocodeSelected}
                disabled={processing || selected.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                Geocodificar Selecionadas ({selected.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vagas */}
        <Card>
          <CardHeader>
            <CardTitle>Vagas sem Coordenadas ({filteredJobs.length})</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, empresa ou cidade..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-600">✅ Todas as vagas ativas têm coordenadas!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredJobs.map(job => (
                  <div 
                    key={job.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => toggleSelect(job.id)}
                  >
                    <Checkbox 
                      checked={selected.includes(job.id)}
                      onCheckedChange={() => toggleSelect(job.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{job.title}</h3>
                      <p className="text-sm text-slate-600">
                        {job.company} {job.city && job.state && `• ${job.city}, ${job.state}`}
                      </p>
                      {!job.city && !job.state && (
                        <p className="text-xs text-red-600 mt-1">⚠️ Sem cidade/estado definido</p>
                      )}
                      {job.latitude === 0 && job.longitude === 0 && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ Coordenadas em 0,0 (inválidas)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}