import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Calendar, Trash2, AlertTriangle, Loader2, 
  CheckCircle2, ArrowLeft, Filter 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ApagarVagasPorPeriodo() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [previewJobs, setPreviewJobs] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        
        setUser(currentUser);
        setLoading(false);
      } catch (error) {
        window.location.href = createPageUrl('Home');
      }
    };
    checkAuth();
  }, []);

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      toast.error('Selecione as datas inicial e final');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      toast.error('Data inicial não pode ser maior que data final');
      return;
    }

    if (end > new Date()) {
      toast.error('Não é permitido selecionar datas futuras');
      return;
    }

    try {
      setLoading(true);
      const jobs = await base44.entities.Job.filter({
        published_at: {
          $gte: start.toISOString(),
          $lte: end.toISOString()
        }
      });

      setPreviewJobs(jobs);
      setShowPreview(true);
      
      if (jobs.length === 0) {
        toast.info('Nenhuma vaga encontrada para o período selecionado');
      }
    } catch (error) {
      toast.error('Erro ao buscar vagas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowConfirmDialog(false);
    setIsDeleting(true);
    setDeleteProgress(0);

    try {
      const jobIds = previewJobs.map(j => j.id);
      const total = jobIds.length;
      
      // Processar em lotes de 20
      const batchSize = 20;
      let deleted = 0;

      for (let i = 0; i < jobIds.length; i += batchSize) {
        const batch = jobIds.slice(i, i + batchSize);
        
        // Apagar vagas
        for (const jobId of batch) {
          await base44.entities.Job.delete(jobId);
          
          // Apagar dados relacionados
          try {
            const favorites = await base44.entities.FavoriteJob.filter({ job_id: jobId });
            for (const fav of favorites) {
              await base44.entities.FavoriteJob.delete(fav.id);
            }
          } catch (e) {}

          try {
            const views = await base44.entities.JobView.filter({ job_id: jobId });
            for (const view of views) {
              await base44.entities.JobView.delete(view.id);
            }
          } catch (e) {}

          deleted++;
          setDeleteProgress(Math.floor((deleted / total) * 100));
        }
      }

      // Criar log de segurança
      await base44.functions.invoke('createSecurityLog', {
        admin_email: user.email,
        admin_name: user.full_name || user.email,
        action_type: 'delete_jobs_by_period',
        description: `Apagou ${total} vagas do período ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`,
        metadata: {
          start_date: startDate,
          end_date: endDate,
          jobs_deleted: total
        }
      });

      toast.success(`${total} vaga${total > 1 ? 's' : ''} apagada${total > 1 ? 's' : ''} com sucesso!`);
      
      // Resetar estados
      setPreviewJobs([]);
      setShowPreview(false);
      setStartDate('');
      setEndDate('');
      
    } catch (error) {
      toast.error('Erro ao apagar vagas: ' + error.message);
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Apagar Vagas por Período
            </h1>
            <p className="text-sm text-slate-500">
              Remover vagas antigas do sistema
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#0A66C2]/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Selecionar Período
                </h3>
                <p className="text-xs text-slate-500">
                  Escolha o intervalo de datas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">Data Inicial *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={getTodayDate()}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Data Final *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={getTodayDate()}
                  className="h-11"
                />
              </div>
            </div>

            <Button
              onClick={handlePreview}
              disabled={!startDate || !endDate || loading}
              className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Buscando...</>
              ) : (
                <><Filter className="w-5 h-5 mr-2" />Buscar Vagas</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && previewJobs.length > 0 && (
          <Card className="rounded-xl border-orange-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Pré-visualização da Exclusão
                  </h3>
                </div>
                <Badge className="bg-red-600 text-white">
                  {previewJobs.length} vaga{previewJobs.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  ⚠️ Você está prestes a apagar <strong>{previewJobs.length} vaga{previewJobs.length > 1 ? 's' : ''}</strong> publicada{previewJobs.length > 1 ? 's' : ''} entre{' '}
                  <strong>{new Date(startDate).toLocaleDateString('pt-BR')}</strong> e{' '}
                  <strong>{new Date(endDate).toLocaleDateString('pt-BR')}</strong>.
                  Esta ação não poderá ser desfeita.
                </p>
              </div>

              {/* Lista de vagas */}
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {previewJobs.map((job) => (
                  <div key={job.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {job.title || 'Sem título'}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.company && (
                            <Badge variant="outline" className="text-xs">
                              🏢 {job.company}
                            </Badge>
                          )}
                          {job.city && job.state && (
                            <Badge variant="outline" className="text-xs">
                              📍 {job.city}/{job.state}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            📅 {job.published_at ? new Date(job.published_at).toLocaleDateString('pt-BR') : new Date(job.created_date).toLocaleDateString('pt-BR')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isDeleting}
                className="w-full h-12 bg-red-600 hover:bg-red-700 rounded-xl"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Confirmar Exclusão
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog de confirmação */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <DialogTitle className="text-xl">Confirmar Exclusão</DialogTitle>
              </div>
              <DialogDescription className="text-base pt-2">
                Você tem certeza que deseja apagar{' '}
                <strong className="text-red-600">{previewJobs.length} vaga{previewJobs.length > 1 ? 's' : ''}</strong>{' '}
                publicada{previewJobs.length > 1 ? 's' : ''} entre{' '}
                <strong>{new Date(startDate).toLocaleDateString('pt-BR')}</strong> e{' '}
                <strong>{new Date(endDate).toLocaleDateString('pt-BR')}</strong>?
                <br /><br />
                <span className="text-red-600 font-semibold">
                  Esta ação não poderá ser desfeita.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sim, Apagar Tudo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de progresso */}
        <Dialog open={isDeleting} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Apagando Vagas...</DialogTitle>
              <DialogDescription>
                Aguarde enquanto as vagas são removidas do sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#0A66C2]" />
                <span className="text-sm text-slate-600">
                  Processando exclusão em lote...
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-[#0A66C2] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${deleteProgress}%` }}
                />
              </div>
              <p className="text-center text-sm font-medium text-slate-700">
                {deleteProgress}%
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}