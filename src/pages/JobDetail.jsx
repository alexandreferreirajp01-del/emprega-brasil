import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, MapPin, Calendar, Building2, Briefcase, 
  DollarSign, ExternalLink, Lock, Clock, CheckCircle, Eye, MessageCircle, Share2, Heart
} from "lucide-react";
import ContactOptionsDialog, { extractContacts } from "@/components/common/ContactOptionsDialog";
import ShareJobDialog from "@/components/jobs/ShareJobDialog";
import FavoriteButton from "@/components/jobs/FavoriteButton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatLocationWithCity } from "@/components/common/NeighborhoodCityMap";
import { formatRelativeDate, ClickableText } from "@/components/common/ClickableContent";

export default function JobDetail() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

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

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.Job.filter({ id: jobId });
      return jobs[0];
    },
    enabled: !!jobId,
  });

  // Buscar visualizações da vaga - tempo real
  const { data: viewsData = [] } = useQuery({
    queryKey: ['job-views', jobId],
    queryFn: async () => {
      try {
        return await base44.entities.JobView.filter({ job_id: jobId }) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!jobId,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    staleTime: 3000,
  });

  const viewCount = viewsData.length;

  // Registrar visualização
  const registerViewMutation = useMutation({
    mutationFn: async () => {
      // Gerar ID único do visualizador
      let storedViewerId = localStorage.getItem('vagas_viewer_id');
      if (!storedViewerId) {
        storedViewerId = `viewer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('vagas_viewer_id', storedViewerId);
      }
      
      // Verificar se já visualizou esta vaga específica
      const viewKey = `viewed_job_${jobId}`;
      if (sessionStorage.getItem(viewKey)) return;
      
      // Detectar dispositivo
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && !(/Mobile/i.test(navigator.userAgent));
      const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
      
      // Obter localização via múltiplas APIs (fallback)
      let geoData = {
        city: 'Brasil',
        state: '',
        country: 'Brasil',
        latitude: -7.1195,
        longitude: -34.861
      };
      
      try {
        // Tentar ipapi.co primeiro
        const geoResponse = await fetch('https://ipapi.co/json/', { timeout: 5000 });
        if (geoResponse.ok) {
          const geo = await geoResponse.json();
          if (geo.latitude && geo.longitude) {
            geoData = {
              city: geo.city || 'Brasil',
              state: geo.region || geo.region_code || '',
              country: geo.country_name || 'Brasil',
              latitude: parseFloat(geo.latitude),
              longitude: parseFloat(geo.longitude),
              ip_address: geo.ip || ''
            };
          }
        }
      } catch (e) {
        // Tentar ip-api.com como fallback
        try {
          const fallbackResponse = await fetch('http://ip-api.com/json/?fields=city,regionName,country,lat,lon,query');
          if (fallbackResponse.ok) {
            const fallback = await fallbackResponse.json();
            if (fallback.lat && fallback.lon) {
              geoData = {
                city: fallback.city || 'Brasil',
                state: fallback.regionName || '',
                country: fallback.country || 'Brasil',
                latitude: parseFloat(fallback.lat),
                longitude: parseFloat(fallback.lon),
                ip_address: fallback.query || ''
              };
            }
          }
        } catch (e2) {
          console.log('Usando localização padrão');
        }
      }
      
      // Registrar visualização
      await base44.entities.JobView.create({
        job_id: jobId,
        viewer_id: storedViewerId,
        user_email: user?.email || '',
        device_type: deviceType,
        referrer: document.referrer || '',
        ...geoData
      });
      
      // Marcar como visualizado nesta sessão
      sessionStorage.setItem(viewKey, 'true');
    }
  });

  // Registrar visualização ao carregar e salvar no histórico
  useEffect(() => {
    if (job && jobId && canViewJob()) {
      registerViewMutation.mutate();
      
      // Salvar no histórico do usuário
      if (user) {
        saveToHistory();
      }
    }
  }, [job, jobId, user]);

  const saveToHistory = async () => {
    try {
      // Verificar se já está no histórico
      const existing = await base44.entities.ViewHistory.filter({
        job_id: jobId,
        user_email: user.email
      });
      
      if (existing.length === 0) {
        await base44.entities.ViewHistory.create({
          job_id: jobId,
          user_email: user.email,
          job_title: job?.title || '',
          job_company: job?.company || ''
        });
      }
    } catch (e) {
      console.log('Erro ao salvar histórico');
    }
  };

  const userIsPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin' || user?.email === 'alexandreferreirajp01@gmail.com';

  const canViewJob = () => {
    if (!job?.is_premium) return true;
    if (userIsPremium) return true;
    return false;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informado';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Vaga não encontrada</h2>
          <Link to={createPageUrl('Jobs')}>
            <Button className="mt-4">Voltar para vagas</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!canViewJob()) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Jobs')} className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para vagas
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <Card className="shadow-xl rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 backdrop-blur-md bg-white/70 z-10 flex flex-col items-center justify-center p-8">
              <Lock className="w-16 h-16 text-[#0056ff] mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
                Conteúdo Exclusivo
              </h2>
              <p className="text-slate-600 text-center mb-6 max-w-md">
                Esta vaga é exclusiva para assinantes. Adquira o plano vitalício para ter acesso completo a todas as oportunidades.
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button size="lg" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-8">
                  Adquira o Plano
                </Button>
              </Link>
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Jobs')} className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para vagas
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
                    <FavoriteButton job={job} user={user} />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowShareDialog(true)}
                      className="rounded-full"
                    >
                      <Share2 className="w-5 h-5" />
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
                <Badge className="bg-[#0056ff]/10 text-[#0056ff] border-0 px-4 py-2 text-sm rounded-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  {formatLocationWithCity(job.city)}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 border-0 px-4 py-2 text-sm rounded-full">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {job.job_type || 'Não informado'}
                </Badge>
                {job.job_function && (
                  <Badge className="bg-purple-100 text-purple-700 border-0 px-4 py-2 text-sm rounded-full">
                    {job.job_function}
                  </Badge>
                )}
                <Badge variant="outline" className="px-4 py-2 text-sm rounded-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Publicado em {formatDate(job.created_date)}
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
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 whitespace-pre-line">
                      <ClickableText text={job.description} />
                    </p>
                  </div>
                </div>
              )}



              {/* Additional Info ou Home Office Links */}
              {job.additional_info && (
                <div className="mb-8">
                  {job.additional_info.startsWith('__HOME_OFFICE_LINKS__') ? (
                    <>
                      <h2 className="text-lg font-semibold text-slate-800 mb-4">Vagas Disponíveis</h2>
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const jsonData = job.additional_info.replace('__HOME_OFFICE_LINKS__', '');
                            const links = JSON.parse(jsonData);
                            return links.map((item, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
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
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações Adicionais</h2>
                      <p className="text-slate-600 whitespace-pre-line">
                        <ClickableText text={job.additional_info} />
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Apply Button */}
              {(() => {
                const contacts = extractContacts(job);
                const hasContact = contacts.whatsapp || contacts.email || contacts.site;
                
                if (!hasContact) return null;
                
                return (
                  <div className="pt-6 border-t">
                    <Button 
                      size="lg" 
                      onClick={() => setShowContactDialog(true)}
                      className="w-full md:w-auto bg-[#25D366] hover:bg-[#20bd5a] rounded-xl h-14 px-8 text-lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Candidatar-se
                    </Button>
                    
                    <ContactOptionsDialog 
                      open={showContactDialog}
                      onOpenChange={setShowContactDialog}
                      job={job}
                    />
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <ShareJobDialog open={showShareDialog} onOpenChange={setShowShareDialog} job={job} />
    </div>
  );
}