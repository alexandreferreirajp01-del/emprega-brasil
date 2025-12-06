import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Wand2, Loader2, Check, ArrowLeft, Copy, 
  Home, ExternalLink, Briefcase, X, Crown, Star, Bell
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import NotificationTemplateSelector from "@/components/admin/NotificationTemplateSelector";
import AdvancedScheduler from "@/components/admin/AdvancedScheduler";

export default function VagasHomeOffice() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishingIndex, setPublishingIndex] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showNotificationSender, setShowNotificationSender] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const textareaRef = useRef(null);
  
  const showToast = (msg) => {
    alert(msg);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        const isRecruiter = currentUser?.subscription_type === 'recruiter';
        setIsAuthorized(isAdmin || isRecruiter);
      } catch (e) {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, []);

  // Limpa emojis e caracteres especiais do texto
  const cleanText = (text) => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // símbolos e pictogramas
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transporte e símbolos de mapa
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // bandeiras
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // símbolos diversos
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // variation selectors
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // suplemento de símbolos
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // símbolos de xadrez
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // símbolos e pictogramas estendidos
      .replace(/[\u{231A}-\u{231B}]/gu, '')   // relógios
      .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // botões de mídia
      .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // botões de mídia 2
      .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // quadrados
      .replace(/[\u{25B6}]/gu, '')            // play
      .replace(/[\u{25C0}]/gu, '')            // reverse
      .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // quadrados 2
      .replace(/[\u{2614}-\u{2615}]/gu, '')   // guarda-chuva e café
      .replace(/[\u{2648}-\u{2653}]/gu, '')   // signos
      .replace(/[\u{267F}]/gu, '')            // cadeira de rodas
      .replace(/[\u{2693}]/gu, '')            // âncora
      .replace(/[\u{26A1}]/gu, '')            // raio
      .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // círculos
      .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // bolas
      .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // boneco de neve e sol
      .replace(/[\u{26CE}]/gu, '')            // ofiúco
      .replace(/[\u{26D4}]/gu, '')            // proibido
      .replace(/[\u{26EA}]/gu, '')            // igreja
      .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // fonte e golfe
      .replace(/[\u{26F5}]/gu, '')            // barco
      .replace(/[\u{26FA}]/gu, '')            // barraca
      .replace(/[\u{26FD}]/gu, '')            // bomba de gasolina
      .replace(/[\u{2702}]/gu, '')            // tesoura
      .replace(/[\u{2705}]/gu, '')            // check verde
      .replace(/[\u{2708}-\u{270D}]/gu, '')   // avião e mão
      .replace(/[\u{270F}]/gu, '')            // lápis
      .replace(/[\u{2712}]/gu, '')            // caneta preta
      .replace(/[\u{2714}]/gu, '')            // check
      .replace(/[\u{2716}]/gu, '')            // X
      .replace(/[\u{271D}]/gu, '')            // cruz
      .replace(/[\u{2721}]/gu, '')            // estrela de davi
      .replace(/[\u{2728}]/gu, '')            // sparkles
      .replace(/[\u{2733}-\u{2734}]/gu, '')   // asteriscos
      .replace(/[\u{2744}]/gu, '')            // floco de neve
      .replace(/[\u{2747}]/gu, '')            // sparkle
      .replace(/[\u{274C}]/gu, '')            // X vermelho
      .replace(/[\u{274E}]/gu, '')            // X verde
      .replace(/[\u{2753}-\u{2755}]/gu, '')   // interrogações
      .replace(/[\u{2757}]/gu, '')            // exclamação
      .replace(/[\u{2763}-\u{2764}]/gu, '')   // corações
      .replace(/[\u{2795}-\u{2797}]/gu, '')   // operadores
      .replace(/[\u{27A1}]/gu, '')            // seta
      .replace(/[\u{27B0}]/gu, '')            // curly loop
      .replace(/[\u{27BF}]/gu, '')            // double curly loop
      .replace(/[\u{2934}-\u{2935}]/gu, '')   // setas curvas
      .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // setas
      .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // quadrados grandes
      .replace(/[\u{2B50}]/gu, '')            // estrela
      .replace(/[\u{2B55}]/gu, '')            // círculo
      .replace(/[\u{3030}]/gu, '')            // ondinha
      .replace(/[\u{303D}]/gu, '')            // parte alternada
      .replace(/[\u{3297}]/gu, '')            // parabéns
      .replace(/[\u{3299}]/gu, '')            // segredo
      .replace(/[👉✅💼🏠]/gu, '')            // emojis específicos
      .trim();
  };

  const extractWithAI = async () => {
    const rawInput = textareaRef.current?.value || '';
    if (!rawInput.trim()) return;
    
    // Limpar texto antes de enviar
    const text = cleanText(rawInput).slice(0, 3000);
    
    setIsExtracting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extraia as vagas de emprego do texto abaixo.

TEXTO:
${text}

Extraia: titulo (cargo/area), link (URL), descricao (breve, opcional).
Retorne JSON com array "vagas".`,
        response_json_schema: {
          type: "object",
          properties: {
            vagas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  link: { type: "string" },
                  descricao: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.vagas && Array.isArray(result.vagas)) {
        setExtractedJobs(result.vagas);
      } else {
        setExtractedJobs([]);
      }

    } catch (error) {
      console.error('Erro ao extrair dados:', error);
      alert('Erro ao extrair vagas. Tente novamente.');
    }
    setIsExtracting(false);
  };

  const publishAllMutation = useMutation({
    mutationFn: async () => {
      console.log('Publicando vagas home office:', extractedJobs.length);
      // Criar descrição apenas com os nomes das vagas (sem links visíveis)
      let description = `🏠 ${extractedJobs.length} Vagas Home Office disponíveis!\n\n`;
      description += `Confira as oportunidades:\n\n`;
      
      extractedJobs.forEach((job, index) => {
        description += `${index + 1}. ${job.titulo}\n`;
      });
      
      description += `\n💼 Todas as vagas são para trabalho remoto (Home Office).`;
      
      // Salvar os links em formato JSON no additional_info para renderizar botões
      const linksData = JSON.stringify(extractedJobs.map(job => ({
        titulo: job.titulo,
        link: job.link
      })));
      
      // Criar um único post agrupado
      const jobData = {
        title: `${extractedJobs.length} Vagas Home Office`,
        description: description,
        additional_info: `__HOME_OFFICE_LINKS__${linksData}`,
        job_type: 'Home Office',
        city: 'Brasil',
        is_premium: isPremium,
        is_featured: isFeatured
      };

      const isAdmin = user?.email === 'alexandreferreirajp01@gmail.com' || 
                      user?.role === 'admin' || 
                      user?.subscription_type === 'admin';
      const isRecruiter = user?.subscription_type === 'recruiter';

      if (isRecruiter && !isAdmin) {
        // Recrutador - criar solicitação
        await base44.entities.RecruiterRequest.create({
          recruiter_email: user.email,
          recruiter_name: user.full_name,
          recruiter_photo: user.profile_photo,
          request_type: 'job_homeoffice',
          title: `${extractedJobs.length} Vagas Home Office`,
          content_preview: `${extractedJobs.length} vagas para trabalho remoto`,
          full_content: jobData,
          status: 'pending'
        });
        return { pending: true };
      }
      
      const createdJob = await base44.entities.Job.create(jobData);
      console.log('Vaga home office criada:', createdJob);
      return createdJob;
    },
    onSuccess: async (result) => {
      if (result?.pending) {
        alert('Vagas enviadas para aprovação!');
      } else {
        setShowSuccess(true);
        setLastCreatedJob({
          id: result?.id,
          title: `${extractedJobs.length} Vagas Home Office`,
          city: 'Brasil'
        });
        setShowNotificationSender(true);
      }
      if (textareaRef.current) textareaRef.current.value = '';
      setExtractedJobs([]);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      console.error('Erro ao publicar home office:', error);
      alert('Erro ao publicar: ' + (error?.message || 'Erro desconhecido'));
    }
  });

  const publishSingleJob = async (job, index) => {
    setPublishingIndex(index);
    try {
      await base44.entities.Job.create({
        title: job.titulo,
        description: job.descricao || `Vaga Home Office - ${job.titulo}`,
        job_type: 'Home Office',
        city: 'Brasil',
        application_link: job.link,
        is_premium: false,
        is_featured: false
      });
      
      // Remover da lista após publicar
      setExtractedJobs(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Erro ao publicar:', error);
    }
    setPublishingIndex(null);
  };

  const clearAll = () => {
    if (textareaRef.current) textareaRef.current.value = '';
    setExtractedJobs([]);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500">Apenas administradores podem acessar esta função.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Admin')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Home Office</h1>
              <p className="text-white/70">Cole o texto com várias vagas e publique de uma vez</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Sucesso */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Vagas publicadas com sucesso!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Input de texto */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-green-600" />
                Texto das Vagas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-600 mb-2 block">
                  Cole aqui o texto com as vagas home office (até 5000 caracteres)
                </Label>
                <textarea
                  ref={textareaRef}
                  placeholder="Cole aqui o texto com as vagas..."
                  defaultValue=""
                  className="w-full min-h-[300px] text-base p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-400">
                    Até 5000 caracteres
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (textareaRef.current) textareaRef.current.value = '';
                  }}>
                    Limpar
                  </Button>
                </div>
              </div>

              <Button
                onClick={extractWithAI}
                disabled={isExtracting}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-xl"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extraindo vagas...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Gerar Vagas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Coluna 2: Vagas extraídas */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                {extractedJobs.length > 0 ? (
                  <span>{extractedJobs.length} Vagas Home Office</span>
                ) : (
                  <span>Vagas Extraídas</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>As vagas extraídas aparecerão aqui</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {extractedJobs.map((job, index) => (
                      <div 
                        key={index} 
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{job.titulo}</h3>
                            {job.descricao && (
                              <p className="text-sm text-slate-500 mt-1">{job.descricao}</p>
                            )}
                            <Badge className="mt-2 bg-green-100 text-green-700">
                              Home Office
                            </Badge>
                          </div>
                          <div className="flex items-start gap-2">
                            <a 
                              href={job.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Ver
                              </Button>
                            </a>
                            <Button 
                              size="sm"
                              onClick={() => publishSingleJob(job, index)}
                              disabled={publishingIndex === index}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {publishingIndex === index ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Publicar'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExtractedJobs(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Opções Premium e Destaque */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Vaga Premium</span>
                      </div>
                      <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">Destaque</span>
                      </div>
                      <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={clearAll}
                        className="flex-1"
                      >
                        Limpar
                      </Button>
                      <Button
                        onClick={() => setShowScheduler(true)}
                        disabled={extractedJobs.length === 0}
                        variant="outline"
                        className="flex-1"
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Agendar
                      </Button>
                    </div>
                    <Button
                      onClick={() => publishAllMutation.mutate()}
                      disabled={publishAllMutation.isPending || extractedJobs.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 h-12"
                    >
                      {publishAllMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Publicar Todas Agora ({extractedJobs.length})
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Template + Scheduler */}
        {showScheduler && !showNotificationSender && (
          <div className="mt-6 space-y-6">
            <NotificationTemplateSelector
              onNotificationDataChange={setNotificationData}
              jobTitle={`${extractedJobs.length} Vagas Home Office`}
              jobCompany="Diversas Empresas"
              jobCity="Brasil"
            />
            <AdvancedScheduler
              jobData={{ title: `${extractedJobs.length} Vagas Home Office`, extractedJobs }}
              notificationData={notificationData}
              postType="job_homeoffice"
              onScheduled={() => {
                setShowScheduler(false);
                clearAll();
                showToast('Vagas agendadas!');
              }}
              onPublishNow={() => {
                setShowScheduler(false);
                publishAllMutation.mutate();
              }}
              showToast={showToast}
            />
          </div>
        )}

        {/* Notification Template */}
        {showNotificationSender && lastCreatedJob && !showScheduler && (
          <div className="mt-6">
            <NotificationTemplateSelector
              onNotificationDataChange={setNotificationData}
              onSendNotification={async () => {
               if (notificationData && notificationData.title && notificationData.message && lastCreatedJob?.id) {
                 try {
                   const targetGroups = notificationData.premiumOnly ? ['premium', 'admin'] : ['visitor', 'basic', 'premium', 'recruiter', 'admin'];

                   await base44.functions.invoke('pushSend', {
                     title: notificationData.title,
                     message: notificationData.message,
                     icon: notificationData.icon,
                     url: `/jobs?id=${lastCreatedJob.id}`,
                     targetGroups
                   });

                   const users = await base44.entities.User.list();
                   const targetUsers = users.filter(u => {
                     if (notificationData.premiumOnly) {
                       return u.subscription_type === 'premium' || u.subscription_type === 'admin' || u.role === 'admin';
                     }
                     return true;
                   });

                   const notificationPromises = targetUsers.map(u => 
                     base44.entities.Notification.create({
                       user_email: u.email,
                       title: notificationData.title,
                       message: notificationData.message,
                       type: 'job',
                       is_read: false,
                       link: `/jobs?id=${lastCreatedJob.id}`
                     })
                   );
                   await Promise.all(notificationPromises);

                   if (notificationData.sendEmail) {
                     for (const u of targetUsers) {
                       try {
                         await base44.integrations.Core.SendEmail({
                           to: u.email,
                           subject: notificationData.title,
                           body: `${notificationData.message}\n\nAcesse: ${window.location.origin}/jobs?id=${lastCreatedJob.id}`
                         });
                       } catch (e) {
                         console.error('Erro ao enviar email:', e);
                       }
                     }
                   }

                   showToast('Notificação enviada!');
                   } catch (e) {
                   console.error('Erro:', e);
                   }
                   }
                   setShowNotificationSender(false);
                   }}
                   onSkipNotification={() => setShowNotificationSender(false)}
              jobTitle={lastCreatedJob.title}
              jobCompany="Diversas Empresas"
              jobCity={lastCreatedJob.city}
              isLoading={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}