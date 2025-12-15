import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Loader2, Download, Sparkles, Zap, RefreshCw, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import html2canvas from 'html2canvas';

const TEMPLATES = [
  { id: 'blue-gradient', name: 'Azul Profissional', primary: '#0A66C2', secondary: '#004182', accent: '#FFFFFF' },
  { id: 'yellow-energy', name: 'Amarelo Energia', primary: '#FDB913', secondary: '#FF8C00', accent: '#1D2226' },
  { id: 'purple-modern', name: 'Roxo Moderno', primary: '#8B5CF6', secondary: '#6D28D9', accent: '#FFFFFF' },
  { id: 'green-fresh', name: 'Verde Fresco', primary: '#10B981', secondary: '#047857', accent: '#FFFFFF' },
  { id: 'red-bold', name: 'Vermelho Forte', primary: '#DC2626', secondary: '#991B1B', accent: '#FFFFFF' },
  { id: 'teal-calm', name: 'Turquesa Calmo', primary: '#14B8A6', secondary: '#0D9488', accent: '#FFFFFF' },
];

export default function VagasConverter() {
  const [step, setStep] = useState('upload'); // upload, extracting, editing, generating, preview
  const [uploadedImage, setUploadedImage] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const canvasRef = useRef(null);

  // Upload da imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Processar extração (imagem e/ou texto)
  const handleExtract = () => {
    if (!uploadedImage && !pastedText.trim()) {
      alert('Envie uma imagem ou cole o texto da vaga');
      return;
    }
    setStep('extracting');
    extractJobData();
  };

  // Extrair dados com IA
  const extractJobData = async () => {
    setLoading(true);
    
    try {
      let file_url = null;
      
      // Upload da imagem se houver
      if (uploadedImage) {
        try {
          const blob = await fetch(uploadedImage).then(r => r.blob());
          const file = new File([blob], 'job-image.jpg', { type: 'image/jpeg' });
          const uploaded = await base44.integrations.Core.UploadFile({ file });
          file_url = uploaded.file_url;
        } catch (uploadError) {
          console.error('Erro no upload:', uploadError);
          alert('Erro ao fazer upload da imagem. Tente novamente.');
          setStep('upload');
          setLoading(false);
          return;
        }
      }

      // Validação mínima
      if (!file_url && !pastedText.trim()) {
        alert('Adicione uma imagem ou texto para continuar');
        setStep('upload');
        setLoading(false);
        return;
      }

      // Montar prompt
      const hasImage = !!file_url;
      const hasText = !!pastedText.trim();
      
      let sourceDescription = 'o texto fornecido';
      if (hasImage && hasText) {
        sourceDescription = 'esta imagem e o texto fornecido';
      } else if (hasImage) {
        sourceDescription = 'esta imagem';
      }

      let prompt = `Analise ${sourceDescription} de vaga de emprego e extraia TODAS as informações disponíveis.`;
      
      if (hasText) {
        prompt += `\n\nTEXTO DA VAGA:\n${pastedText}`;
      }
      
      prompt += `\n\nRetorne um JSON com os seguintes campos (use string vazia se não encontrar):
- cargo: título da vaga em MAIÚSCULAS
- empresa: nome da empresa
- local: cidade ou local
- tipo: tipo de contrato (CLT, PJ, Home Office, etc)
- salario: faixa salarial
- requisitos: lista de requisitos
- beneficios: lista de benefícios
- descricao: descrição geral
- contato: informações de contato (WhatsApp, email, telefone)

Seja preciso e capture todos os detalhes.`;

      // Chamar IA
      const params = {
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            cargo: { type: 'string' },
            empresa: { type: 'string' },
            local: { type: 'string' },
            tipo: { type: 'string' },
            salario: { type: 'string' },
            requisitos: { type: 'array', items: { type: 'string' } },
            beneficios: { type: 'array', items: { type: 'string' } },
            descricao: { type: 'string' },
            contato: { type: 'string' }
          }
        }
      };

      if (file_url) {
        params.file_urls = [file_url];
      }

      const result = await base44.integrations.Core.InvokeLLM(params);

      if (!result || !result.cargo) {
        alert('Não foi possível extrair informações. Verifique a imagem/texto e tente novamente.');
        setStep('upload');
        setLoading(false);
        return;
      }

      setExtractedData(result);
      setStep('editing');
      
    } catch (error) {
      console.error('Erro na extração:', error);
      const errorMsg = error.message || 'Erro desconhecido';
      alert(`Erro ao processar: ${errorMsg}\n\nTente novamente com outra imagem/texto.`);
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Gerar imagem
  const generateImage = async () => {
    setStep('generating');
    setLoading(true);

    try {
      // Aguardar renderização
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imageUrl = canvas.toDataURL('image/png');
      setGeneratedImageUrl(imageUrl);
      setStep('preview');
    } catch (error) {
      alert('Erro ao gerar imagem: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Download da imagem
  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `vaga-${extractedData.cargo.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = generatedImageUrl;
    link.click();
  };

  // Reset
  const startOver = () => {
    setStep('upload');
    setUploadedImage(null);
    setPastedText('');
    setExtractedData(null);
    setGeneratedImageUrl(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('PostarVaga')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Vagas Converter</h1>
              <p className="text-white/80 text-sm">Transforme qualquer imagem em post profissional</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step: Upload */}
        {step === 'upload' && (
          <Card className="rounded-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Envie Imagem e/ou Cole o Texto</h2>
                <p className="text-slate-600">A IA vai extrair todas as informações automaticamente</p>
              </div>

              {/* Upload de Imagem */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Imagem da Vaga (opcional)</label>
                {uploadedImage ? (
                  <div className="relative">
                    <img src={uploadedImage} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      onClick={() => setUploadedImage(null)}
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-blue-500 transition-colors text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Clique para selecionar imagem</p>
                    </div>
                  </label>
                )}
              </div>

              {/* Texto da Vaga */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Ou Cole o Texto da Vaga (opcional)</label>
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Cole aqui o texto da vaga com cargo, requisitos, salário, contato, etc..."
                  rows={8}
                  className="text-sm"
                />
              </div>

              <Button 
                onClick={handleExtract}
                disabled={!uploadedImage && !pastedText.trim()}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] h-12"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Extrair e Converter
              </Button>

              <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-slate-500">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p>Extração Automática</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <ImageIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p>Design Profissional</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Download className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p>Pronto para Postar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Extracting */}
        {step === 'extracting' && (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Extraindo Informações...</h2>
              <p className="text-slate-600">A IA está analisando a imagem</p>
            </CardContent>
          </Card>
        )}

        {/* Step: Editing */}
        {step === 'editing' && extractedData && (
          <div className="space-y-4">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Dados Extraídos - Revise e Edite
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Cargo *</label>
                    <Input
                      value={extractedData.cargo || ''}
                      onChange={(e) => setExtractedData({...extractedData, cargo: e.target.value})}
                      placeholder="Ex: VENDEDOR"
                      className="text-lg font-bold uppercase"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Empresa</label>
                    <Input
                      value={extractedData.empresa || ''}
                      onChange={(e) => setExtractedData({...extractedData, empresa: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Local</label>
                    <Input
                      value={extractedData.local || ''}
                      onChange={(e) => setExtractedData({...extractedData, local: e.target.value})}
                      placeholder="Cidade"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Tipo de Vaga</label>
                    <Input
                      value={extractedData.tipo || ''}
                      onChange={(e) => setExtractedData({...extractedData, tipo: e.target.value})}
                      placeholder="CLT, PJ, etc"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Salário</label>
                    <Input
                      value={extractedData.salario || ''}
                      onChange={(e) => setExtractedData({...extractedData, salario: e.target.value})}
                      placeholder="Faixa salarial"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium mb-1 block">Requisitos (um por linha)</label>
                  <Textarea
                    value={(extractedData.requisitos || []).join('\n')}
                    onChange={(e) => setExtractedData({...extractedData, requisitos: e.target.value.split('\n').filter(Boolean)})}
                    rows={4}
                    placeholder="Digite cada requisito em uma linha"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium mb-1 block">Benefícios (um por linha)</label>
                  <Textarea
                    value={(extractedData.beneficios || []).join('\n')}
                    onChange={(e) => setExtractedData({...extractedData, beneficios: e.target.value.split('\n').filter(Boolean)})}
                    rows={3}
                    placeholder="Digite cada benefício em uma linha"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium mb-1 block">Contato</label>
                  <Input
                    value={extractedData.contato || ''}
                    onChange={(e) => setExtractedData({...extractedData, contato: e.target.value})}
                    placeholder="WhatsApp, email, etc"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Escolha o Template</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`h-16 rounded-xl transition-all ${selectedTemplate.id === template.id ? 'ring-4 ring-blue-500 scale-105' : ''}`}
                        style={{ background: `linear-gradient(135deg, ${template.primary}, ${template.secondary})` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedTemplate.name}</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={startOver} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recomeçar
                  </Button>
                  <Button onClick={generateImage} className="flex-1 bg-[#0A66C2]">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Imagem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Gerando Imagem...</h2>
              <p className="text-slate-600">Criando seu design profissional</p>
            </CardContent>
          </Card>
        )}

        {/* Step: Preview */}
        {step === 'preview' && generatedImageUrl && (
          <div className="space-y-4">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-center">✨ Imagem Pronta!</h2>
                <div className="bg-slate-100 rounded-xl p-4 mb-4">
                  <img src={generatedImageUrl} alt="Preview" className="w-full max-w-md mx-auto rounded-lg shadow-lg" />
                </div>

                <div className="flex gap-3">
                  <Button onClick={startOver} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nova Vaga
                  </Button>
                  <Button onClick={() => setStep('editing')} variant="outline" className="flex-1">
                    Editar
                  </Button>
                  <Button onClick={downloadImage} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Canvas Oculto para Geração */}
        {extractedData && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <JobCanvas 
              ref={canvasRef} 
              data={extractedData} 
              template={selectedTemplate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Canvas para renderizar o design
const JobCanvas = React.forwardRef(({ data, template }, ref) => {
  const hasLongContent = (data.requisitos?.length || 0) + (data.beneficios?.length || 0) > 10;
  const fontSize = hasLongContent ? 'text-xs' : 'text-sm';

  return (
    <div 
      ref={ref}
      className="relative"
      style={{ 
        width: '1080px', 
        height: '1080px',
        background: `linear-gradient(135deg, ${template.primary} 0%, ${template.secondary} 100%)`,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Header com Logo */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg"
          alt="Logo"
          className="h-16 object-contain"
          style={{ filter: template.id === 'yellow-energy' ? 'none' : 'brightness(0) invert(1)' }}
        />
        <div className="text-right" style={{ color: template.accent }}>
          <div className="text-sm font-bold mb-1">Vagas Abertas</div>
          <div className="text-xs opacity-90">Paraíba</div>
        </div>
      </div>

      {/* Decoração de Fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" 
           style={{ background: template.accent, transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10" 
           style={{ background: template.accent, transform: 'translate(-40%, 40%)' }} />

      {/* Conteúdo Principal */}
      <div className="absolute inset-0 flex flex-col justify-center px-16 py-24">
        {/* Badge "TEMOS VAGAS" */}
        <div className="mb-6">
          <div className="inline-block px-8 py-3 rounded-full text-white font-black text-2xl tracking-wider"
               style={{ backgroundColor: template.accent === '#FFFFFF' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>
            TEMOS VAGAS
          </div>
        </div>

        {/* Cargo */}
        <h1 className="text-7xl font-black mb-4 leading-tight uppercase" 
            style={{ color: template.accent, textShadow: '2px 2px 8px rgba(0,0,0,0.2)' }}>
          {data.cargo}
        </h1>

        {/* Empresa e Local */}
        {(data.empresa || data.local) && (
          <div className="mb-8 flex items-center gap-4 text-xl font-semibold" style={{ color: template.accent }}>
            {data.empresa && <span>📍 {data.empresa}</span>}
            {data.local && <span>• {data.local}</span>}
          </div>
        )}

        {/* Tipo e Salário */}
        {(data.tipo || data.salario) && (
          <div className="mb-8 flex gap-4">
            {data.tipo && (
              <div className="px-6 py-2 rounded-full font-bold" 
                   style={{ backgroundColor: template.accent === '#FFFFFF' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', color: template.accent }}>
                {data.tipo}
              </div>
            )}
            {data.salario && (
              <div className="px-6 py-2 rounded-full font-bold" 
                   style={{ backgroundColor: 'rgba(34,197,94,0.9)', color: '#FFFFFF' }}>
                💰 {data.salario}
              </div>
            )}
          </div>
        )}

        {/* Requisitos */}
        {data.requisitos && data.requisitos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-3" style={{ color: template.accent }}>REQUISITOS:</h3>
            <div className={`space-y-1 ${fontSize}`} style={{ color: template.accent }}>
              {data.requisitos.slice(0, 6).map((req, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0">✓</span>
                  <span className="font-medium">{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benefícios */}
        {data.beneficios && data.beneficios.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3" style={{ color: template.accent }}>BENEFÍCIOS:</h3>
            <div className={`space-y-1 ${fontSize}`} style={{ color: template.accent }}>
              {data.beneficios.slice(0, 5).map((ben, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0">★</span>
                  <span className="font-medium">{ben}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contato */}
        {data.contato && (
          <div className="mt-auto">
            <div className="px-8 py-4 rounded-2xl font-bold text-xl inline-block"
                 style={{ backgroundColor: template.accent === '#FFFFFF' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', color: template.accent }}>
              📞 {data.contato}
            </div>
          </div>
        )}
      </div>

      {/* Footer com Instagram */}
      <div className="absolute bottom-8 right-8 flex items-center gap-3 px-6 py-3 rounded-full"
           style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        <span className="text-white font-bold text-lg">@vagasabertaspb</span>
      </div>
    </div>
  );
});