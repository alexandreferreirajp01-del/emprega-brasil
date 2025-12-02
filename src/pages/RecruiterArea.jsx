import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Briefcase, Sparkles, Home, Newspaper, Loader2, Upload, 
  Check, Crown, Star, ArrowLeft, Lock, Search, Wand2,
  MapPin, Building2, DollarSign, Phone, Link as LinkIcon, FileText, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { getBrasiliaISOString } from "@/components/common/BrasiliaTime";

const JOB_FUNCTIONS = [
  "Auxiliar de cozinha", "ASG", "Auxiliar administrativo", "Analista administrativo",
  "Analista de compras", "Analista de logística", "Analista de marketing",
  "Analista de recursos humanos", "Analista de sistemas", "Atendente de balcão",
  "Atendente de call center", "Auxiliar de limpeza", "Auxiliar de manutenção",
  "Auxiliar de mecânico", "Auxiliar de produção", "Bibliotecário", "Biomédico",
  "Cabeleireiro", "Caixa de supermercado", "Carpinteiro", "Consultor de vendas",
  "Coordenador administrativo", "Coordenador de produção", "Cozinheiro",
  "Designer gráfico", "Desenvolvedor de software", "Eletricista", "Engenheiro civil",
  "Farmacêutico", "Fisioterapeuta", "Garçom", "Motorista", "Nutricionista",
  "Operador de caixa", "Pedreiro", "Pintor", "Professor", "Psicólogo", "Porteiro",
  "Recepcionista", "Técnico de enfermagem", "Técnico em informática", "Vendedor",
  "Mecânico", "Balconista", "Copeiro", "Babá", "Repositor", "Enfermeira",
  "Gerente", "Coordenador", "Estoquista", "Logística", "Promotor de vendas", "Outros"
];

const CIDADES_PB = [
  "João Pessoa", "Campina Grande", "Bayeux", "Cabedelo", "Santa Rita",
  "Patos", "Sousa", "Cajazeiras", "Guarabira", "Mamanguape", "Sapé",
  "Monteiro", "Pombal", "Esperança", "Itabaiana", "Queimadas", "Solânea",
  "Catolé do Rocha", "Cabaceiras", "Areia", "Bananeiras", "Piancó",
  "Remígio", "Cuité", "Sumé", "Picuí", "Princesa Isabel", "Outras"
];

