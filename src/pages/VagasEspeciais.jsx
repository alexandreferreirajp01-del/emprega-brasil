import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, Wand2, Loader2, Check, ArrowLeft, Copy, 
  Briefcase, X, Crown, Star, Camera, FileText, Image as ImageIcon,
  MapPin, Building2, Search, Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

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
  "Água Branca", "Aguiar", "Alagoa Grande", "Alagoa Nova", "Alagoinha", "Alcantil",
  "Algodão de Jandaíra", "Alhandra", "Amparo", "Aparecida", "Araçagi", "Arara",
  "Araruna", "Areia", "Areia de Baraúnas", "Areial", "Aroeiras", "Assunção",
  "Baía da Traição", "Bananeiras", "Baraúna", "Barra de Santa Rosa", "Barra de Santana",
  "Barra de São Miguel", "Belém", "Belém do Brejo do Cruz", "Bernardino Batista",
  "Boa Ventura", "Boa Vista", "Bom Jesus", "Bom Sucesso", "Bonito de Santa Fé",
  "Boqueirão", "Borborema", "Brejo do Cruz", "Brejo dos Santos", "Caaporã",
  "Cabaceiras", "Cachoeira dos Índios", "Cacimba de Areia", "Cacimba de Dentro",
  "Cacimbas", "Caiçara", "Caldas Brandão", "Camalaú", "Capim", "Caraúbas",
  "Guarabira", "Patos", "Sousa", "Cajazeiras", "Pombal"
];

