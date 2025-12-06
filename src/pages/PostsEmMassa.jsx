import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Upload, Loader2, Sparkles, Image as ImageIcon, 
  FileText, CheckCircle, AlertCircle, Zap, Eye, Trash2, Send
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import NotificationTemplateSelector from "@/components/admin/NotificationTemplateSelector";
import AdvancedScheduler from "@/components/admin/AdvancedScheduler";

const JOB_FUNCTIONS = [
  "Auxiliar de cozinha", "ASG", "Auxiliar administrativo", "Analista administrativo",
  "Analista de compras", "Analista de logística", "Analista de marketing",
  "Analista de recursos humanos", "Analista de sistemas", "Atendente de balcão",
  "Atendente de call center", "Auxiliar de limpeza", "Auxiliar de manutenção",
  "Auxiliar de mecânico", "Auxiliar de produção", "Bibliotecário", "Biomédico",
  "Bombeiro", "Cabeleireiro", "Caixa de supermercado", "Carpinteiro",
  "Consultor de vendas", "Coordenador administrativo", "Coordenador de produção",
  "Coordenador de recursos humanos", "Cozinheiro", "Designer gráfico",
  "Desenvolvedor de software", "Digitador", "Eletricista", "Engenheiro civil",
  "Engenheiro de produção", "Engenheiro eletricista", "Engenheiro mecânico",
  "Farmacêutico", "Fisioterapeuta", "Garçom", "Jardineiro", "Jornalista",
  "Motorista", "Nutricionista", "Operador de caixa", "Operador de máquinas",
  "Pedreiro", "Pintor", "Professor", "Psicólogo", "Porteiro", "Recepcionista",
  "Técnico de enfermagem", "Técnico em informática", "Técnico em manutenção",
  "Vendedor", "Zelador", "Mecânico", "Balconista", "Copeiro", "Babá",
  "Lavador de Carros", "Faturista", "Departamento Pessoal", "Repositor",
  "Manobrista", "Tec Enfermagem", "Enfermeira", "Médica", "Gestor Comercial",
  "Gerente", "Coordenador", "Assistente Fiscal", "Assistente contábil",
  "Tec Segurança do trabalho", "Controladoria", "Compras", "Promotor de vendas",
  "Carregador", "Estoquista", "Logística", "Panfletista", "Outros"
];

const CIDADES_PB = [
  "João Pessoa", "Campina Grande", "Bayeux", "Cabedelo", "Santa Rita",
  "Patos", "Guarabira", "Cajazeiras", "Sousa", "Pombal", "Itabaiana",
  "Monteiro", "Mamanguape", "Catolé do Rocha", "Princesa Isabel",
  "Esperança", "Mari", "São Bento", "Conceição", "Itaporanga",
  "Sapé", "Sumé", "Picuí", "Cuité", "Alhandra", "Pedras de Fogo"
];

const JOB_TYPES = [
  "CLT", "PJ", "Estágio", "Temporário", "Jovem Aprendiz", "Freelancer", "MEI", "Autônomo"
];

const WORK_MODES = [
  "Presencial", "Home Office", "Híbrido", "Remoto"
];

