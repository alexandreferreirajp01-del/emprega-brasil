import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, CheckSquare, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ReativarVagas() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expiredJobs, setExpiredJobs] = useState([]);
  const [selected, setSelected] = useState([]);
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

        const allJobs = await base44.entities.Job.list('-created_date', 10000);
        const expired = allJobs.filter(j => j.status === 'expirada');
        setExpiredJobs(expired);
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar vagas: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const toggleSelect = (jobId) => {
    setSelected(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const selectAll = () => {
    setSelected(expiredJobs.map(j => j.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const handleReactivate = async (mode) => {
    if (mode === 'selected' && selected.length === 0) {
      alert('Selecione pelo menos uma vaga');
      return;
    }

    const confirm = window.confirm(
      mode === 'all' 
        ? `Reativar TODAS as ${expiredJobs.length} vagas expiradas?`
        : `Reativar ${selected.length} vagas selecionadas?`
    );

    if (!confirm) return;

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('reactivateJobs', {
        mode,
        jobIds: mode === 'selected' ? selected : null
      });

      alert(response.data.message);
      
      // Recarregar lista
      const allJobs = await base44.entities.Job.list('-created_date', 10000);
      const expired = allJobs.filter(j => j.status === 'expirada');
      setExpiredJobs(expired);
      setSelected([]);

    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Reativar Vagas</h1>
            <p className="text-slate-600">Gerencie vagas expiradas</p>
          </div>
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ações em Massa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={selectAll} variant="outline" size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                Selecionar Todas ({expiredJobs.length})
              </Button>
              <Button onClick={deselectAll} variant="outline" size="sm">
                <Square className="w-4 h-4 mr-2" />
                Desmarcar Todas
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => handleReactivate('all')}
                disabled={processing || expiredJobs.length === 0}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Reativar TODAS ({expiredJobs.length})
              </Button>
              
              <Button 
                onClick={() => handleReactivate('selected')}
                disabled={processing || selected.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Reativar Selecionadas ({selected.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vagas Expiradas ({expiredJobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {expiredJobs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma vaga expirada</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {expiredJobs.map(job => (
                  <div 
                    key={job.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleSelect(job.id)}
                  >
                    <Checkbox 
                      checked={selected.includes(job.id)}
                      onCheckedChange={() => toggleSelect(job.id)}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-600">
                        {job.company} • {job.city}, {job.state}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expirou em: {job.expiration_date ? new Date(job.expiration_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
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