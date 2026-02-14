import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, AlertCircle, Loader2, CheckCircle, 
  Trash2, Edit, RefreshCw, Image as ImageIcon, FileText,
  Phone, Mail, Link as LinkIcon, MapPin, Building, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import EditJobModal from "@/components/admin/EditJobModal";

export default function Pendencias() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [reprocessing, setReprocessing] = useState({});
  const [editingJob, setEditingJob] = useState(null);
  const [filter, setFilter] = useState('all'); // all, no_contact, needs_review

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
        await loadPendingJobs();
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadPendingJobs = async () => {
    try {
      // Buscar vagas com problemas de contato
      const jobs = await base44.entities.Job.filter({
        status: { $in: ['pending_contact', 'pending_review'] }
      }, '-created_date', 200);
      
      setPendingJobs(jobs);
    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
    }
  };

  const handleReprocess = async (jobId) => {
    setReprocessing(prev => ({ ...prev, [jobId]: true }));
    try {
      const response = await base44.functions.invoke('reprocessContactExtraction', { job_id: jobId });
      
      if (response.data.success) {
        alert(response.data.message);
        await loadPendingJobs();
      } else {
        alert('❌ ' + (response.data.error || 'Erro ao reprocessar'));
      }
    } catch (error) {
      alert('❌ Erro: ' + error.message);
    } finally {
      setReprocessing(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('⚠️ Tem certeza que deseja DELETAR esta vaga? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await base44.entities.Job.delete(jobId);
      alert('✅ Vaga deletada com sucesso!');
      await loadPendingJobs();
    } catch (error) {
      alert('❌ Erro ao deletar: ' + error.message);
    }
  };

  const handleActivate = async (jobId) => {
    if (!confirm('Ativar esta vaga mesmo sem contato completo?')) {
      return;
    }

    try {
      await base44.entities.Job.update(jobId, {
        status: 'ativa',
        needs_review: false
      });
      alert('✅ Vaga ativada!');
      await loadPendingJobs();
    } catch (error) {
      alert('❌ Erro: ' + error.message);
    }
  };

  const filteredJobs = pendingJobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'no_contact') {
      return !job.contact_phone && !job.contact_email && !job.contact_whatsapp && !job.application_link;
    }
    if (filter === 'needs_review') return job.needs_review;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pendências de Vagas</h1>
              <p className="text-white/80 text-sm">Vagas sem contato ou que precisam de revisão</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Pendências</p>
                  <p className="text-2xl font-bold text-slate-900">{pendingJobs.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Sem Contato</p>
                  <p className="text-2xl font-bold text-red-600">
                    {pendingJobs.filter(j => !j.contact_phone && !j.contact_email && !j.contact_whatsapp && !j.application_link).length}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Precisam Revisão</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {pendingJobs.filter(j => j.needs_review).length}
                  </p>
                </div>
                <Edit className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({pendingJobs.length})
              </Button>
              <Button
                variant={filter === 'no_contact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('no_contact')}
                className={filter === 'no_contact' ? 'bg-red-600' : ''}
              >
                Sem Contato ({pendingJobs.filter(j => !j.contact_phone && !j.contact_email && !j.contact_whatsapp && !j.application_link).length})
              </Button>
              <Button
                variant={filter === 'needs_review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('needs_review')}
                className={filter === 'needs_review' ? 'bg-amber-600' : ''}
              >
                Precisam Revisão ({pendingJobs.filter(j => j.needs_review).length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vagas Pendentes */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma pendência!</h3>
                <p className="text-slate-600">Todas as vagas estão com contatos válidos.</p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => {
              const hasContact = job.contact_phone || job.contact_email || job.contact_whatsapp || job.application_link;
              const attempts = job.reprocess_attempts || 0;
              
              return (
                <Card key={job.id} className="border-l-4 border-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {job.image_url ? (
                            <ImageIcon className="w-4 h-4 text-purple-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600" />
                          )}
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {job.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.city} - {job.state}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(job.created_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={hasContact ? 'outline' : 'destructive'}>
                          {hasContact ? 'Contato Parcial' : 'Sem Contato'}
                        </Badge>
                        {job.origem && (
                          <Badge variant="secondary" className="text-xs">
                            {job.origem.toUpperCase()}
                          </Badge>
                        )}
                        {attempts > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Tentativas: {attempts}/3
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contatos Atuais */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-bold text-slate-700 mb-2">Contatos Extraídos:</p>
                      {job.contact_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>{job.contact_phone}</span>
                        </div>
                      )}
                      {job.contact_whatsapp && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>WhatsApp: {job.contact_whatsapp}</span>
                        </div>
                      )}
                      {job.contact_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>{job.contact_email}</span>
                        </div>
                      )}
                      {job.application_link && (
                        <div className="flex items-center gap-2 text-sm">
                          <LinkIcon className="w-4 h-4 text-purple-600" />
                          <span className="truncate">{job.application_link}</span>
                        </div>
                      )}
                      {!hasContact && (
                        <p className="text-sm text-red-600 font-medium">❌ Nenhum contato encontrado</p>
                      )}
                    </div>

                    {/* Notas de Revisão */}
                    {job.review_notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-900">{job.review_notes}</p>
                      </div>
                    )}

                    {/* Imagem Preview */}
                    {job.image_url && (
                      <div className="border rounded-lg overflow-hidden">
                        <img 
                          src={job.image_url} 
                          alt={job.title}
                          className="w-full h-48 object-contain bg-slate-100"
                        />
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        onClick={() => handleReprocess(job.id)}
                        disabled={reprocessing[job.id] || attempts >= 3}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {reprocessing[job.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Reprocessando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reprocessar ({attempts}/3)
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => setEditingJob(job)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>

                      <Button
                        onClick={() => handleActivate(job.id)}
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ativar Mesmo Assim
                      </Button>

                      <Button
                        onClick={() => handleDelete(job.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          isOpen={!!editingJob}
          onClose={() => {
            setEditingJob(null);
            loadPendingJobs();
          }}
        />
      )}
    </div>
  );
}