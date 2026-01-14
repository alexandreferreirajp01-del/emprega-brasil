import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Loader2, ArrowLeft, Edit, Trash2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VagasPendentes() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    contact_phone: '',
    contact_email: '',
    website: ''
  });

  useEffect(() => {
    loadPendingJobs();
  }, []);

  const loadPendingJobs = async () => {
    setLoading(true);
    try {
      const allJobs = await base44.entities.Job.list('-created_date', 10000);
      const pendingJobs = allJobs.filter(job => job.status === 'pending_contact');
      setJobs(pendingJobs);
    } catch (error) {
      alert('Erro ao carregar vagas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (job) => {
    setEditingJob(job);
    setFormData({
      contact_phone: '',
      contact_email: '',
      website: ''
    });
    setShowEditDialog(true);
  };

  const handleSaveContact = async () => {
    if (!editingJob) return;

    let applicationLink = '';
    if (formData.website) {
      applicationLink = formData.website.startsWith('http') ? formData.website : `https://${formData.website}`;
    } else if (formData.contact_phone) {
      let phone = formData.contact_phone.replace(/\D/g, '');
      if (!phone.startsWith('55')) phone = '55' + phone;
      applicationLink = `https://wa.me/${phone}`;
    } else if (formData.contact_email) {
      applicationLink = `mailto:${formData.contact_email}`;
    }

    if (!applicationLink) {
      alert('Adicione pelo menos um meio de contato');
      return;
    }

    try {
      await base44.entities.Job.update(editingJob.id, {
        application_link: applicationLink,
        status: 'published'
      });
      
      setShowEditDialog(false);
      setEditingJob(null);
      loadPendingJobs();
      alert('Vaga publicada com sucesso!');
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Excluir esta vaga?')) return;
    
    try {
      await base44.entities.Job.delete(jobId);
      loadPendingJobs();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

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
                Vagas Pendentes
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {jobs.length} vagas aguardando informação de contato
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Aguardando Contato</p>
                  <p className="text-2xl font-bold text-orange-600">{jobs.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Ação Necessária</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Adicione telefone, email ou site</p>
                </div>
                <Edit className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Vagas */}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                Nenhuma vaga pendente!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Todas as vagas têm informações de contato.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="font-semibold text-slate-800 dark:text-white truncate flex-1">
                          {job.title}
                        </h3>
                        <Badge className="bg-orange-100 text-orange-700 shrink-0">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Sem Contato
                        </Badge>
                      </div>
                      
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
                      </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      <Link to={createPageUrl('JobDetail') + `?id=${job.id}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openEditDialog(job)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Adicionar Contato
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(job.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Informação de Contato</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Adicione pelo menos um meio de contato para publicar a vaga
              </p>
            </div>

            <div>
              <Label className="text-sm">Telefone (WhatsApp)</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="83999999999"
                className="h-11"
              />
            </div>

            <div>
              <Label className="text-sm">Email</Label>
              <Input
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contato@empresa.com"
                className="h-11"
              />
            </div>

            <div>
              <Label className="text-sm">Site / Link de Inscrição</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
                className="h-11"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveContact}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Publicar Vaga
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}