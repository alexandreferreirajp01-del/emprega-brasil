import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Loader2, Download, Sparkles, RefreshCw, ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import html2canvas from 'html2canvas';

const TEMPLATES = [
  { id: 'blue', name: 'Azul Profissional', bg: '#0A66C2', text: '#FFFFFF' },
  { id: 'green', name: 'Verde Moderno', bg: '#10B981', text: '#FFFFFF' },
  { id: 'purple', name: 'Roxo Elegante', bg: '#8B5CF6', text: '#FFFFFF' },
  { id: 'red', name: 'Vermelho Forte', bg: '#DC2626', text: '#FFFFFF' },
  { id: 'orange', name: 'Laranja Vibrante', bg: '#F59E0B', text: '#1F2937' },
  { id: 'teal', name: 'Azul Turquesa', bg: '#14B8A6', text: '#FFFFFF' },
];

export default function VagasConverter() {
  const [step, setStep] = useState('input'); // input, processing, editing, preview
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [finalImage, setFinalImage] = useState(null);
  const canvasRef = useRef(null);

  // Upload de imagem
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Processar com IA
  const handleProcess = async () => {
    if (!imageFile && !textInput.trim()) {
      alert('Adicione uma imagem ou texto');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      let uploadedUrl = null;

      // Upload da imagem se existir
      if (imageFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
        uploadedUrl = uploadResult.file_url;
      }

      // Preparar prompt
      let prompt = `Extraia TODAS as informações desta vaga de emprego e retorne em JSON.`;
      
      if (textInput.trim()) {
        prompt += `\n\nTEXTO:\n${textInput}`;
      }

      prompt += `\n\nCampos obrigatórios:
- cargo: título em MAIÚSCULAS
- empresa: nome da empresa (vazio se não tiver)
- local: cidade
- tipo: CLT/PJ/etc
- salario: faixa salarial
- requisitos: array de strings
- beneficios: array de strings
- contato: WhatsApp/email/telefone`;

      // Chamar IA
      const aiParams = {
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
            contato: { type: 'string' }
          }
        }
      };

      if (uploadedUrl) {
        aiParams.file_urls = [uploadedUrl];
      }

      const result = await base44.integrations.Core.InvokeLLM(aiParams);

      // Normalizar resultado
      const normalizedData = {
        cargo: (result?.cargo || 'VAGA').toUpperCase(),
        empresa: result?.empresa || '',
        local: result?.local || '',
        tipo: result?.tipo || '',
        salario: result?.salario || '',
        requisitos: Array.isArray(result?.requisitos) ? result.requisitos : [],
        beneficios: Array.isArray(result?.beneficios) ? result.beneficios : [],
        contato: result?.contato || ''
      };

      setJobData(normalizedData);
      setStep('editing');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar: ' + (error.message || 'Erro desconhecido'));
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  // Gerar imagem final
  const handleGenerate = async () => {
    if (!jobData?.cargo) {
      alert('Preencha pelo menos o cargo');
      return;
    }

    setLoading(true);
    setStep('preview');

    try {
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false
      });

      const imageData = canvas.toDataURL('image/png');
      setFinalImage(imageData);
    } catch (error) {
      alert('Erro ao gerar: ' + error.message);
      setStep('editing');
    } finally {
      setLoading(false);
    }
  };

  // Download
  const handleDownload = () => {
    if (!finalImage) return;
    const link = document.createElement('a');
    link.download = `vaga-${jobData.cargo.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = finalImage;
    link.click();
  };

  // Reset
  const reset = () => {
    setStep('input');
    setImageFile(null);
    setImagePreview(null);
    setTextInput('');
    setJobData(null);
    setFinalImage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('PostarVaga')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
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
              <p className="text-white/80 text-sm">IA extrai e cria post profissional</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* STEP 1: Input */}
        {step === 'input' && (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Envie Imagem ou Cole Texto</h2>

              {/* Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Imagem (opcional)</label>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-blue-500 transition text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Clique para upload</p>
                    </div>
                  </label>
                )}
              </div>

              {/* Texto */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Ou Cole o Texto (opcional)</label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Cole aqui o texto da vaga..."
                  rows={6}
                />
              </div>

              <Button
                onClick={handleProcess}
                disabled={!imageFile && !textInput.trim()}
                className="w-full bg-[#0A66C2] h-12"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Processar com IA
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Processing */}
        {step === 'processing' && (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Processando...</h2>
              <p className="text-slate-600">IA extraindo informações</p>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Editing */}
        {step === 'editing' && jobData && (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Edite os Dados Extraídos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Cargo *</label>
                  <Input
                    value={jobData.cargo}
                    onChange={(e) => setJobData({...jobData, cargo: e.target.value.toUpperCase()})}
                    placeholder="VENDEDOR"
                    className="font-bold"
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

                <div>
                  <label className="text-sm font-medium mb-1 block">Local</label>
                  <Input
                    value={jobData.local}
                    onChange={(e) => setJobData({...jobData, local: e.target.value})}
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo</label>
                  <Input
                    value={jobData.tipo}
                    onChange={(e) => setJobData({...jobData, tipo: e.target.value})}
                    placeholder="CLT, PJ, etc"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Salário</label>
                  <Input
                    value={jobData.salario}
                    onChange={(e) => setJobData({...jobData, salario: e.target.value})}
                    placeholder="R$ 2.000 - R$ 3.000"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Requisitos (1 por linha)</label>
                <Textarea
                  value={(jobData.requisitos || []).join('\n')}
                  onChange={(e) => setJobData({...jobData, requisitos: e.target.value.split('\n').filter(Boolean)})}
                  rows={4}
                  placeholder="Ensino médio completo&#10;Experiência em vendas"
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Benefícios (1 por linha)</label>
                <Textarea
                  value={(jobData.beneficios || []).join('\n')}
                  onChange={(e) => setJobData({...jobData, beneficios: e.target.value.split('\n').filter(Boolean)})}
                  rows={3}
                  placeholder="Vale transporte&#10;Vale alimentação"
                />
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium mb-1 block">Contato</label>
                <Input
                  value={jobData.contato}
                  onChange={(e) => setJobData({...jobData, contato: e.target.value})}
                  placeholder="(83) 99999-9999"
                />
              </div>

              {/* Templates */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Escolha a Cor</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`h-16 rounded-xl transition ${selectedTemplate.id === t.id ? 'ring-4 ring-blue-500 scale-105' : ''}`}
                      style={{ backgroundColor: t.bg }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedTemplate.name}</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={reset} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recomeçar
                </Button>
                <Button onClick={handleGenerate} className="flex-1 bg-[#0A66C2]">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Gerar Imagem
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Preview */}
        {step === 'preview' && (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-slate-600">Gerando imagem...</p>
                </div>
              ) : finalImage ? (
                <>
                  <h2 className="text-xl font-bold mb-4 text-center">✨ Imagem Pronta!</h2>
                  <div className="bg-slate-100 rounded-xl p-4 mb-4">
                    <img src={finalImage} alt="Final" className="w-full max-w-md mx-auto rounded-lg shadow-lg" />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={reset} variant="outline" className="flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Nova Vaga
                    </Button>
                    <Button onClick={() => setStep('editing')} variant="outline" className="flex-1">
                      Editar
                    </Button>
                    <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Canvas Oculto */}
        {jobData && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <JobCanvas ref={canvasRef} data={jobData} template={selectedTemplate} />
          </div>
        )}
      </div>
    </div>
  );
}

// Canvas para renderização
const JobCanvas = React.forwardRef(({ data, template }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: '1080px',
        height: '1080px',
        backgroundColor: template.bg,
        color: template.text,
        padding: '60px',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925b32acced418ac606d1b9/0fe1413fb_logoempreto.jpeg"
          alt="Logo"
          style={{ height: '60px', filter: template.text === '#FFFFFF' ? 'brightness(0) invert(1)' : 'none' }}
        />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Vagas Abertas</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Paraíba</div>
        </div>
      </div>

      {/* Badge */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          display: 'inline-block',
          padding: '12px 32px',
          borderRadius: '50px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          fontSize: '24px',
          fontWeight: 900,
          letterSpacing: '2px'
        }}>
          TEMOS VAGAS
        </div>
      </div>

      {/* Cargo */}
      <h1 style={{
        fontSize: '72px',
        fontWeight: 900,
        marginBottom: '20px',
        lineHeight: '1.1',
        textShadow: '2px 2px 8px rgba(0,0,0,0.2)'
      }}>
        {data.cargo}
      </h1>

      {/* Empresa/Local */}
      {(data.empresa || data.local) && (
        <div style={{ fontSize: '24px', marginBottom: '30px', fontWeight: 600 }}>
          {data.empresa && `📍 ${data.empresa}`}
          {data.empresa && data.local && ' • '}
          {data.local}
        </div>
      )}

      {/* Tipo/Salário */}
      {(data.tipo || data.salario) && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          {data.tipo && (
            <div style={{
              padding: '10px 24px',
              borderRadius: '50px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {data.tipo}
            </div>
          )}
          {data.salario && (
            <div style={{
              padding: '10px 24px',
              borderRadius: '50px',
              backgroundColor: 'rgba(34,197,94,0.9)',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              💰 {data.salario}
            </div>
          )}
        </div>
      )}

      {/* Requisitos */}
      {data.requisitos?.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>REQUISITOS:</h3>
          <div style={{ fontSize: '16px' }}>
            {data.requisitos.slice(0, 6).map((req, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>✓ {req}</div>
            ))}
          </div>
        </div>
      )}

      {/* Benefícios */}
      {data.beneficios?.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>BENEFÍCIOS:</h3>
          <div style={{ fontSize: '16px' }}>
            {data.beneficios.slice(0, 5).map((ben, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>★ {ben}</div>
            ))}
          </div>
        </div>
      )}

      {/* Contato */}
      {data.contato && (
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            display: 'inline-block',
            padding: '15px 30px',
            borderRadius: '20px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            📞 {data.contato}
          </div>
        </div>
      )}

      {/* Footer Instagram */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 24px',
        borderRadius: '50px',
        backgroundColor: 'rgba(0,0,0,0.3)'
      }}>
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>@vagasabertaspb</span>
      </div>
    </div>
  );
});