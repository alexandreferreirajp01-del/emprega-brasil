import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Upload, Sparkles, Download, RefreshCw, Loader2, 
  Image as ImageIcon, CheckCircle, AlertCircle, Edit
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
  const [jobData, setJobData] = useState({
    titulo: '',
    empresa: '',
    cidade: '',
    estado: '',
    tipo_contrato: '',
    salario: '',
    requisitos: [],
    beneficios: [],
    contato: ''
  });
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
      const blob = await fetch(uploadedImage).then(r => r.blob());
      const file = new File([blob], 'vaga.jpg', { type: 'image/jpeg' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem de vaga de emprego e extraia TODAS as informações visíveis.

Retorne um JSON com:
- titulo: cargo/função
- empresa: nome da empresa
- cidade: cidade
- estado: estado (apenas sigla: PB, SP, RJ, etc)
- tipo_contrato: CLT, PJ, Estágio, etc
- salario: valor ou faixa salarial
- requisitos: lista com até 6 requisitos principais
- beneficios: lista com até 4 benefícios principais
- contato: email, WhatsApp ou telefone para candidatura

Se alguma informação não existir, use string vazia ou array vazio.`,
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
            contato: { type: "string" }
          }
        }
      });

      setJobData({
        titulo: result.titulo || '',
        empresa: result.empresa || '',
        cidade: result.cidade || '',
        estado: result.estado || '',
        tipo_contrato: result.tipo_contrato || '',
        salario: result.salario || '',
        requisitos: result.requisitos || [],
        beneficios: result.beneficios || [],
        contato: result.contato || ''
      });
      
      setStep(3);
    } catch (err) {
      setError('Erro ao processar imagem. Tente novamente.');
      console.error('Erro:', err);
    } finally {
      setExtracting(false);
    }
  };

  const downloadImage = async () => {
    try {
      setError('');
      const element = canvasRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `vaga_${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setStep(4);
      }, 'image/png');
    } catch (err) {
      setError('Erro ao gerar imagem. Tente novamente.');
      console.error('Erro download:', err);
    }
  };

  const reset = () => {
    setUploadedImage(null);
    setJobData({
      titulo: '',
      empresa: '',
      cidade: '',
      estado: '',
      tipo_contrato: '',
      salario: '',
      requisitos: [],
      beneficios: [],
      contato: ''
    });
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
          <p className="text-white/80 text-sm">Transforme vagas em posts profissionais</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Upload */}
        {step === 1 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-8 text-center">
              <ImageIcon className="w-16 h-16 text-[#0A66C2] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Envie a Imagem</h2>
              <p className="text-slate-600 mb-6">A IA extrairá as informações automaticamente</p>

              <label htmlFor="upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Clique para selecionar</p>
                  <p className="text-slate-400 text-sm mt-1">PNG, JPG ou JPEG</p>
                </div>
                <Input
                  id="upload"
                  type="file"
                  accept="image/*"
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

        {/* Step 2: Confirmar Upload */}
        {step === 2 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Imagem Carregada</h2>
              
              <div className="max-w-sm mx-auto mb-6">
                <img src={uploadedImage} alt="Vaga" className="w-full rounded-xl shadow-md" />
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={reset}
                  disabled={extracting}
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Trocar
                </Button>
                <Button
                  onClick={extractJobInfo}
                  disabled={extracting}
                  className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extraindo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Processar
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

        {/* Step 3: Editar e Gerar */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Edit className="w-5 h-5 text-[#0A66C2]" />
                  <h2 className="text-xl font-bold text-slate-800">Editar Informações</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Título</label>
                      <Input
                        value={jobData.titulo}
                        onChange={(e) => setJobData({...jobData, titulo: e.target.value})}
                        placeholder="Ex: Vendedor"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Empresa</label>
                      <Input
                        value={jobData.empresa}
                        onChange={(e) => setJobData({...jobData, empresa: e.target.value})}
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cidade</label>
                      <Input
                        value={jobData.cidade}
                        onChange={(e) => setJobData({...jobData, cidade: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Estado</label>
                      <Input
                        value={jobData.estado}
                        onChange={(e) => setJobData({...jobData, estado: e.target.value})}
                        placeholder="PB"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Contrato</label>
                      <Input
                        value={jobData.tipo_contrato}
                        onChange={(e) => setJobData({...jobData, tipo_contrato: e.target.value})}
                        placeholder="CLT"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Salário</label>
                    <Input
                      value={jobData.salario}
                      onChange={(e) => setJobData({...jobData, salario: e.target.value})}
                      placeholder="R$ 2.000,00"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Requisitos (um por linha)</label>
                    <Textarea
                      value={jobData.requisitos.join('\n')}
                      onChange={(e) => setJobData({...jobData, requisitos: e.target.value.split('\n').filter(r => r.trim())})}
                      className="h-24"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Benefícios (um por linha)</label>
                    <Textarea
                      value={jobData.beneficios.join('\n')}
                      onChange={(e) => setJobData({...jobData, beneficios: e.target.value.split('\n').filter(b => b.trim())})}
                      className="h-20"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Contato</label>
                    <Input
                      value={jobData.contato}
                      onChange={(e) => setJobData({...jobData, contato: e.target.value})}
                      placeholder="WhatsApp: (83) 9999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="rounded-2xl shadow-lg overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Preview</h2>
                <div className="flex justify-center">
                  <PostCanvas ref={canvasRef} data={jobData} />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={reset} className="rounded-xl">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recomeçar
              </Button>
              <Button onClick={downloadImage} className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Baixar Imagem
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Sucesso */}
        {step === 4 && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Imagem Gerada!</h2>
              <p className="text-slate-600 mb-6">Download iniciado automaticamente</p>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={reset} className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Converter Outra
                </Button>
                <Link to={createPageUrl('Profile')}>
                  <Button variant="outline" className="rounded-xl">
                    Voltar
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

const PostCanvas = React.forwardRef(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="w-full max-w-lg aspect-square bg-gradient-to-br from-[#0A66C2] to-[#004182] rounded-xl overflow-hidden relative"
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Vagas Abertas</p>
              <p className="text-white/80 text-xs">Paraíba</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
            <span className="text-white text-xs font-semibold">@vagasabertaspb</span>
          </div>
        </div>

        {/* Badge */}
        <div className="bg-yellow-400 text-slate-900 font-black text-lg px-4 py-2 rounded-lg mb-4 inline-block">
          TEMOS VAGAS!
        </div>

        {/* Conteúdo */}
        <div className="flex-1 bg-white rounded-xl p-4 overflow-hidden">
          <h1 className="text-xl font-black text-slate-900 mb-1 leading-tight">
            {data.titulo || 'Título da Vaga'}
          </h1>
          
          {data.empresa && (
            <p className="text-sm font-semibold text-slate-700 mb-2">
              📍 {data.empresa}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.cidade && (
              <span className="bg-[#0A66C2]/10 text-[#0A66C2] px-2 py-1 rounded-full text-xs font-semibold">
                {data.cidade}{data.estado && ` - ${data.estado}`}
              </span>
            )}
            {data.tipo_contrato && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                {data.tipo_contrato}
              </span>
            )}
            {data.salario && (
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">
                {data.salario}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {data.requisitos.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 mb-1.5">Requisitos:</h3>
                <ul className="space-y-0.5">
                  {data.requisitos.slice(0, 6).map((req, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-[#0A66C2] font-bold">✓</span>
                      <span className="text-slate-700 leading-tight">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.beneficios.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 mb-1.5">Benefícios:</h3>
                <ul className="space-y-0.5">
                  {data.beneficios.slice(0, 4).map((ben, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-600 font-bold">✓</span>
                      <span className="text-slate-700 leading-tight">{ben}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {data.contato && (
            <div className="mt-3 bg-[#0A66C2] text-white px-3 py-2 rounded-lg">
              <p className="text-xs font-semibold text-center">
                📩 {data.contato}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PostCanvas.displayName = 'PostCanvas';