export default function RecruiterArea() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states for job posting
  const [jobForm, setJobForm] = useState({
    title: '', company: '', job_function: '', city: '', description: '',
    salary_range: '', contact_phone: '', contact_email: '', image_url: '',
    is_premium: false, is_featured: false, website: ''
  });

  // Form states for AI job
  const [aiText, setAiText] = useState('');
  const [aiExtractedData, setAiExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Form states for Home Office
  const [homeOfficeText, setHomeOfficeText] = useState('');
  const [homeOfficeJobs, setHomeOfficeJobs] = useState([]);
  const [isExtractingHO, setIsExtractingHO] = useState(false);
  const [isPremiumHO, setIsPremiumHO] = useState(false);
  const [isFeaturedHO, setIsFeaturedHO] = useState(false);
  const textareaRef = useRef(null);

  // Form states for News
  const [newsForm, setNewsForm] = useState({
    title: '', subtitle: '', content: '', image_url: '', category: 'Geral'
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Search states
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const isRecruiter = currentUser?.subscription_type === 'recruiter';
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        
        setIsAuthorized(isRecruiter || isAdmin);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // ========== POSTAR VAGA ==========
  const handleSubmitJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title) return;
    setSubmitting(true);

    try {
      let description = jobForm.description || '';
      if (jobForm.contact_phone || jobForm.contact_email) {
        description += '\n\n--- CONTATO ---';
        if (jobForm.contact_phone) description += `\nWhatsApp: ${jobForm.contact_phone}`;
        if (jobForm.contact_email) description += `\nEmail: ${jobForm.contact_email}`;
      }

      let applicationLink = '';
      if (jobForm.website) {
        applicationLink = jobForm.website.startsWith('http') ? jobForm.website : `https://${jobForm.website}`;
      } else if (jobForm.contact_phone) {
        let phone = jobForm.contact_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = phone.substring(1);
        if (!phone.startsWith('55')) phone = '55' + phone;
        applicationLink = `https://wa.me/${phone}`;
      } else if (jobForm.contact_email) {
        applicationLink = `mailto:${jobForm.contact_email}`;
      }

      const jobData = {
        title: jobForm.title,
        company: jobForm.company,
        job_function: jobForm.job_function,
        city: jobForm.city,
        salary_range: jobForm.salary_range,
        image_url: jobForm.image_url,
        description: description,
        is_premium: jobForm.is_premium,
        is_featured: jobForm.is_featured,
        application_link: applicationLink
      };

      await base44.entities.RecruiterRequest.create({
        recruiter_email: user.email,
        recruiter_name: user.full_name,
        recruiter_photo: user.profile_photo,
        request_type: 'job',
        title: jobForm.title,
        content_preview: `${jobForm.company || 'Empresa não informada'} - ${jobForm.city || 'Cidade não informada'}`,
        full_content: jobData,
        status: 'pending'
      });

      setJobForm({
        title: '', company: '', job_function: '', city: '', description: '',
        salary_range: '', contact_phone: '', contact_email: '', image_url: '',
        is_premium: false, is_featured: false, website: ''
      });
      showSuccess('Vaga enviada para aprovação!');
    } catch (err) {
      alert('Erro ao enviar vaga');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== VAGAS POR IA ==========
  const handleExtractAI = async () => {
    if (!aiText.trim()) return;
    setIsExtracting(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o seguinte texto de vaga de emprego e extraia as informações estruturadas.
        
TEXTO DA VAGA:
${aiText}

Extraia as seguintes informações (se não encontrar, deixe vazio):
- titulo: título/cargo da vaga
- empresa: nome da empresa que está contratando
- funcao: função/cargo
- cidade: cidade da vaga
- descricao: descrição completa da vaga
- salario: faixa salarial
- telefone: telefone ou WhatsApp para contato
- link: site ou link para candidatura`,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            empresa: { type: "string" },
            funcao: { type: "string" },
            cidade: { type: "string" },
            descricao: { type: "string" },
            salario: { type: "string" },
            telefone: { type: "string" },
            link: { type: "string" }
          }
        }
      });

      setAiExtractedData(result);
    } catch (error) {
      alert('Erro ao extrair dados');
    }
    setIsExtracting(false);
  };

  const handleSubmitAIJob = async () => {
    if (!aiExtractedData?.titulo) return;
    setSubmitting(true);

    try {
      const jobData = {
        title: aiExtractedData.titulo,
        company: aiExtractedData.empresa,
        job_function: aiExtractedData.funcao,
        city: aiExtractedData.cidade,
        description: aiExtractedData.descricao,
        salary_range: aiExtractedData.salario,
        additional_info: aiExtractedData.telefone ? `Contato: ${aiExtractedData.telefone}` : '',
        application_link: aiExtractedData.link
      };

      await base44.entities.RecruiterRequest.create({
        recruiter_email: user.email,
        recruiter_name: user.full_name,
        recruiter_photo: user.profile_photo,
        request_type: 'job_ai',
        title: aiExtractedData.titulo,
        content_preview: `${aiExtractedData.empresa || 'Empresa'} - ${aiExtractedData.cidade || 'Cidade'}`,
        full_content: jobData,
        status: 'pending'
      });

      setAiText('');
      setAiExtractedData(null);
      showSuccess('Vaga por IA enviada para aprovação!');
    } catch (err) {
      alert('Erro ao enviar vaga');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== VAGAS HOME OFFICE ==========
  const handleExtractHomeOffice = async () => {
    const rawInput = textareaRef.current?.value || homeOfficeText;
    if (!rawInput.trim()) return;
    setIsExtractingHO(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extraia as vagas de emprego do texto abaixo.

TEXTO:
${rawInput.slice(0, 3000)}

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
        setHomeOfficeJobs(result.vagas);
      }
    } catch (error) {
      alert('Erro ao extrair vagas');
    }
    setIsExtractingHO(false);
  };

  const handleSubmitHomeOffice = async () => {
    if (homeOfficeJobs.length === 0) return;
    setSubmitting(true);

    try {
      let description = `🏠 ${homeOfficeJobs.length} Vagas Home Office disponíveis!\n\n`;
      description += `Confira as oportunidades:\n\n`;
      homeOfficeJobs.forEach((job, index) => {
        description += `${index + 1}. ${job.titulo}\n`;
      });
      description += `\n💼 Todas as vagas são para trabalho remoto (Home Office).`;

      const linksData = JSON.stringify(homeOfficeJobs.map(job => ({
        titulo: job.titulo,
        link: job.link
      })));

      const jobData = {
        title: `${homeOfficeJobs.length} Vagas Home Office`,
        description: description,
        additional_info: `__HOME_OFFICE_LINKS__${linksData}`,
        job_type: 'Home Office',
        city: 'Brasil',
        is_premium: isPremiumHO,
        is_featured: isFeaturedHO
      };

      await base44.entities.RecruiterRequest.create({
        recruiter_email: user.email,
        recruiter_name: user.full_name,
        recruiter_photo: user.profile_photo,
        request_type: 'job_homeoffice',
        title: `${homeOfficeJobs.length} Vagas Home Office`,
        content_preview: `${homeOfficeJobs.length} vagas para trabalho remoto`,
        full_content: jobData,
        status: 'pending'
      });

      if (textareaRef.current) textareaRef.current.value = '';
      setHomeOfficeText('');
      setHomeOfficeJobs([]);
      showSuccess('Vagas Home Office enviadas para aprovação!');
    } catch (err) {
      alert('Erro ao enviar vagas');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== POSTAR NOTÍCIAS ==========
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewsForm(prev => ({ ...prev, image_url: file_url }));
    } catch (err) {
      alert('Erro ao carregar imagem');
    }
    setUploadingImage(false);
  };

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) return;
    setSubmitting(true);

    try {
      await base44.entities.RecruiterRequest.create({
        recruiter_email: user.email,
        recruiter_name: user.full_name,
        recruiter_photo: user.profile_photo,
        request_type: 'news',
        title: newsForm.title,
        content_preview: newsForm.subtitle || newsForm.content.substring(0, 200),
        full_content: {
          title: newsForm.title,
          subtitle: newsForm.subtitle,
          content: newsForm.content,
          image_url: newsForm.image_url,
          category: newsForm.category,
          author_name: user.full_name
        },
        status: 'pending'
      });

      setNewsForm({ title: '', subtitle: '', content: '', image_url: '', category: 'Geral' });
      showSuccess('Notícia enviada para aprovação!');
    } catch (err) {
      alert('Erro ao enviar notícia');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Área do Recrutador</h1>
                <p className="text-white/70">Acesso exclusivo para recrutadores</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-12">
          <Card className="rounded-2xl text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Função Exclusiva</h2>
              <p className="text-slate-500 mb-6">
                Esta área é exclusiva para usuários com o Plano Recrutador.
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl">
                  <Crown className="w-5 h-5 mr-2" />
                  Ver Plano Recrutador
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-green-600 text-white rounded-2xl shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar ao Perfil
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Área do Recrutador</h1>
              <p className="text-white/70">Publique vagas e notícias</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm rounded-xl p-1 grid grid-cols-4 w-full">
            <TabsTrigger value="jobs" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Postar</span> Vaga
            </TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Vaga por</span> IA
            </TabsTrigger>
            <TabsTrigger value="homeoffice" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Home className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Home</span> Office
            </TabsTrigger>
            <TabsTrigger value="news" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Newspaper className="w-4 h-4 mr-1 sm:mr-2" />
              Notícia
            </TabsTrigger>
          </TabsList>

          {/* POSTAR VAGA */}
          <TabsContent value="jobs">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Postar Nova Vaga
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmitJob} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título da Vaga *</Label>
                      <Input
                        value={jobForm.title}
                        onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                        placeholder="Ex: Vendedor, Auxiliar..."
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Input
                        value={jobForm.company}
                        onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                        placeholder="Nome da empresa"
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Select value={jobForm.job_function} onValueChange={(v) => setJobForm({...jobForm, job_function: v})}>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Buscar..."
                              value={funcSearch}
                              onChange={(e) => setFuncSearch(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <ScrollArea className="h-[200px]">
                            {JOB_FUNCTIONS.filter(f => f.toLowerCase().includes(funcSearch.toLowerCase())).map(f => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Select value={jobForm.city} onValueChange={(v) => setJobForm({...jobForm, city: v})}>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Buscar..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <ScrollArea className="h-[200px]">
                            {CIDADES_PB.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição da Vaga</Label>
                    <Textarea
                      value={jobForm.description}
                      onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                      placeholder="Descreva os requisitos, benefícios..."
                      className="rounded-xl min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Salário</Label>
                      <Input
                        value={jobForm.salary_range}
                        onChange={(e) => setJobForm({...jobForm, salary_range: e.target.value})}
                        placeholder="Ex: R$ 1.500"
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input
                        value={jobForm.contact_phone}
                        onChange={(e) => setJobForm({...jobForm, contact_phone: e.target.value})}
                        placeholder="(83) 99999-9999"
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={jobForm.contact_email}
                        onChange={(e) => setJobForm({...jobForm, contact_email: e.target.value})}
                        placeholder="email@empresa.com"
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!jobForm.title || submitting}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                    Enviar para Aprovação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VAGA POR IA */}
          <TabsContent value="ai">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Texto da Vaga
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Cole aqui o texto da vaga..."
                    className="min-h-[250px] rounded-xl"
                  />
                  <Button
                    onClick={handleExtractAI}
                    disabled={!aiText.trim() || isExtracting}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl"
                  >
                    {isExtracting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                    Gerar com IA
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Dados Extraídos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {aiExtractedData ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">Título</p>
                        <p className="font-medium">{aiExtractedData.titulo || '-'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">Empresa</p>
                        <p className="font-medium">{aiExtractedData.empresa || '-'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">Cidade</p>
                        <p className="font-medium">{aiExtractedData.cidade || '-'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">Descrição</p>
                        <p className="text-sm">{aiExtractedData.descricao?.substring(0, 200) || '-'}...</p>
                      </div>
                      <Button
                        onClick={handleSubmitAIJob}
                        disabled={submitting}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                        Enviar para Aprovação
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Os dados extraídos aparecerão aqui</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* HOME OFFICE */}
          <TabsContent value="homeoffice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Texto das Vagas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <textarea
                    ref={textareaRef}
                    defaultValue={homeOfficeText}
                    placeholder="Cole aqui o texto com as vagas home office..."
                    className="w-full min-h-[250px] p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Button
                    onClick={handleExtractHomeOffice}
                    disabled={isExtractingHO}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl"
                  >
                    {isExtractingHO ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                    Extrair Vagas
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-teal-600" />
                    {homeOfficeJobs.length > 0 ? `${homeOfficeJobs.length} Vagas Encontradas` : 'Vagas Extraídas'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {homeOfficeJobs.length > 0 ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {homeOfficeJobs.map((job, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{job.titulo}</p>
                                <Badge className="mt-1 bg-green-100 text-green-700 text-xs">Home Office</Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setHomeOfficeJobs(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium">Premium</span>
                          </div>
                          <Switch checked={isPremiumHO} onCheckedChange={setIsPremiumHO} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium">Destaque</span>
                          </div>
                          <Switch checked={isFeaturedHO} onCheckedChange={setIsFeaturedHO} />
                        </div>
                      </div>

                      <Button
                        onClick={handleSubmitHomeOffice}
                        disabled={submitting}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                        Enviar para Aprovação
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>As vagas extraídas aparecerão aqui</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NOTÍCIAS */}
          <TabsContent value="news">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  Postar Notícia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmitNews} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título da Notícia *</Label>
                    <Input
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                      placeholder="Digite o título..."
                      className="rounded-xl h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={newsForm.category} onValueChange={(v) => setNewsForm({...newsForm, category: v})}>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mercado de Trabalho">Mercado de Trabalho</SelectItem>
                          <SelectItem value="Dicas de Emprego">Dicas de Emprego</SelectItem>
                          <SelectItem value="Economia">Economia</SelectItem>
                          <SelectItem value="Cursos">Cursos</SelectItem>
                          <SelectItem value="Eventos">Eventos</SelectItem>
                          <SelectItem value="Geral">Geral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subtítulo</Label>
                      <Input
                        value={newsForm.subtitle}
                        onChange={(e) => setNewsForm({...newsForm, subtitle: e.target.value})}
                        placeholder="Breve descrição..."
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Imagem</Label>
                    <div className="flex gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="h-12 border-2 border-dashed rounded-xl flex items-center justify-center hover:bg-slate-50">
                          {uploadingImage ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                          ) : (
                            <span className="text-slate-500 flex items-center gap-2">
                              <Upload className="w-4 h-4" /> Escolher arquivo
                            </span>
                          )}
                        </div>
                      </label>
                      {newsForm.image_url && (
                        <img src={newsForm.image_url} alt="" className="h-12 w-20 object-cover rounded-xl" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo da Notícia *</Label>
                    <Textarea
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                      placeholder="Escreva o conteúdo completo..."
                      className="rounded-xl min-h-[200px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!newsForm.title || !newsForm.content || submitting}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 rounded-xl text-lg"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                    Enviar para Aprovação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-6 rounded-2xl bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-purple-700 text-center">
              <strong>Atenção:</strong> Todas as publicações passam por aprovação do administrador antes de serem publicadas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}