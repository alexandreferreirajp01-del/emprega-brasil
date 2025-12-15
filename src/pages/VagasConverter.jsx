import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Upload, Sparkles, Download, RefreshCw, Loader2, 
  Image as ImageIcon, CheckCircle, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import html2canvas from 'html2canvas';

export default function VagasConverter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isDono = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser.subscription_type === 'dono';
        const isAdmin = currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        
        if (!isDono && !isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Apenas imagens PNG, JPG ou JPEG são aceitas');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      setError('');
      setStep(2);
    };
    reader.readAsDataURL(file);
  };

  const extractJobInfo = async () => {
    setExtracting(true);
    setError('');

    try {
      // Upload da imagem
      const blob = await fetch(uploadedImage).then(r => r.blob());
      const file = new File([blob], 'vaga.jpg', { type: 'image/jpeg' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extrair informações com IA
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem de uma vaga de emprego e extraia TODAS as informações disponíveis. 
        
Retorne um JSON com os seguintes campos (se a informação não estiver disponível, use null):
- titulo: título/cargo da vaga
- empresa: nome da empresa
- cidade: cidade
- estado: estado (sigla)
- tipo_contrato: tipo de contrato (CLT, PJ, Estágio, etc)
- salario: faixa salarial
- requisitos: array de requisitos (máximo 8 itens mais importantes)
- beneficios: array de benefícios (máximo 6 itens)
- descricao: breve descrição da vaga
- forma_candidatura: como se candidatar (email, WhatsApp, site, etc)
- contato: informação de contato (telefone, email, etc)

IMPORTANTE: Extraia o máximo de informações possível da imagem. Se houver muitos requisitos ou benefícios, priorize os mais importantes.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            empresa: { type: "string" },
            cidade: { type: "string" },
            estado: { type: "string" },
            tipo_contrato: { type: "string" },
            salario: { type: "string" },
            requisitos: { type: "array", items: { type: "string" } },
            beneficios: { type: "array", items: { type: "string" } },
            descricao: { type: "string" },
            forma_candidatura: { type: "string" },
            contato: { type: "string" }
          }
        }
      });

      setJobData(result);
      setStep(3);
    } catch (err) {
      setError('Erro ao extrair informações da vaga. Tente novamente.');
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  const handleJobDataChange = (field, value) => {
    setJobData({ ...jobData, [field]: value });
  };

  const generateImage = async () => {
    setGenerating(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      const imageUrl = canvas.toDataURL('image/png');
      
      // Download automático
      const link = document.createElement('a');
      link.download = `vaga_${jobData.titulo?.toLowerCase().replace(/\s/g, '_') || 'converter'}.png`;
      link.href = imageUrl;
      link.click();

      setStep(4);
    } catch (err) {
      setError('Erro ao gerar imagem. Tente novamente.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setUploadedImage(null);
    setJobData(null);
    setStep(1);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Vagas Converter</h1>
          </div>
          <p className="text-white/80 text-sm">IA extrai e cria post profissional</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Upload */}
        {step === 1 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-[#0A66C2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-[#0A66C2]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Envie a Imagem da Vaga</h2>
              <p className="text-slate-600 mb-6">A IA irá extrair automaticamente todas as informações</p>

              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Clique para fazer upload</p>
                  <p className="text-slate-400 text-sm mt-1">PNG, JPG ou JPEG</p>
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {error && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Processing */}
        {step === 2 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Imagem Carregada</h2>
                <p className="text-slate-600 text-sm">Confira se está correto</p>
              </div>

              <div className="max-w-md mx-auto mb-6">
                <img src={uploadedImage} alt="Preview" className="w-full rounded-xl shadow-lg" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={reset}
                  disabled={extracting}
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Trocar Imagem
                </Button>
                <Button
                  onClick={extractJobInfo}
                  disabled={extracting}
                  className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extraindo Dados...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Processar com IA
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Edit & Generate */}
        {step === 3 && jobData && (
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Editar Informações</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Título da Vaga</label>
                      <Input
                        value={jobData.titulo || ''}
                        onChange={(e) => handleJobDataChange('titulo', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Empresa</label>
                      <Input
                        value={jobData.empresa || ''}
                        onChange={(e) => handleJobDataChange('empresa', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Cidade</label>
                      <Input
                        value={jobData.cidade || ''}
                        onChange={(e) => handleJobDataChange('cidade', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Estado</label>
                      <Input
                        value={jobData.estado || ''}
                        onChange={(e) => handleJobDataChange('estado', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo de Contrato</label>
                      <Input
                        value={jobData.tipo_contrato || ''}
                        onChange={(e) => handleJobDataChange('tipo_contrato', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Salário</label>
                    <Input
                      value={jobData.salario || ''}
                      onChange={(e) => handleJobDataChange('salario', e.target.value)}
                      placeholder="Ex: R$ 2.000,00 - R$ 3.000,00"
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Requisitos (um por linha)</label>
                    <Textarea
                      value={jobData.requisitos?.join('\n') || ''}
                      onChange={(e) => handleJobDataChange('requisitos', e.target.value.split('\n').filter(r => r.trim()))}
                      className="rounded-xl h-32"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Benefícios (um por linha)</label>
                    <Textarea
                      value={jobData.beneficios?.join('\n') || ''}
                      onChange={(e) => handleJobDataChange('beneficios', e.target.value.split('\n').filter(b => b.trim()))}
                      className="rounded-xl h-24"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Como se Candidatar</label>
                    <Input
                      value={jobData.contato || ''}
                      onChange={(e) => handleJobDataChange('contato', e.target.value)}
                      placeholder="Ex: Envie currículo para email@empresa.com"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Preview da Imagem</h2>
                <div className="flex justify-center">
                  <div className="max-w-lg w-full">
                    <JobCanvas ref={canvasRef} jobData={jobData} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={reset}
                disabled={generating}
                className="rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recomeçar
              </Button>
              <Button
                onClick={generateImage}
                disabled={generating}
                className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Imagem...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar e Baixar Imagem
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Imagem Gerada com Sucesso!</h2>
              <p className="text-slate-600 mb-6">O download foi iniciado automaticamente</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={reset}
                  className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Converter Outra Vaga
                </Button>
                <Link to={createPageUrl('Profile')}>
                  <Button variant="outline" className="rounded-xl w-full sm:w-auto">
                    Voltar ao Perfil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Canvas Component
const JobCanvas = React.forwardRef(({ jobData }, ref) => {
  const hasRequisitos = jobData.requisitos && jobData.requisitos.length > 0;
  const hasBeneficios = jobData.beneficios && jobData.beneficios.length > 0;
  const totalItems = (jobData.requisitos?.length || 0) + (jobData.beneficios?.length || 0);

  return (
    <div
      ref={ref}
      className="relative w-full aspect-square bg-gradient-to-br from-[#0A66C2] to-[#004182] rounded-xl overflow-hidden"
      style={{ maxWidth: '600px' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-2xl"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col p-6">
        {/* Header com Logo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm leading-tight">Vagas Abertas</h3>
              <p className="text-white/80 text-xs">Paraíba</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="text-white font-semibold text-xs">@vagasabertaspb</span>
          </div>
        </div>

        {/* Badge "TEMOS VAGAS" */}
        <div className="inline-flex bg-yellow-400 text-slate-900 font-black text-lg px-4 py-2 rounded-lg mb-4 shadow-lg self-start">
          TEMOS VAGAS!
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-xl p-4 shadow-xl overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Título e Empresa */}
            <div className="mb-3">
              <h1 className="text-xl font-black text-slate-900 mb-2 leading-tight">
                {jobData.titulo || 'Título da Vaga'}
              </h1>
              {jobData.empresa && (
                <div className="flex items-center gap-1 text-sm text-slate-700">
                  <span className="font-bold">📍</span>
                  <span className="font-semibold">{jobData.empresa}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {jobData.cidade && (
                  <span className="bg-[#0A66C2]/10 text-[#0A66C2] px-2 py-1 rounded-full font-semibold text-xs">
                    {jobData.cidade}{jobData.estado && ` - ${jobData.estado}`}
                  </span>
                )}
                {jobData.tipo_contrato && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold text-xs">
                    {jobData.tipo_contrato}
                  </span>
                )}
                {jobData.salario && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold text-xs">
                    {jobData.salario}
                  </span>
                )}
              </div>
            </div>

            {/* Requisitos e Benefícios */}
            <div className="grid grid-cols-2 gap-3 flex-1 text-xs">
              {hasRequisitos && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Requisitos:</h3>
                  <ul className="space-y-1">
                    {jobData.requisitos.slice(0, 6).map((req, i) => (
                      <li key={i} className="flex items-start gap-1 text-slate-700">
                        <span className="text-[#0A66C2] font-bold flex-shrink-0">✓</span>
                        <span className="leading-tight">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasBeneficios && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Benefícios:</h3>
                  <ul className="space-y-1">
                    {jobData.beneficios.slice(0, 4).map((ben, i) => (
                      <li key={i} className="flex items-start gap-1 text-slate-700">
                        <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                        <span className="leading-tight">{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Candidatura */}
            {jobData.contato && (
              <div className="mt-3 bg-[#0A66C2] text-white px-3 py-2 rounded-lg">
                <p className="text-xs font-semibold text-center">
                  📩 {jobData.contato}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

JobCanvas.displayName = 'JobCanvas';