export default function PostsEmMassa() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [postMode, setPostMode] = useState('auto'); // 'auto', 'manual', 'grouped'
  const [results, setResults] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [notificationData, setNotificationData] = useState(null);

  // Verificar autenticação
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                        user.role === 'admin' || 
                        user.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setCurrentUser(user);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    checkAuth();
  }, []);

  // Upload de imagens
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];

    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedImages.push({
          id: Date.now() + Math.random(),
          url: file_url,
          name: file.name,
          status: 'pending'
        });
      }
      setImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
    }
  };

  // Processar imagens com IA
  const processImages = async () => {
    if (images.length === 0) {
      alert('Adicione pelo menos uma imagem');
      return;
    }

    setProcessing(true);
    const allJobs = [];

    try {
      for (const img of images) {
        setImages(prev => prev.map(i => 
          i.id === img.id ? { ...i, status: 'processing' } : i
        ));

        // Usar IA para extrair vagas da imagem
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise esta imagem de vaga de emprego brasileira e extraia TODAS as vagas presentes. 
          
Para cada vaga encontrada, extraia:
- title: título/cargo da vaga (obrigatório)
- company: nome da empresa
- job_function: função (Vendedor, Atendente, etc)
- city: cidade da Paraíba. Se bairros como Mangabeira, Manaíra, Tambaú = João Pessoa. Se Intermares = Cabedelo
- description: descrição completa com requisitos, benefícios, horário
- salary_range: salário ou faixa salarial
- job_type: tipo (CLT, PJ, Estágio, Temporário, etc)
- work_mode: modalidade (Presencial, Home Office, Híbrido, Remoto)
- contact_phone: telefone/WhatsApp (com DDD 83)
- contact_email: email de contato
- application_link: link de candidatura ou site
- benefits: benefícios oferecidos
- requirements: requisitos necessários

IMPORTANTE: Se a imagem tiver múltiplas vagas, retorne TODAS separadamente. Extraia o máximo de informação possível.`,
          file_urls: [img.url],
          response_json_schema: {
            type: "object",
            properties: {
              jobs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    company: { type: "string" },
                    job_function: { type: "string" },
                    city: { type: "string" },
                    description: { type: "string" },
                    salary_range: { type: "string" },
                    job_type: { type: "string" },
                    work_mode: { type: "string" },
                    contact_phone: { type: "string" },
                    contact_email: { type: "string" },
                    application_link: { type: "string" },
                    benefits: { type: "string" },
                    requirements: { type: "string" }
                  }
                }
              }
            }
          }
        });

        const jobs = result.jobs || [];
        
        jobs.forEach(job => {
          // Encontrar cidade na lista
          let foundCity = '';
          if (job.city) {
            const cityLower = job.city.toLowerCase();
            foundCity = CIDADES_PB.find(c => c.toLowerCase() === cityLower) || 
                        CIDADES_PB.find(c => cityLower.includes(c.toLowerCase())) || 
                        job.city;
          }

          // Encontrar função na lista
          let foundFunction = '';
          if (job.job_function) {
            const funcLower = job.job_function.toLowerCase();
            foundFunction = JOB_FUNCTIONS.find(f => f.toLowerCase() === funcLower) || 
                           JOB_FUNCTIONS.find(f => funcLower.includes(f.toLowerCase())) || 
                           job.job_function;
          }

          // Montar descrição completa
          let fullDescription = job.description || '';
          if (job.requirements) fullDescription += `\n\nREQUISITOS:\n${job.requirements}`;
          if (job.benefits) fullDescription += `\n\nBENEFÍCIOS:\n${job.benefits}`;
          if (job.contact_phone) fullDescription += `\n\nCONTATO:\nWhatsApp: ${job.contact_phone}`;
          if (job.contact_email) fullDescription += `\nEmail: ${job.contact_email}`;

          // Determinar link de candidatura
          let applicationLink = '';
          if (job.application_link) {
            applicationLink = job.application_link.startsWith('http') ? job.application_link : `https://${job.application_link}`;
          } else if (job.contact_phone) {
            let phone = job.contact_phone.replace(/\D/g, '');
            if (phone.startsWith('0')) phone = phone.substring(1);
            if (!phone.startsWith('55')) phone = '55' + phone;
            applicationLink = `https://wa.me/${phone}`;
          } else if (job.contact_email) {
            applicationLink = `mailto:${job.contact_email}`;
          }

          allJobs.push({
            title: job.title,
            company: job.company || 'Empresa não informada',
            job_function: foundFunction,
            city: foundCity,
            description: fullDescription,
            salary_range: job.salary_range,
            job_type: job.job_type,
            application_link: applicationLink,
            image_url: img.url,
            imageName: img.name
          });
        });

        setImages(prev => prev.map(i => 
          i.id === img.id ? { ...i, status: 'completed', jobsFound: jobs.length } : i
        ));
      }

      setExtractedJobs(allJobs);
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      alert('Erro ao processar imagens com IA');
    } finally {
      setProcessing(false);
    }
  };

  // Publicar posts
  const publishPosts = async () => {
    if (extractedJobs.length === 0) {
      alert('Nenhuma vaga extraída para publicar');
      return;
    }

    console.log('Iniciando publicação em massa:', extractedJobs.length, 'vagas');
    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    let firstJobId = null;

    try {
      if (postMode === 'grouped') {
        // Criar uma única vaga com todas as informações
        const groupedTitle = `${extractedJobs.length} Vagas Disponíveis`;
        const groupedDescription = extractedJobs.map((job, i) => 
          `\n━━━━━━━━━━━━━━━━\n🔹 VAGA ${i + 1}: ${job.title}\n🏢 ${job.company}\n📍 ${job.city || 'Cidade não especificada'}\n💰 ${job.salary_range || 'A combinar'}\n📝 ${job.description}\n`
        ).join('');

        const groupedJob = await base44.entities.Job.create({
          title: groupedTitle,
          company: 'Múltiplas Empresas',
          description: groupedDescription,
          image_url: images[0]?.url,
          is_premium: notificationData?.premiumOnly || false,
          is_featured: false
        });

        firstJobId = groupedJob.id;
        successCount = 1;

      } else {
        // Criar posts separados
        for (const job of extractedJobs) {
          try {
            const createdJob = await base44.entities.Job.create({
              title: job.title,
              company: job.company,
              job_function: job.job_function,
              city: job.city,
              description: job.description,
              salary_range: job.salary_range,
              job_type: job.job_type,
              image_url: job.image_url,
              application_link: job.application_link,
              is_premium: notificationData?.premiumOnly || false,
              is_featured: false
            });

            if (!firstJobId) firstJobId = createdJob.id;
            successCount++;
          } catch (error) {
            console.error('Erro ao publicar vaga:', error);
            errorCount++;
          }
        }
      }

      setResults({
        success: successCount,
        error: errorCount,
        total: postMode === 'grouped' ? 1 : extractedJobs.length,
        firstJobId
      });

      // Se modo manual, mostrar painel de notificações
      if (postMode === 'manual' && firstJobId) {
        setLastCreatedJob({ 
          id: firstJobId, 
          title: extractedJobs[0]?.title,
          city: extractedJobs[0]?.city
        });
        setShowNotification(true);
      }

    } catch (error) {
      console.error('Erro completo ao publicar posts:', error);
      alert('Erro ao publicar: ' + (error?.message || error?.toString() || 'Erro desconhecido'));
    } finally {
      setProcessing(false);
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const reset = () => {
    setImages([]);
    setExtractedJobs([]);
    setResults(null);
    setShowNotification(false);
    setLastCreatedJob(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Posts em Massa</h1>
              <p className="text-white/70 text-sm">Upload múltiplas imagens e extraia vagas com IA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Upload de Imagens */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Imagens
              <Badge variant="outline" className="ml-auto">{images.length}/10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading || images.length >= 10}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                )}
                <p className="text-slate-600 font-medium mb-1">
                  {uploading ? 'Fazendo upload...' : 'Clique para selecionar imagens'}
                </p>
                <p className="text-slate-400 text-sm">Até 10 imagens (PNG, JPG)</p>
              </label>
            </div>

            {/* Imagens carregadas */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <img 
                      src={img.url} 
                      alt={img.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => removeImage(img.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {img.status === 'processing' && (
                      <div className="absolute inset-0 bg-purple-600/90 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    {img.status === 'completed' && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-lg text-xs">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        {img.jobsFound} vagas
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modo de Publicação */}
        {images.length > 0 && !processing && extractedJobs.length === 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Modo de Publicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setPostMode('auto')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  postMode === 'auto' 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                    postMode === 'auto' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }`}>
                    {postMode === 'auto' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-1"></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Publicar Automaticamente</p>
                    <p className="text-sm text-slate-500">Cria posts e envia notificações automáticas para todas as vagas</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPostMode('manual')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  postMode === 'manual' 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                    postMode === 'manual' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }`}>
                    {postMode === 'manual' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-1"></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Publicar Manualmente</p>
                    <p className="text-sm text-slate-500">Cria posts separados e permite enviar notificações depois</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPostMode('grouped')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  postMode === 'grouped' 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                    postMode === 'grouped' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }`}>
                    {postMode === 'grouped' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-1"></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Post Agrupado</p>
                    <p className="text-sm text-slate-500">Cria um único post com todas as vagas</p>
                  </div>
                </div>
              </button>

              <Button
                onClick={processImages}
                disabled={processing}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Processar Imagens com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Vagas Extraídas */}
        {extractedJobs.length > 0 && !results && (
          <div className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Vagas Extraídas
                  <Badge className="ml-auto bg-green-100 text-green-700">
                    {extractedJobs.length} vagas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {extractedJobs.map((job, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-semibold text-slate-800 mb-2">{job.title}</h4>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>🏢 {job.company}</p>
                        {job.city && <p>📍 {job.city}</p>}
                        {job.salary_range && <p>💰 {job.salary_range}</p>}
                        {job.job_function && <p>💼 {job.job_function}</p>}
                        {job.job_type && <p>📋 {job.job_type}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Template Selector */}
            <NotificationTemplateSelector
              onNotificationDataChange={setNotificationData}
              onSendNotification={async () => {
                await publishPosts();
                if (notificationData && notificationData.title && notificationData.message && results?.firstJobId) {
                  try {
                    const targetGroups = notificationData.premiumOnly ? ['premium', 'admin'] : ['visitor', 'basic', 'premium', 'recruiter', 'admin'];
                    
                    // Enviar notificação push
                    await base44.functions.invoke('pushSend', {
                      title: notificationData.title,
                      message: notificationData.message,
                      icon: notificationData.icon,
                      url: `/jobs?id=${results.firstJobId}`,
                      targetGroups
                    });

                    // Buscar usuários do grupo alvo para criar notificações no sininho
                    const users = await base44.entities.User.list();
                    const targetUsers = users.filter(u => {
                      if (notificationData.premiumOnly) {
                        return u.subscription_type === 'premium' || u.subscription_type === 'admin' || u.role === 'admin';
                      }
                      return true; // Todos
                    });

                    // Criar notificação no sininho para cada usuário
                    const notificationPromises = targetUsers.map(u => 
                      base44.entities.Notification.create({
                        user_email: u.email,
                        title: notificationData.title,
                        message: notificationData.message,
                        type: 'job',
                        is_read: false,
                        link: `/jobs?id=${results.firstJobId}`
                      })
                    );
                    await Promise.all(notificationPromises);

                    // Enviar emails se habilitado
                    if (notificationData.sendEmail) {
                      for (const u of targetUsers) {
                        try {
                          await base44.integrations.Core.SendEmail({
                            to: u.email,
                            subject: notificationData.title,
                            body: `${notificationData.message}\n\nAcesse: ${window.location.origin}/jobs?id=${results.firstJobId}`
                          });
                        } catch (e) {
                          console.error('Erro ao enviar email:', e);
                        }
                      }
                    }

                    alert('Notificações enviadas com sucesso!');
                  } catch (e) {
                    console.error('Erro ao enviar notificações:', e);
                    alert('Erro ao enviar notificações');
                  }
                }
              }}
              onSkipNotification={publishPosts}
              jobTitle={extractedJobs[0]?.title}
              jobCompany={extractedJobs[0]?.company}
              jobCity={extractedJobs[0]?.city}
              isLoading={processing}
            />

            {/* Scheduler com Repetição */}
            <AdvancedScheduler
              jobData={{ extractedJobs, postMode }}
              notificationData={notificationData}
              postType="job_mass"
              onScheduled={() => {
                reset();
                alert('Posts agendados com sucesso!');
              }}
              onPublishNow={publishPosts}
              showToast={(msg) => alert(msg)}
            />
          </div>
        )}

        {/* Scheduler */}
        {showScheduler && extractedJobs.length > 0 && !results && (
          <div className="space-y-4">
            <PostScheduler
              jobData={{ extractedJobs, postMode }}
              postType="job_mass"
              onScheduled={() => {
                setShowScheduler(false);
                reset();
                alert('Posts agendados!');
              }}
              onPublishNow={() => {
                setShowScheduler(false);
                publishPosts();
              }}
              showToast={(msg) => alert(msg)}
            />
          </div>
        )}

        {/* Painel de Notificações (modo manual) */}
        {showNotification && lastCreatedJob && !results && !showScheduler && (
          <div className="space-y-4">
            <NotificationSender 
              showToast={(msg) => alert(msg)}
              job={lastCreatedJob}
              onClose={() => {
                setShowNotification(false);
                setResults({ success: extractedJobs.length, error: 0, total: extractedJobs.length });
              }}
            />
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowNotification(false);
                setResults({ success: extractedJobs.length, error: 0, total: extractedJobs.length });
              }}
              className="w-full"
            >
              Pular Notificação
            </Button>
          </div>
        )}

        {/* Resultados */}
        {results && !showNotification && (
          <Card className="rounded-2xl border-2 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Publicação Concluída!</h3>
              <p className="text-slate-600 mb-6">
                {results.success} de {results.total} vagas publicadas com sucesso na aba Vagas
              </p>
              <div className="flex gap-3">
                <Link to={createPageUrl('Jobs')} className="flex-1">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">
                    <Eye className="w-5 h-5 mr-2" />
                    Ver Vagas
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={reset}
                  className="flex-1 rounded-xl"
                >
                  Nova Publicação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}