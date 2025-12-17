import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, MapPin, Calendar, Building2, Briefcase, 
  DollarSign, ExternalLink, Lock, Eye, MessageCircle, Share2, Heart, RefreshCw, Loader2, AlertTriangle, Edit
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PremiumModal from "@/components/subscription/PremiumModal";
import EditJobModal from "@/components/admin/EditJobModal";

// Função de fetch robusta
async function safeFetch(fetchFn, fallback = null) {
  for (let i = 0; i < 3; i++) {
    try {
      const result = await fetchFn();
      return result;
    } catch (e) {
      if (i === 2) return fallback;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  return fallback;
}

// Formatar data
function formatDate(dateStr) {
  if (!dateStr) return 'Não informado';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// Extrair contatos do job
function extractContacts(job) {
  if (!job) return { whatsapp: null, email: null, site: null };
  
  const text = `${job.description || ''} ${job.additional_info || ''} ${job.application_link || ''}`;
  
  // WhatsApp
  const phoneRegex = /\(?\d{2}\)?[\s.-]?\d{4,5}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex) || [];
  const whatsapp = phones.length > 0 ? phones[0].replace(/\D/g, '') : null;
  
  // Email
  const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  const email = emails.length > 0 ? emails[0] : null;
  
  // Site
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  const site = urls.length > 0 ? urls[0] : (job.application_link || null);
  
  return { whatsapp, email, site };
}

export default function JobDetail() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [job, setJob] = useState(null);
  const [views, setViews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  // Load data
  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }
    
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      
      // Buscar todas as vagas e filtrar
      const [allJobs, allViews, allFavorites] = await Promise.all([
        safeFetch(() => base44.entities.Job.list('-created_date', 500), []),
        safeFetch(() => base44.entities.JobView.list('-created_date', 2000), []),
        user ? safeFetch(() => base44.entities.FavoriteJob.list('-created_date', 500), []) : Promise.resolve([])
      ]);

      if (mounted) {
        // Encontrar a vaga específica
        const foundJob = allJobs?.find(j => j.id === jobId) || null;
        setJob(foundJob);
        
        // Filtrar views desta vaga
        setViews(allViews?.filter(v => v.job_id === jobId) || []);
        
        // Filtrar favoritos do usuário
        setFavorites(allFavorites?.filter(f => f.user_email === user?.email) || []);
        
        setIsLoading(false);
        
        // Registrar visualização
        if (foundJob && user) {
          registerView(foundJob);
          saveToHistory(foundJob);
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [jobId, user, refreshKey]);

  // Registrar visualização
  const registerView = async (jobData) => {
    const viewKey = `viewed_job_${jobId}`;
    if (sessionStorage.getItem(viewKey)) return;
    
    try {
      let viewerId = localStorage.getItem('vagas_viewer_id');
      if (!viewerId) {
        viewerId = `viewer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('vagas_viewer_id', viewerId);
      }
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      await base44.entities.JobView.create({
        job_id: jobId,
        viewer_id: viewerId,
        user_email: user?.email || '',
        device_type: isMobile ? 'mobile' : 'desktop',
        city: 'Brasil',
        country: 'Brasil'
      });
      
      sessionStorage.setItem(viewKey, 'true');
      setViews(prev => [...prev, { job_id: jobId }]);
    } catch (e) {
      console.warn('Erro ao registrar view:', e);
    }
  };

  // Salvar no histórico
  const saveToHistory = async (jobData) => {
    try {
      const allHistory = await safeFetch(() => base44.entities.ViewHistory.list('-created_date', 500), []);
      const existing = allHistory?.find(h => h.job_id === jobId && h.user_email === user?.email);
      
      if (!existing) {
        await base44.entities.ViewHistory.create({
          job_id: jobId,
          user_email: user.email,
          job_title: jobData?.title || '',
          job_company: jobData?.company || ''
        });
      }
    } catch (e) {
      console.warn('Erro ao salvar histórico:', e);
    }
  };

  // Premium check
  const userIsPremium = user?.subscription_type === 'premium' || 
    user?.subscription_type === 'admin' || 
    user?.role === 'admin';

  const canViewJob = () => {
    if (!job?.is_premium) return true;
    return userIsPremium;
  };

  // Favorite handling
  const isFavorite = favorites.some(f => f.job_id === jobId);
  
  const handleFavorite = async () => {
    if (!user) return;
    
    try {
      const existing = favorites.find(f => f.job_id === jobId);
      if (existing) {
        await base44.entities.FavoriteJob.delete(existing.id);
        setFavorites(prev => prev.filter(f => f.id !== existing.id));
      } else {
        const newFav = await base44.entities.FavoriteJob.create({
          job_id: jobId,
          user_email: user.email,
          job_title: job?.title || '',
          job_company: job?.company || ''
        });
        setFavorites(prev => [...prev, newFav]);
      }
    } catch (e) {
      console.warn('Erro ao favoritar:', e);
    }
  };

  const handleRetry = () => setRefreshKey(k => k + 1);

  const handleSendReport = async () => {
    if (!reportSubject.trim() || !reportMessage.trim()) return;
    
    setSendingReport(true);
    try {
      const newOccurrence = await base44.entities.Occurrence.create({
        user_email: user?.email || 'visitante@email.com',
        user_name: user?.full_name || 'Visitante',
        job_id: jobId,
        job_title: job?.title || '',
        subject: reportSubject.trim(),
        message: reportMessage.trim(),
        status: 'pending'
      });

      // Notificar admins sobre nova ocorrência
      try {
        await base44.functions.invoke('notifyAdmins', {
          event_type: 'occurrence',
          data: {
            occurrence_id: newOccurrence.id,
            user_name: user?.full_name || 'Visitante',
            subject: reportSubject.trim()
          }
        });
      } catch (e) {
        console.warn('Erro ao notificar admins:', e);
      }

      setShowReportDialog(false);
      setReportSubject('');
      setReportMessage('');
    } catch (error) {
      console.error('Erro ao reportar:', error);
    } finally {
      setSendingReport(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // Not found state
  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Vaga não encontrada</h2>
          <p className="text-slate-500 mb-4">A vaga pode ter sido removida ou o link está incorreto.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
            <Link to={createPageUrl('Jobs')}>
              <Button className="bg-[#0A66C2] hover:bg-[#004182]">Voltar para vagas</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Premium locked state
  if (!canViewJob()) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Jobs')} className="inline-flex items-center text-white/80 hover:text-white mb-6">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para vagas
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <Card className="shadow-xl rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 backdrop-blur-md bg-white/70 z-10 flex flex-col items-center justify-center p-8">
              <Lock className="w-16 h-16 text-[#0A66C2] mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Conteúdo Exclusivo</h2>
              <p className="text-slate-600 text-center mb-6 max-w-md">
                Esta vaga é exclusiva para assinantes Premium.
              </p>
              <Button 
                size="lg" 
                onClick={() => setShowPremiumModal(true)}
                className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl px-8"
              >
                Adquira o Plano
              </Button>
            </div>
            <CardContent className="p-8 filter blur-md">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">{job.title}</h1>
              <p className="text-slate-600">{job.description?.substring(0, 200)}...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const contacts = extractContacts(job);
  const hasContact = contacts.whatsapp || contacts.email || contacts.site;
  const viewCount = views.length;
  
  // Verificar se é admin ou dono
  const isAdmin = user?.role === 'admin' || 
    user?.subscription_type === 'admin' || 
    user?.email === 'alexandreferreirajp01@gmail.com';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Jobs')} className="inline-flex items-center text-white/80 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para vagas
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <Card className="shadow-xl rounded-2xl overflow-hidden mb-6">
          <CardContent className="p-6 md:p-8">
            {/* Title Section */}
            <div className="mb-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                    {job.title || 'Não informado'}
                  </h1>
                  <p className="text-lg text-slate-500 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {job.company || 'Empresa confidencial'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowEditModal(true)}
                      className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      title="Editar Vaga"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                  )}
                  {user && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFavorite}
                      className={`rounded-full ${isFavorite ? 'text-red-500 border-red-200' : ''}`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowShareDialog(true)}
                    className="rounded-full"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowReportDialog(true)}
                    className="rounded-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                    title="Reportar Vaga"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              {job.salary_range && (
                <div className="mt-3 bg-green-50 px-4 py-2 rounded-xl inline-block">
                  <p className="text-green-700 font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    {job.salary_range}
                  </p>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
              {job.city && (
                <Badge className="bg-[#0A66C2]/10 text-[#0A66C2] border-0 px-4 py-2 text-sm rounded-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  {job.city}
                </Badge>
              )}
              {job.job_type && (
                <Badge className="bg-slate-100 text-slate-700 border-0 px-4 py-2 text-sm rounded-full">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {job.job_type}
                </Badge>
              )}
              {job.job_function && (
                <Badge className="bg-purple-100 text-purple-700 border-0 px-4 py-2 text-sm rounded-full">
                  {job.job_function}
                </Badge>
              )}
              <Badge variant="outline" className="px-4 py-2 text-sm rounded-full">
                <Calendar className="w-4 h-4 mr-2" />
                Publicado em: {formatDate(job.published_at || job.created_date)}
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 border-0 px-4 py-2 text-sm rounded-full">
                <Eye className="w-4 h-4 mr-2" />
                {viewCount} visualizações
              </Badge>
            </div>

            {/* Description */}
            {job.description && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Descrição da Vaga</h2>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {job.description}
                </p>
              </div>
            )}

            {/* Additional Info */}
            {job.additional_info && !job.additional_info.startsWith('__HOME_OFFICE_LINKS__') && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações Adicionais</h2>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {job.additional_info}
                </p>
              </div>
            )}

            {/* Home Office Links */}
            {job.additional_info?.startsWith('__HOME_OFFICE_LINKS__') && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Vagas Disponíveis</h2>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const jsonData = job.additional_info.replace('__HOME_OFFICE_LINKS__', '');
                      const links = JSON.parse(jsonData);
                      return links.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <span className="font-medium text-slate-800">{item.titulo}</span>
                          </div>
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-[#25D366] hover:bg-[#20bd5a] rounded-lg">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Candidatar-se
                            </Button>
                          </a>
                        </div>
                      ));
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Apply Button */}
            {hasContact && (
              <div className="pt-6 border-t">
                <Button 
                  size="lg" 
                  onClick={() => setShowContactDialog(true)}
                  className="w-full md:w-auto bg-[#25D366] hover:bg-[#20bd5a] rounded-xl h-14 px-8 text-lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Candidatar-se
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Share Dialog */}
      <ShareDialog 
        job={job} 
        open={showShareDialog} 
        onClose={() => setShowShareDialog(false)} 
      />

      {/* Contact Dialog */}
      <ContactDialog 
        job={job}
        contacts={contacts}
        open={showContactDialog} 
        onClose={() => setShowContactDialog(false)} 
      />

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={user}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Reportar Problema
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="report-subject">Assunto *</Label>
              <Input
                id="report-subject"
                value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)}
                placeholder="Ex: Vaga falsa, dados incorretos..."
                className="mt-1 rounded-xl"
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="report-message">Mensagem * (máx. 1000 caracteres)</Label>
              <Textarea
                id="report-message"
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value.slice(0, 1000))}
                placeholder="Descreva o problema..."
                className="mt-1 min-h-[120px] rounded-xl"
                maxLength={1000}
              />
              <p className="text-xs text-slate-500 mt-1">{reportMessage.length}/1000</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportDialog(false);
                  setReportSubject('');
                  setReportMessage('');
                }}
                disabled={sendingReport}
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendReport}
                disabled={!reportSubject.trim() || !reportMessage.trim() || sendingReport}
                className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-700"
              >
                {sendingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal - Admin/Dono apenas */}
      {isAdmin && (
        <EditJobModal
          job={job}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}

// Share Dialog Component
function ShareDialog({ job, open, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const shareUrl = `${window.location.origin}${createPageUrl('JobDetail')}?id=${job.id}`;
  const shareText = `Vaga: ${job.title} - ${job.company}\n${shareUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Vaga</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{job.title} - {job.company}</p>
          <div className="flex gap-2">
            <Button onClick={handleWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
              WhatsApp
            </Button>
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Contact Dialog Component
function ContactDialog({ job, contacts, open, onClose }) {
  if (!job) return null;

  const handleWhatsApp = () => {
    if (contacts.whatsapp) {
      const phone = contacts.whatsapp.length === 10 ? `55${contacts.whatsapp}` : 
                   contacts.whatsapp.length === 11 ? `55${contacts.whatsapp}` : contacts.whatsapp;
      const message = `Olá! Vi a vaga de ${job.title} no Vagas Abertas Paraíba e gostaria de me candidatar.`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (contacts.email) {
      const subject = `Candidatura - ${job.title}`;
      const body = `Olá!\n\nVi a vaga de ${job.title} no Vagas Abertas Paraíba e gostaria de me candidatar.\n\nAtenciosamente`;
      window.open(`mailto:${contacts.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    }
  };

  const handleSite = () => {
    if (contacts.site) {
      window.open(contacts.site, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como deseja se candidatar?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {contacts.whatsapp && (
            <Button 
              onClick={handleWhatsApp} 
              className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] rounded-xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
          )}
          {contacts.email && (
            <Button 
              onClick={handleEmail} 
              variant="outline"
              className="w-full h-12 rounded-xl"
            >
              E-mail: {contacts.email}
            </Button>
          )}
          {contacts.site && (
            <Button 
              onClick={handleSite} 
              variant="outline"
              className="w-full h-12 rounded-xl"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Acessar Site
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}