export default function VagasEspeciais() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('textos');
  
  // Estado para textos
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  
  // Estado para imagens
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [extractedFromImages, setExtractedFromImages] = useState([]);
  
  // Estados comuns
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishingIndex, setPublishingIndex] = useState(null);
  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Filtros de busca
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        setIsAuthorized(isAdmin);
      } catch (e) {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, []);

  // Extrair vagas do texto - LIMITE: 3000 caracteres para evitar timeout
  const extractFromText = async () => {
    if (!rawText.trim()) return;
    
    // Limite de caracteres para evitar timeout (máx recomendado: 3000)
    const MAX_CHARS = 3000;
    const textToProcess = rawText.substring(0, MAX_CHARS);
    
    if (rawText.length > MAX_CHARS) {
      setErrorMessage(`Texto muito longo! Máximo: ${MAX_CHARS} caracteres. Seu texto tem ${rawText.length}. Reduza o texto ou divida em partes.`);
      return;
    }
    
    setIsExtracting(true);
    setErrorMessage('');
    setProcessingStatus('Analisando texto...');
    
    // Timeout de 60 segundos
    const timeoutId = setTimeout(() => {
      setIsExtracting(false);
      setProcessingStatus('');
      setErrorMessage('Tempo esgotado. Reduza o tamanho do texto e tente novamente.');
    }, 60000);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extraia as vagas de emprego do texto abaixo. Para cada vaga, extraia: title, company, city, job_type, job_function, salary_range, description, contact_phone, contact_email.

TEXTO:
${textToProcess}

Retorne um JSON com array "vagas".`,
        response_json_schema: {
          type: "object",
          properties: {
            vagas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  city: { type: "string" },
                  job_type: { type: "string" },
                  job_function: { type: "string" },
                  salary_range: { type: "string" },
                  description: { type: "string" },
                  contact_phone: { type: "string" },
                  contact_email: { type: "string" }
                }
              }
            }
          }
        }
      });

      clearTimeout(timeoutId);
      setProcessingStatus('Processando resultados...');

      if (result?.vagas && Array.isArray(result.vagas) && result.vagas.length > 0) {
        const jobsWithFlags = result.vagas.map(job => ({
          title: job.title || 'Vaga sem título',
          company: job.company || '',
          city: job.city || '',
          job_type: job.job_type || 'CLT',
          job_function: job.job_function || '',
          salary_range: job.salary_range || '',
          description: job.description || '',
          contact_phone: job.contact_phone || '',
          contact_email: job.contact_email || '',
          is_premium: false,
          is_featured: false
        }));
        setExtractedJobs(jobsWithFlags);
        setProcessingStatus(`${jobsWithFlags.length} vaga(s) extraída(s)!`);
      } else {
        setErrorMessage('Nenhuma vaga encontrada. Verifique se o texto contém informações de vagas.');
      }

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Erro ao extrair dados:', error);
      setErrorMessage('Erro ao processar. Tente com um texto menor.');
    } finally {
      setIsExtracting(false);
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  // Upload e processamento de imagens - LIMITE: 3 imagens por vez para evitar timeout
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Limite de imagens para evitar timeout (máx recomendado: 3)
    const MAX_IMAGES = 3;
    if (files.length > MAX_IMAGES) {
      setErrorMessage(`Máximo ${MAX_IMAGES} imagens por vez. Você selecionou ${files.length}. Selecione menos imagens.`);
      if (e.target) e.target.value = '';
      return;
    }
    
    setIsProcessingImages(true);
    setErrorMessage('');
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(`Enviando imagem ${i + 1} de ${files.length}...`);
      
      // Timeout individual de 45 segundos por imagem
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setProcessingStatus(`Imagem ${i + 1} demorou muito, pulando...`);
      }, 45000);
      
      try {
        // Upload da imagem
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        if (!uploadResult?.file_url) {
          clearTimeout(timeoutId);
          continue;
        }

        setProcessingStatus(`Lendo imagem ${i + 1}...`);

        // Extrair dados com IA - prompt simplificado para ser mais rápido
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Extraia da imagem: title (cargo), company, city, job_type, salary_range, description, contact_phone, contact_email. Retorne JSON.`,
          file_urls: [uploadResult.file_url],
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              city: { type: "string" },
              job_type: { type: "string" },
              job_function: { type: "string" },
              salary_range: { type: "string" },
              description: { type: "string" },
              contact_phone: { type: "string" },
              contact_email: { type: "string" }
            }
          }
        });

        clearTimeout(timeoutId);

        if (result) {
          const newJob = {
            title: result.title || 'Vaga sem título',
            company: result.company || '',
            city: result.city || '',
            job_type: result.job_type || 'CLT',
            job_function: result.job_function || '',
            salary_range: result.salary_range || '',
            description: result.description || '',
            contact_phone: result.contact_phone || '',
            contact_email: result.contact_email || '',
            image_url: uploadResult.file_url,
            is_premium: false,
            is_featured: false
          };
          
          setExtractedFromImages(prev => [...prev, newJob]);
          successCount++;
          setProcessingStatus(`${successCount} vaga(s) extraída(s)!`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Erro ao processar imagem:', error);
      }
    }

    if (successCount === 0 && files.length > 0) {
      setErrorMessage('Não foi possível extrair dados. Tente com imagens mais claras.');
    }
    
    setIsProcessingImages(false);
    setTimeout(() => setProcessingStatus(''), 3000);
    if (e.target) e.target.value = '';
  };

  // Atualizar vaga individual
  const updateJob = (index, field, value, isFromImages = false) => {
    if (isFromImages) {
      setExtractedFromImages(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    } else {
      setExtractedJobs(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    }
  };

  // Remover vaga
  const removeJob = (index, isFromImages = false) => {
    if (isFromImages) {
      setExtractedFromImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setExtractedJobs(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Publicar vaga individual
  const publishSingleJob = async (job, index, isFromImages = false) => {
    setPublishingIndex(index);
    try {
      let description = job.description || '';
      if (job.contact_phone || job.contact_email) {
        description += '\n\n--- CONTATO ---';
        if (job.contact_phone) description += `\nWhatsApp: ${job.contact_phone}`;
        if (job.contact_email) description += `\nEmail: ${job.contact_email}`;
      }

      // Montar link de candidatura
      let applicationLink = '';
      if (job.contact_phone) {
        let phone = job.contact_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = phone.substring(1);
        if (!phone.startsWith('55')) phone = '55' + phone;
        applicationLink = `https://wa.me/${phone}`;
      } else if (job.contact_email) {
        applicationLink = `mailto:${job.contact_email}`;
      }

      await base44.entities.Job.create({
        title: job.title,
        company: job.company || '',
        city: job.city || '',
        job_type: job.job_type || 'CLT',
        job_function: job.job_function || '',
        salary_range: job.salary_range || '',
        description: description,
        image_url: job.image_url || '',
        application_link: applicationLink,
        is_premium: job.is_premium || false,
        is_featured: job.is_featured || false
      });
      
      removeJob(index, isFromImages);
    } catch (error) {
      console.error('Erro ao publicar:', error);
    }
    setPublishingIndex(null);
  };

  // Publicar todas as vagas
  const publishAllJobs = async (isFromImages = false) => {
    setIsPublishingAll(true);
    const jobs = isFromImages ? extractedFromImages : extractedJobs;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        let description = job.description || '';
        if (job.contact_phone || job.contact_email) {
          description += '\n\n--- CONTATO ---';
          if (job.contact_phone) description += `\nWhatsApp: ${job.contact_phone}`;
          if (job.contact_email) description += `\nEmail: ${job.contact_email}`;
        }

        let applicationLink = '';
        if (job.contact_phone) {
          let phone = job.contact_phone.replace(/\D/g, '');
          if (phone.startsWith('0')) phone = phone.substring(1);
          if (!phone.startsWith('55')) phone = '55' + phone;
          applicationLink = `https://wa.me/${phone}`;
        } else if (job.contact_email) {
          applicationLink = `mailto:${job.contact_email}`;
        }

        await base44.entities.Job.create({
          title: job.title,
          company: job.company || '',
          city: job.city || '',
          job_type: job.job_type || 'CLT',
          job_function: job.job_function || '',
          salary_range: job.salary_range || '',
          description: description,
          image_url: job.image_url || '',
          application_link: applicationLink,
          is_premium: job.is_premium || false,
          is_featured: job.is_featured || false
        });
      } catch (error) {
        console.error('Erro ao publicar vaga:', error);
      }
    }

    if (isFromImages) {
      setExtractedFromImages([]);
    } else {
      setExtractedJobs([]);
      setRawText('');
    }
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setIsPublishingAll(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500">Apenas administradores podem acessar esta função.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentJobs = activeTab === 'textos' ? extractedJobs : extractedFromImages;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Admin')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Especiais</h1>
              <p className="text-white/70">Extraia e publique múltiplas vagas de uma vez</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {/* Mensagens de status */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Vagas publicadas com sucesso!</span>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-xl flex items-center gap-3">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{errorMessage}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setErrorMessage('')}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {processingStatus && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">{processingStatus}</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-xl bg-white shadow">
            <TabsTrigger value="textos" className="rounded-lg h-12 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Textos
            </TabsTrigger>
            <TabsTrigger value="imagens" className="rounded-lg h-12 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <ImageIcon className="w-4 h-4 mr-2" />
              Imagens
            </TabsTrigger>
          </TabsList>

          {/* Tab Textos */}
          <TabsContent value="textos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input de texto */}
              <Card className="shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="w-5 h-5 text-indigo-600" />
                    Texto com Vagas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={`Cole aqui o texto com as vagas...

Exemplo:
VAGA: Vendedor
Empresa: Loja X
Local: João Pessoa
Salário: R$ 1.500
WhatsApp: 83999999999

---

VAGA: Auxiliar Administrativo
Empresa: Empresa Y
...`}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className={`min-h-[300px] text-base ${rawText.length > 3000 ? 'border-red-500 bg-red-50' : ''}`}
                  />
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${rawText.length > 3000 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {rawText.length}/3000 {rawText.length > 3000 && '⚠️ EXCEDIDO!'}
                    </span>
                    {rawText && (
                      <Button variant="ghost" size="sm" onClick={() => setRawText('')}>
                        Limpar
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={extractFromText}
                    disabled={!rawText.trim() || isExtracting}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl"
                  >
                    {isExtracting ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Extraindo vagas...</>
                    ) : (
                      <><Wand2 className="w-5 h-5 mr-2" />Extrair e Separar Vagas</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Vagas extraídas do texto */}
              <JobsListPanel 
                jobs={extractedJobs}
                onUpdate={(idx, field, val) => updateJob(idx, field, val, false)}
                onRemove={(idx) => removeJob(idx, false)}
                onPublishSingle={(job, idx) => publishSingleJob(job, idx, false)}
                onPublishAll={() => publishAllJobs(false)}
                publishingIndex={publishingIndex}
                isPublishingAll={isPublishingAll}
                citySearch={citySearch}
                setCitySearch={setCitySearch}
                funcSearch={funcSearch}
                setFuncSearch={setFuncSearch}
              />
            </div>
          </TabsContent>

          {/* Tab Imagens */}
          <TabsContent value="imagens">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload de imagens */}
              <Card className="shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-600" />
                    Upload de Imagens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isProcessingImages ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isProcessingImages}
                    />
                    <label htmlFor="image-upload" className={`${isProcessingImages ? 'cursor-wait' : 'cursor-pointer'}`}>
                      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {isProcessingImages ? (
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        ) : (
                          <Plus className="w-8 h-8 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-slate-600 font-medium mb-1">
                        {isProcessingImages ? 'Processando imagens...' : 'Clique para selecionar imagens'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {isProcessingImages ? 'Aguarde o processamento terminar' : 'Selecione várias imagens de uma vez'}
                      </p>
                    </label>
                  </div>
                  
                  {/* Limites e Dicas */}
                  <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700 space-y-1">
                    <p><strong>⚠️ Limite:</strong> Máximo 3 imagens por vez</p>
                    <p><strong>💡 Dica:</strong> Imagens claras processam mais rápido</p>
                    <p><strong>⏱️ Tempo:</strong> ~15-30 segundos por imagem</p>
                  </div>

                  {extractedFromImages.length > 0 && (
                    <div className="p-4 bg-indigo-50 rounded-xl">
                      <p className="text-indigo-700 font-medium text-center">
                        {extractedFromImages.length} vaga(s) extraída(s) das imagens
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vagas extraídas das imagens */}
              <JobsListPanel 
                jobs={extractedFromImages}
                onUpdate={(idx, field, val) => updateJob(idx, field, val, true)}
                onRemove={(idx) => removeJob(idx, true)}
                onPublishSingle={(job, idx) => publishSingleJob(job, idx, true)}
                onPublishAll={() => publishAllJobs(true)}
                publishingIndex={publishingIndex}
                isPublishingAll={isPublishingAll}
                citySearch={citySearch}
                setCitySearch={setCitySearch}
                funcSearch={funcSearch}
                setFuncSearch={setFuncSearch}
                showImages={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente para lista de vagas extraídas
function JobsListPanel({ 
  jobs, 
  onUpdate, 
  onRemove, 
  onPublishSingle, 
  onPublishAll, 
  publishingIndex, 
  isPublishingAll,
  citySearch,
  setCitySearch,
  funcSearch,
  setFuncSearch,
  showImages = false
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (jobs.length === 0) {
    return (
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            Vagas Extraídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>As vagas extraídas aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            {jobs.length} Vaga(s) Extraída(s)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-[500px] pr-2">
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div 
                key={index} 
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative"
              >
                {/* Botão de remover */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>

                <div className="pr-8">
                  {/* Título e empresa */}
                  <div className="flex items-start gap-3 mb-3">
                    {showImages && job.image_url && (
                      <img 
                        src={job.image_url} 
                        alt={job.title} 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        value={job.title || ''}
                        onChange={(e) => onUpdate(index, 'title', e.target.value)}
                        placeholder="Título da vaga"
                        className="font-semibold mb-2"
                      />
                      <Input
                        value={job.company || ''}
                        onChange={(e) => onUpdate(index, 'company', e.target.value)}
                        placeholder="Empresa"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Badges e info rápida */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.city && (
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {job.city}
                      </Badge>
                    )}
                    {job.job_type && (
                      <Badge variant="outline" className="text-xs">
                        {job.job_type}
                      </Badge>
                    )}
                    {job.salary_range && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        {job.salary_range}
                      </Badge>
                    )}
                  </div>

                  {/* Toggle para expandir edição */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="text-indigo-600 text-xs mb-2"
                  >
                    {expandedIndex === index ? 'Menos detalhes' : 'Editar detalhes'}
                  </Button>

                  {/* Campos expandidos */}
                  {expandedIndex === index && (
                    <div className="space-y-3 mt-3 pt-3 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <Select 
                          value={job.city || ''} 
                          onValueChange={(v) => onUpdate(index, 'city', v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Cidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {CIDADES_PB.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select 
                          value={job.job_type || ''} 
                          onValueChange={(v) => onUpdate(index, 'job_type', v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLT">CLT</SelectItem>
                            <SelectItem value="Home Office">Home Office</SelectItem>
                            <SelectItem value="Estágio">Estágio</SelectItem>
                            <SelectItem value="Temporário">Temporário</SelectItem>
                            <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
                            <SelectItem value="Freelancer">Freelancer</SelectItem>
                            <SelectItem value="PJ">PJ</SelectItem>
                            <SelectItem value="PCD">PCD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Select 
                        value={job.job_function || ''} 
                        onValueChange={(v) => onUpdate(index, 'job_function', v)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Função" />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_FUNCTIONS.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={job.salary_range || ''}
                        onChange={(e) => onUpdate(index, 'salary_range', e.target.value)}
                        placeholder="Salário"
                        className="text-sm"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={job.contact_phone || ''}
                          onChange={(e) => onUpdate(index, 'contact_phone', e.target.value)}
                          placeholder="WhatsApp"
                          className="text-sm"
                        />
                        <Input
                          value={job.contact_email || ''}
                          onChange={(e) => onUpdate(index, 'contact_email', e.target.value)}
                          placeholder="Email"
                          className="text-sm"
                        />
                      </div>

                      <Textarea
                        value={job.description || ''}
                        onChange={(e) => onUpdate(index, 'description', e.target.value)}
                        placeholder="Descrição da vaga"
                        className="min-h-[100px] text-sm"
                      />
                    </div>
                  )}

                  {/* Opções Premium e Destaque */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={job.is_premium || false}
                        onCheckedChange={(v) => onUpdate(index, 'is_premium', v)}
                        className="scale-75"
                      />
                      <span className="text-xs text-purple-600 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={job.is_featured || false}
                        onCheckedChange={(v) => onUpdate(index, 'is_featured', v)}
                        className="scale-75"
                      />
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Destaque
                      </span>
                    </div>
                  </div>

                  {/* Botão publicar individual */}
                  <Button
                    size="sm"
                    onClick={() => onPublishSingle(job, index)}
                    disabled={publishingIndex === index || !job.title}
                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {publishingIndex === index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Publicar Esta Vaga
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Botão publicar todas */}
        <div className="pt-4 border-t">
          <Button
            onClick={onPublishAll}
            disabled={isPublishingAll || jobs.length === 0}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl"
          >
            {isPublishingAll ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Publicando...</>
            ) : (
              <><Check className="w-5 h-5 mr-2" />Publicar Todas ({jobs.length} vagas)</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}