import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Sparkles, Loader2, Download, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function ConversorPadraoVagas() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('intro'); // intro, upload, processing, preview
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [error, setError] = useState(null);

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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setStep('upload');
  };

  const handleProcess = async () => {
    if (!selectedImage) return;

    setStep('processing');
    setError(null);

    try {
      // 1. Upload da imagem
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedImage });

      // 2. Extrair dados com IA (leitura fiel, sem inventar)
      const extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um extrator de dados de vagas de emprego. Analise esta imagem e extraia TODAS as informações presentes de forma FIEL e COMPLETA, sem remover, resumir ou inventar nada.

Extraia os seguintes campos (se existirem na imagem):
- Título da vaga
- Nome da empresa
- Localidade (cidade/estado)
- Descrição completa da vaga
- Requisitos (todos)
- Benefícios (todos)
- Salário (se informado)
- Horário (se informado)
- Tipo de contrato (CLT, PJ, etc)
- Informações adicionais
- Forma de candidatura (whatsapp, email, link, etc)

IMPORTANTE: Copie EXATAMENTE como está escrito. Não resuma. Não altere. Não invente. Se algo não estiver na imagem, deixe o campo vazio.`,
        add_context_from_internet: false,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            empresa: { type: "string" },
            localidade: { type: "string" },
            descricao: { type: "string" },
            requisitos: { type: "string" },
            beneficios: { type: "string" },
            salario: { type: "string" },
            horario: { type: "string" },
            tipo_contrato: { type: "string" },
            informacoes_adicionais: { type: "string" },
            forma_candidatura: { type: "string" }
          }
        }
      });

      setExtractedData(extractionResult);

      // 3. Gerar imagem padronizada com layout FIXO
      const promptImagemPadrao = `Crie uma imagem QUADRADA (1080x1080px) para vaga de emprego com layout PROFISSIONAL e MODERNO.

LAYOUT FIXO E OBRIGATÓRIO:

═══════════════════════════════════════
CABEÇALHO (fundo azul #0A66C2, 15% superior):
- Logo "Vagas Abertas Paraíba" centralizado (pequeno, topo)
- Nome "VAGAS ABERTAS PARAÍBA" (branco, bold, centralizado)
- Ícone Instagram + "@vagasabertaspb" (branco, pequeno, abaixo do nome)
═══════════════════════════════════════

CORPO PRINCIPAL (fundo branco, 85% restante):

📋 TÍTULO DA VAGA (fonte grande, negrito, azul #0A66C2):
${extractedData.titulo || 'Vaga Disponível'}

${extractedData.empresa ? `🏢 EMPRESA: ${extractedData.empresa}` : ''}

${extractedData.localidade ? `📍 LOCALIDADE: ${extractedData.localidade}` : ''}

${extractedData.descricao ? `📝 DESCRIÇÃO:\n${extractedData.descricao}` : ''}

${extractedData.requisitos ? `✅ REQUISITOS:\n${extractedData.requisitos}` : ''}

${extractedData.beneficios ? `💰 BENEFÍCIOS:\n${extractedData.beneficios}` : ''}

${extractedData.salario ? `💵 SALÁRIO: ${extractedData.salario}` : ''}

${extractedData.horario ? `⏰ HORÁRIO: ${extractedData.horario}` : ''}

${extractedData.tipo_contrato ? `📄 CONTRATO: ${extractedData.tipo_contrato}` : ''}

${extractedData.informacoes_adicionais ? `ℹ️ INFO ADICIONAL:\n${extractedData.informacoes_adicionais}` : ''}

${extractedData.forma_candidatura ? `📲 CANDIDATURA:\n${extractedData.forma_candidatura}` : ''}

═══════════════════════════════════════

REGRAS ESTRITAS:
- Layout QUADRADO 1080x1080px
- Cabeçalho azul #0A66C2 sempre igual
- Corpo branco com margens
- Texto preto/cinza escuro
- Emojis para cada seção
- Fonte legível (ajustar tamanho se muito texto)
- Espacamento adequado
- NUNCA cortar informações
- NUNCA mudar cores padrão
- NUNCA alterar posição do cabeçalho`;

      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: promptImagemPadrao
      });

      setGeneratedImageUrl(url);
      setStep('preview');

    } catch (err) {
      console.error('Erro no processamento:', err);
      setError(err.message || 'Erro ao processar a vaga. Tente novamente.');
      setStep('upload');
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `vaga-padronizada-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setStep('intro');
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedData(null);
    setGeneratedImageUrl(null);
    setError(null);
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
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Conversor Padrão de Vagas</h1>
              <p className="text-white/80 text-sm">Padronize suas vagas com IA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Intro */}
        {step === 'intro' && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-[#0A66C2]" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Como Funciona</h2>
                <p className="text-slate-600 text-sm mb-6">
                  Transforme qualquer imagem de vaga em um post padronizado e profissional
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0A66C2] font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Envie a imagem</p>
                    <p className="text-slate-600 text-sm">Print, arte, banner ou foto da vaga</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0A66C2] font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">IA extrai os dados</p>
                    <p className="text-slate-600 text-sm">Leitura fiel de todas as informações</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0A66C2] font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Imagem padronizada</p>
                    <p className="text-slate-600 text-sm">Layout fixo com identidade visual única</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0A66C2] font-bold text-sm">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Baixe e publique</p>
                    <p className="text-slate-600 text-sm">Formato 1:1 otimizado para redes sociais</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                <p className="text-blue-800 text-sm">
                  <strong>✨ Garantia de Padronização:</strong><br/>
                  Todas as vagas terão o mesmo layout profissional, fortalecendo a identidade da marca Vagas Abertas Paraíba.
                </p>
              </div>

              <Button 
                onClick={() => setStep('upload')}
                className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] rounded-xl text-base font-semibold"
              >
                <Upload className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upload */}
        {step === 'upload' && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-800 text-center">Envie a Imagem da Vaga</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium text-sm">Erro no Processamento</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <label className="block">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#0A66C2] hover:bg-blue-50 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-[#0A66C2]" />
                      </div>
                      <p className="text-slate-700 font-medium">Clique para selecionar</p>
                      <p className="text-slate-500 text-sm">PNG, JPG ou JPEG</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="space-y-3">
                  <Button 
                    onClick={handleProcess}
                    className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] rounded-xl text-base font-semibold"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Processar com IA
                  </Button>

                  <Button 
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base"
                  >
                    Escolher Outra Imagem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-[#0A66C2] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Processando...</h2>
              <div className="space-y-2 max-w-md mx-auto">
                <p className="text-slate-600 text-sm">📸 Extraindo informações da imagem</p>
                <p className="text-slate-600 text-sm">🤖 Processando com IA</p>
                <p className="text-slate-600 text-sm">🎨 Gerando layout padronizado</p>
              </div>
              <p className="text-slate-500 text-xs">Isso pode levar alguns segundos...</p>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {step === 'preview' && generatedImageUrl && (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-slate-800">Imagem Pronta!</h2>
              </div>

              <div className="bg-slate-100 rounded-xl p-4">
                <img 
                  src={generatedImageUrl} 
                  alt="Vaga Padronizada" 
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleDownload}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl text-base font-semibold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Baixar Imagem
                </Button>

                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12 rounded-xl text-base"
                >
                  Converter Outra Vaga
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm text-center">
                  ✅ Imagem padronizada e pronta para publicação
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}