import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ExcluirVagasSemContato() {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [deletedIds, setDeletedIds] = useState(new Set());

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const allJobs = await base44.entities.Job.list('-created_date', 10000);
      const jobsWithoutContact = allJobs.filter(job => {
        const link = job.application_link;
        return !link || link === '' || link.trim() === '';
      });
      setJobs(jobsWithoutContact);
    } catch (error) {
      alert('Erro ao carregar vagas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await base44.entities.Job.delete(jobId);
      setDeletedIds(prev => new Set([...prev, jobId]));
    } catch (error) {
      alert('Erro ao excluir vaga: ' + error.message);
    }
  };

  const deleteAll = async () => {
    if (!confirm(`Deseja realmente excluir TODAS as ${remainingJobs.length} vagas sem contato?`)) return;
    
    setDeleting(true);
    let count = 0;
    
    for (const job of remainingJobs) {
      try {
        await deleteJob(job.id);
        count++;
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
    
    setDeleting(false);
    alert(`${count} vagas excluídas com sucesso!`);
  };

  const remainingJobs = jobs.filter(job => !deletedIds.has(job.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                Vagas Sem Contato
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {remainingJobs.length} vagas encontradas sem informação de contato
              </p>
            </div>
            
            {remainingJobs.length > 0 && (
              <Button
                onClick={deleteAll}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Todas ({remainingJobs.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Encontrado</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{jobs.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Restantes</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{remainingJobs.length}</p>
                </div>
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Excluídas</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{deletedIds.size}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Vagas */}
        {remainingJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                Nenhuma vaga sem contato!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Todas as vagas estão com informações de contato ou foram excluídas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {remainingJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <Link 
                      to={createPageUrl('JobDetail') + `?id=${job.id}`}
                      className="flex-1 min-w-0 cursor-pointer"
                      target="_blank"
                    >
                      <h3 className="font-semibold text-slate-800 dark:text-white mb-1 truncate hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {job.company || 'Empresa não informada'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.city && (
                          <Badge variant="secondary" className="text-xs">
                            {job.city} - {job.state}
                          </Badge>
                        )}
                        {job.job_type && (
                          <Badge variant="outline" className="text-xs">
                            {job.job_type}
                          </Badge>
                        )}
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          Sem Contato
                        </Badge>
                      </div>
                    </Link>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir vaga "${job.title}"?`)) {
                          deleteJob(job.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}