import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, CheckCircle, Loader2, ArrowLeft, Edit, Trash2,
  ExternalLink, MapPin, Phone, Send, Clock, Briefcase, Info, Copy
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EditJobModal from "@/components/admin/EditJobModal";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PostManual() {
  const [loading, setLoading] = useState(true);
  const [pendingN8N, setPendingN8N] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const allJobs = await base44.entities.Job.filter(
        { status: 'pending_review', origem: 'n8n_automatico' },
        '-created_date',
        500
      );
      setPendingN8N(allJobs);
    } catch (error) {
      toast.error('Erro ao carregar vagas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setShowEditJobModal(true);
  };

  const handlePublish = async (job) => {
    try {
      await base44.entities.Job.update(job.id, {
        status: 'ativa',
        needs_review: false,
        review_notes: '',
        published_at: new Date().toISOString(),
      });
      toast.success('Vaga publicada com sucesso!');
      loadJobs();
    } catch (error) {
      toast.error('Erro: ' + error.message);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Excluir esta vaga?')) return;
    try {
      await base44.entities.Job.delete(jobId);
      toast.success('Vaga excluída.');
      loadJobs();
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handlePublishAll = async () => {
    if (!confirm(`Publicar TODAS as ${pendingN8N.length} vagas pendentes?`)) return;
    try {
      await Promise.all(pendingN8N.map(job =>
        base44.entities.Job.update(job.id, {
          status: 'ativa', needs_review: false, review_notes: '',
          published_at: new Date().toISOString(),
        })
      ));
      toast.success(`${pendingN8N.length} vagas publicadas!`);
      loadJobs();
    } catch (error) {
      toast.error('Erro: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const JobCard = ({ job }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 dark:text-white flex-1 min-w-0">
                {job.title}
              </h3>
              <Badge className="bg-blue-100 text-blue-700 shrink-0 text-xs">
                <Clock className="w-3 h-3 mr-1" />Aguardando
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {job.company || 'Empresa não informada'}
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {job.city && (
                <Badge variant="secondary" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />{job.city}{job.state ? ` - ${job.state}` : ''}
                </Badge>
              )}
              {job.job_type && <Badge variant="outline" className="text-xs">{job.job_type}</Badge>}
              {job.work_mode && <Badge variant="outline" className="text-xs">{job.work_mode}</Badge>}
              {job.salary_range && <Badge variant="outline" className="text-xs">💰 {job.salary_range}</Badge>}
            </div>
            {job.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {job.description}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Recebido em {format(new Date(job.created_date), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white gap-1"
              onClick={() => handlePublish(job)}
            >
              <Send className="w-3.5 h-3.5" />Publicar
            </Button>
            <Button variant="outline" size="sm" onClick={() => openEditModal(job)}>
              <Edit className="w-3.5 h-3.5 mr-1" />Editar
            </Button>
            <div className="flex gap-1">
              <Link to={createPageUrl('JobDetail') + `?id=${job.id}`} target="_blank" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(job.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                Vagas N8N — Revisão
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {pendingN8N.length} vaga{pendingN8N.length !== 1 ? 's' : ''} aguardando revisão
              </p>
            </div>
            {pendingN8N.length > 1 && (
              <Button onClick={handlePublishAll} className="bg-green-600 hover:bg-green-700 gap-2">
                <Send className="w-4 h-4" />Publicar Todas ({pendingN8N.length})
              </Button>
            )}
          </div>
        </div>

        {/* Instrução de conexão N8N */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 text-sm mb-1">Como conectar o N8N</p>
              <p className="text-xs text-blue-700 mb-2">
                No N8N, adicione um nó <strong>HTTP Request</strong> configurado assim:
              </p>
              <div className="bg-white rounded-lg p-3 font-mono text-xs text-slate-700 space-y-1 border border-blue-100">
                <p><span className="text-blue-600">Method:</span> POST</p>
                <p><span className="text-blue-600">URL:</span> Dashboard → Code → Functions → receberVagaN8N</p>
                <p><span className="text-blue-600">Header x-api-key:</span> valor do secret <strong>API_KEY_N8N_VagasPB</strong></p>
                <p><span className="text-blue-600">Body:</span> JSON com os campos da vaga (veja comentários na função)</p>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                As vagas chegam aqui com status "Aguardando" para você revisar antes de publicar.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de vagas */}
        {pendingN8N.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                Nenhuma vaga pendente!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                As vagas enviadas pelo N8N aparecerão aqui automaticamente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Revise cada vaga antes de publicar. Use <strong>Editar</strong> para ajustar os dados e <strong>Publicar</strong> para torná-la visível no app.
              </p>
            </div>
            {pendingN8N.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>

      {showEditJobModal && editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => { setShowEditJobModal(false); setEditingJob(null); }}
          onUpdateSuccess={() => { setShowEditJobModal(false); setEditingJob(null); loadJobs(); }}
        />
      )}
    </div>
  );
}