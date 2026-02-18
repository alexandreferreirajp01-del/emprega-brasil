import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Loader2, ArrowLeft, Edit, Trash2, ExternalLink, MapPin, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EditJobModal from "@/components/admin/EditJobModal";

export default function VagasPendentes() {
  const [loading, setLoading] = useState(true);
  const [pendingContact, setPendingContact] = useState([]);
  const [pendingLocation, setPendingLocation] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [formData, setFormData] = useState({ contact_phone: '', contact_email: '', website: '' });

  useEffect(() => { loadPendingJobs(); }, []);

  const loadPendingJobs = async () => {
    setLoading(true);
    try {
      const allJobs = await base44.entities.Job.list('-created_date', 10000);
      setPendingContact(allJobs.filter(j => j.status === 'pending_contact'));
      setPendingLocation(allJobs.filter(j => j.status === 'pending_review' && j.needs_review === true));
    } catch (error) {
      alert('Erro ao carregar vagas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openContactDialog = (job) => {
    setEditingJob(job);
    setFormData({ contact_phone: '', contact_email: '', website: '' });
    setShowContactDialog(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setShowEditJobModal(true);
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
    if (!applicationLink) { alert('Adicione pelo menos um meio de contato'); return; }
    try {
      await base44.entities.Job.update(editingJob.id, {
        application_link: applicationLink,
        contact_phone: formData.contact_phone || editingJob.contact_phone,
        contact_email: formData.contact_email || editingJob.contact_email,
        status: 'ativa',
        contact_status: 'ok',
        needs_review: false
      });
      setShowContactDialog(false);
      loadPendingJobs();
      alert('Vaga publicada com sucesso!');
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleActivate = async (job) => {
    try {
      await base44.entities.Job.update(job.id, {
        status: 'ativa',
        needs_review: false,
        review_notes: ''
      });
      loadPendingJobs();
    } catch (error) {
      alert('Erro: ' + error.message);
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

  const JobCard = ({ job, type }) => (
    <Card key={job.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 dark:text-white flex-1 min-w-0">
                {job.title}
              </h3>
              {type === 'contact' ? (
                <Badge className="bg-orange-100 text-orange-700 shrink-0">
                  <Phone className="w-3 h-3 mr-1" />Sem Contato
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 shrink-0">
                  <MapPin className="w-3 h-3 mr-1" />Sem Localização
                </Badge>
              )}
              {job.is_premium && (
                <Badge className="bg-yellow-100 text-yellow-700 shrink-0">⭐ Premium</Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {job.company || 'Empresa não informada'}
            </p>
            <div className="flex flex-wrap gap-2 mb-1">
              {job.city && (
                <Badge variant="secondary" className="text-xs">{job.city}{job.state ? ` - ${job.state}` : ''}</Badge>
              )}
              {job.job_type && (
                <Badge variant="outline" className="text-xs">{job.job_type}</Badge>
              )}
              {job.origem && (
                <Badge variant="outline" className="text-xs text-slate-500">{job.origem}</Badge>
              )}
            </div>
            {job.review_notes && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ {job.review_notes}</p>
            )}
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <Link to={createPageUrl('JobDetail') + `?id=${job.id}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={() => openEditModal(job)}>
              <Edit className="w-4 h-4 mr-1" />Editar
            </Button>
            {type === 'contact' && (
              <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => openContactDialog(job)}>
                <Phone className="w-4 h-4 mr-1" />+ Contato
              </Button>
            )}
            {type === 'location' && (
              <Button variant="outline" size="sm" className="border-blue-500 text-blue-600 hover:bg-blue-50" onClick={() => handleActivate(job)}>
                <CheckCircle className="w-4 h-4 mr-1" />Ativar Assim
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => handleDelete(job.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Vagas Pendentes</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {pendingContact.length + pendingLocation.length} vagas aguardando revisão
          </p>
        </div>

        <Tabs defaultValue="location" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="location" className="gap-2">
              <MapPin className="w-4 h-4" />
              Sem Localização
              {pendingLocation.length > 0 && (
                <Badge className="bg-red-100 text-red-700 ml-1">{pendingLocation.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <Phone className="w-4 h-4" />
              Sem Contato
              {pendingContact.length > 0 && (
                <Badge className="bg-orange-100 text-orange-700 ml-1">{pendingContact.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="location">
            {pendingLocation.length === 0 ? (
              <Card><CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Nenhuma vaga sem localização!</h3>
                <p className="text-slate-600 dark:text-slate-400">Todas as vagas têm cidade/estado informados.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Estas vagas vieram da automação N8N mas <strong>não possuem cidade/estado</strong>. Edite para adicionar localização ou ative-as assim mesmo.
                  </p>
                </div>
                {pendingLocation.map(job => <JobCard key={job.id} job={job} type="location" />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contact">
            {pendingContact.length === 0 ? (
              <Card><CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Nenhuma vaga sem contato!</h3>
                <p className="text-slate-600 dark:text-slate-400">Todas as vagas têm informações de contato.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {pendingContact.map(job => <JobCard key={job.id} job={job} type="contact" />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Adicionar Contato */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
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
              <Input value={formData.contact_phone} onChange={(e) => setFormData(p => ({ ...p, contact_phone: e.target.value }))} placeholder="83999999999" className="h-11" />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input value={formData.contact_email} onChange={(e) => setFormData(p => ({ ...p, contact_email: e.target.value }))} placeholder="contato@empresa.com" className="h-11" />
            </div>
            <div>
              <Label className="text-sm">Site / Link de Inscrição</Label>
              <Input value={formData.website} onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className="h-11" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowContactDialog(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveContact} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />Publicar Vaga
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição Completa */}
      {showEditJobModal && editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => { setShowEditJobModal(false); setEditingJob(null); }}
          onUpdateSuccess={() => { setShowEditJobModal(false); setEditingJob(null); loadPendingJobs(); }}
        />
      )}
    </div>
  );
}