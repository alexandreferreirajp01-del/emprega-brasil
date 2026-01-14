import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Upload, Download, Copy, Image as ImageIcon, FileText, 
  Loader2, Wand2, RefreshCw, ArrowLeft
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export default function PostConverter() {
  const [mode, setMode] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedText, setUploadedText] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [convertedImage, setConvertedImage] = useState(null);
  const [newPostData, setNewPostData] = useState(null);
  const newPostRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const resetAll = () => {
    setMode(null);
    setUploadedFile(null);
    setUploadedText('');
    setPreviewUrl(null);
    setGeneratedCaption('');
    setConvertedImage(null);
    setNewPostData(null);
  };

  // Opção 1: Converter Story → Feed (comprimir e reorganizar)
  const handleConvert = async () => {
    if (!previewUrl) {
      toast.error('Faça upload de uma imagem primeiro');
      return;
    }

    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = previewUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Tamanho final: quadrado 1080x1080
      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      // Para story vertical, redimensionar para largura total e comprimir altura proporcionalmente
      const imgRatio = img.width / img.height;
      
      if (imgRatio < 1) {
        // Story vertical: ocupar toda a largura, ajustar altura proporcionalmente
        const drawWidth = size;
        const drawHeight = size / imgRatio;
        
        // Se a altura calculada for maior que o canvas, comprimir para caber
        if (drawHeight > size) {
          // Comprimir verticalmente mantendo toda a largura
          ctx.drawImage(img, 0, 0, drawWidth, size);
        } else {
          // Centralizar se couber
          ctx.drawImage(img, 0, (size - drawHeight) / 2, drawWidth, drawHeight);
        }
      } else {
        // Horizontal ou quadrado: ocupar todo o espaço
        ctx.drawImage(img, 0, 0, size, size);
      }

      // Badge do Instagram no canto inferior direito (destacado e bonito)
      const badgeWidth = 240;
      const badgeHeight = 60;
      const badgeX = size - badgeWidth - 10;
      const badgeY = size - badgeHeight - 10;
      
      // Fundo do badge (marrom escuro estilo das imagens)
      ctx.fillStyle = 'rgba(92, 64, 51, 0.95)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 12);
      ctx.fill();

      // Ícone do Instagram (simulado com emoji/símbolo)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // Desenhar ícone do Instagram (câmera)
      const iconX = badgeX + 20;
      const iconY = badgeY + badgeHeight / 2;
      ctx.fillText('📷', iconX, iconY);

      // Texto @vagasabertaspb
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('vagasabertaspb', iconX + 40, iconY);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setConvertedImage(dataUrl);

      // Gerar descrição com IA
      const captionData = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie uma descrição profissional para Instagram de uma vaga de emprego. 

Inclua:
- Texto atraente e chamativo (2-3 linhas)
- Exatamente 5 hashtags relevantes (#vagas #emprego #oportunidade etc)
- CTA para seguir o perfil e marcar amigos que procuram emprego
- SEO otimizado para alcance

Formato:
[Descrição atraente]

[5 hashtags]

[CTA: "Siga @vagasabertaspb para mais oportunidades! Marque aqueles amigos que estão procurando emprego! 💼"]

Máximo 150 palavras.`,
      });

      setGeneratedCaption(captionData.data || captionData);
      toast.success('Imagem convertida com sucesso!');
    } catch (error) {
      console.error('Erro ao converter:', error);
      toast.error('Erro ao converter imagem: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Opção 2: Criar Novo POST do zero
  const handleCreateNew = async () => {
    if (!previewUrl && !uploadedText) {
      toast.error('Faça upload de uma imagem ou insira texto');
      return;
    }

    setProcessing(true);
    try {
      let extractedData;

      if (uploadedFile) {
        // Upload da imagem para análise
        const uploadRes = await base44.integrations.Core.UploadFile({ file: uploadedFile });
        
        // Extrair informações da imagem com IA
        const extractRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise esta imagem de vaga de emprego e extraia TODAS as informações visíveis. Seja fiel ao conteúdo original, não invente nada.

Extraia:
- Título da vaga (cargo)
- Nome da empresa
- Local (cidade/estado)
- Tipo de contrato (CLT, PJ, etc)
- Salário (se houver)
- Requisitos/características
- Benefícios (se houver)
- Forma de candidatura (WhatsApp, email, site)

IMPORTANTE: Se algo não estiver visível, retorne string vazia. Não invente informações.`,
          file_urls: [uploadRes.file_url],
          response_json_schema: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              empresa: { type: "string" },
              local: { type: "string" },
              tipo: { type: "string" },
              salario: { type: "string" },
              requisitos: { type: "string" },
              beneficios: { type: "string" },
              candidatura: { type: "string" }
            }
          }
        });

        extractedData = extractRes.data || extractRes;
      } else {
        // Extrair do texto
        const extractRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este texto de vaga e extraia informações estruturadas. Seja fiel ao texto original:\n\n${uploadedText}`,
          response_json_schema: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              empresa: { type: "string" },
              local: { type: "string" },
              tipo: { type: "string" },
              salario: { type: "string" },
              requisitos: { type: "string" },
              beneficios: { type: "string" },
              candidatura: { type: "string" }
            }
          }
        });

        extractedData = extractRes.data || extractRes;
      }

      setNewPostData(extractedData);

      // Gerar caption
      const captionRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie uma descrição Instagram profissional para esta vaga:

${JSON.stringify(extractedData, null, 2)}

Inclua:
- Texto atraente (2-3 linhas)
- 5 hashtags
- CTA para seguir @vagasabertaspb e marcar amigos
- Máximo 150 palavras`,
      });

      setGeneratedCaption(captionRes.data || captionRes);
      toast.success('POST criado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar POST: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = (imageUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  const downloadNewPost = async () => {
    if (!newPostRef.current) return;

    try {
      const canvas = await html2canvas(newPostRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      downloadImage(dataUrl, 'post-instagram-1080x1080.png');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao fazer download');
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast.success('Legenda copiada para área de transferência!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-[#0A66C2]" />
            POST Converter - Instagram
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Converta stories em posts feed ou crie novos posts automaticamente
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {!mode && (
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setMode('convert')}
                className="group h-40 rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#004182] hover:shadow-xl transition-all p-6 flex flex-col items-center justify-center gap-4 text-white"
              >
                <RefreshCw className="w-12 h-12 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-center">
                  <div className="font-bold text-xl mb-1">Apenas Converter</div>
                  <div className="text-sm opacity-90">Story (9:16) → Feed (1:1)</div>
                  <div className="text-xs opacity-75 mt-2">Mantém design original + adiciona @</div>
                </div>
              </button>

              <button
                onClick={() => setMode('create')}
                className="group h-40 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 hover:shadow-xl transition-all p-6 flex flex-col items-center justify-center gap-4 text-white"
              >
                <Wand2 className="w-12 h-12 group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="font-bold text-xl mb-1">Criar Novo POST</div>
                  <div className="text-sm opacity-90">Com IA e design automático</div>
                  <div className="text-xs opacity-75 mt-2">Extrai informações e gera arte</div>
                </div>
              </button>
            </div>
          )}

          {mode && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {mode === 'convert' ? '📐 Converter Formato' : '✨ Criar Novo POST'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {mode === 'convert' 
                      ? 'Converte story vertical para feed quadrado mantendo todo o conteúdo original' 
                      : 'Cria um novo post com design profissional a partir das informações extraídas'}
                  </p>
                </div>
                <Button variant="outline" onClick={resetAll} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              </div>

              {/* Upload Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  {mode === 'convert' ? 'Upload da Imagem (Story)' : 'Upload de Imagem ou Texto'}
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 hover:border-[#0A66C2] transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-base font-medium text-slate-700 mb-1">
                      Clique para fazer upload
                    </p>
                    <p className="text-sm text-slate-500">
                      {mode === 'convert' 
                        ? 'Envie uma imagem vertical (story 9:16)' 
                        : 'PNG, JPG até 10MB'}
                    </p>
                  </label>
                </div>

                {mode === 'create' && (
                  <>
                    <div className="text-center">
                      <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                        OU
                      </span>
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Cole o Texto da Vaga</Label>
                      <Textarea
                        value={uploadedText}
                        onChange={(e) => setUploadedText(e.target.value)}
                        placeholder="Cole aqui todas as informações da vaga (título, empresa, requisitos, forma de candidatura, etc)..."
                        rows={8}
                        className="mt-2 text-base"
                      />
                    </div>
                  </>
                )}

                {previewUrl && (
                  <div className="mt-6">
                    <Label className="text-base font-semibold mb-3 block">Preview Original:</Label>
                    <div className="rounded-xl overflow-hidden border-2 border-slate-200 max-w-sm mx-auto shadow-lg">
                      <img src={previewUrl} alt="Preview" className="w-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Processar */}
              <Button
                onClick={mode === 'convert' ? handleConvert : handleCreateNew}
                disabled={processing || (!previewUrl && !uploadedText)}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#0A66C2] to-[#004182] hover:opacity-90"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {mode === 'convert' ? '🔄 Converter Agora' : '✨ Criar POST'}
                  </>
                )}
              </Button>

              {/* Resultados - Converter */}
              {mode === 'convert' && convertedImage && (
                <div className="space-y-6 pt-6 border-t-2">
                  <h4 className="text-xl font-bold text-slate-800">✅ Conversão Concluída</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">📱 Imagem Convertida (1080x1080)</Label>
                      <div className="rounded-xl overflow-hidden border-2 border-[#0A66C2] shadow-xl">
                        <img src={convertedImage} alt="Convertida" className="w-full" />
                      </div>
                      <Button
                        onClick={() => downloadImage(convertedImage, 'post-feed-instagram-1080x1080.png')}
                        className="w-full h-12 bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Imagem (PNG)
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">📝 Legenda Gerada (SEO)</Label>
                      <Textarea
                        value={generatedCaption}
                        onChange={(e) => setGeneratedCaption(e.target.value)}
                        rows={12}
                        className="font-sans text-sm resize-none"
                      />
                      <Button
                        onClick={copyCaption}
                        variant="outline"
                        className="w-full h-12 border-2"
                      >
                        <Copy className="w-5 h-5 mr-2" />
                        Copiar Legenda
                      </Button>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-xs text-blue-800 font-medium">
                          💡 Dica: A legenda já está otimizada com hashtags e CTA. Cole no Instagram!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados - Criar Novo */}
              {mode === 'create' && newPostData && (
                <div className="space-y-6 pt-6 border-t-2">
                  <h4 className="text-xl font-bold text-slate-800">✅ POST Criado com Sucesso</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">🎨 Preview do POST</Label>
                      <div 
                        ref={newPostRef}
                        className="mx-auto rounded-xl overflow-hidden shadow-2xl"
                        style={{ width: '540px', height: '540px', maxWidth: '100%' }}
                      >
                        {/* Design Padrão do POST */}
                        <div className="w-full h-full relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-6 flex flex-col justify-between">
                          {/* Decorações */}
                          <div className="absolute top-0 right-0 w-32 h-32 border-4 border-dashed border-orange-300 rounded-full -translate-y-8 translate-x-8 opacity-40" />
                          <div className="absolute bottom-20 left-0 w-24 h-24 border-4 border-dashed border-orange-300 rounded-full -translate-x-8 opacity-40" />

                          {/* Header com logo */}
                          <div className="relative z-10 flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-orange-600 font-bold text-lg tracking-wide">Emprega Brasil+</p>
                              <p className="text-slate-700 font-bold text-3xl leading-tight">CONTRATA</p>
                            </div>
                            <div className="w-14 h-14 bg-[#0A66C2] rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-lg">EB+</span>
                            </div>
                          </div>

                          {/* Conteúdo Principal */}
                          <div className="relative z-10 space-y-4">
                            {/* Card do Cargo */}
                            <div className="bg-white rounded-2xl p-5 shadow-lg">
                              <h2 className="text-xl font-bold text-slate-800 text-center leading-tight">
                                {newPostData.titulo || 'VAGA DISPONÍVEL'}
                              </h2>
                            </div>

                            {/* Características */}
                            <div className="bg-white/95 rounded-2xl p-5 space-y-3 shadow-md">
                              <p className="text-orange-600 font-bold text-sm">Características importantes:</p>
                              {newPostData.requisitos && (
                                <p className="text-slate-700 text-sm leading-relaxed">
                                  {newPostData.requisitos.split('\n').slice(0, 4).map((item, i) => (
                                    <span key={i} className="block">- {item}</span>
                                  ))}
                                </p>
                              )}
                            </div>

                            {/* Candidatura */}
                            {newPostData.candidatura && (
                              <div className="bg-orange-600 rounded-2xl p-4 text-white shadow-md">
                                <p className="text-sm font-bold text-center">
                                  {newPostData.candidatura}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="relative z-10 flex items-end justify-between">
                            <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-full w-3/4 h-24 flex items-center justify-center shadow-lg">
                              <div className="text-center">
                                <p className="text-slate-800 font-bold text-lg">Emprega Brasil+</p>
                              </div>
                            </div>
                            <div className="bg-amber-900/80 rounded-tl-2xl px-4 py-2">
                              <p className="text-white text-xs font-bold">📷 vagasabertaspb</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={downloadNewPost}
                        className="w-full h-12 bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download POST (PNG)
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">📝 Legenda Gerada</Label>
                      <Textarea
                        value={generatedCaption}
                        onChange={(e) => setGeneratedCaption(e.target.value)}
                        rows={10}
                        className="font-sans text-sm resize-none"
                      />
                      <Button
                        onClick={copyCaption}
                        variant="outline"
                        className="w-full h-12 border-2"
                      >
                        <Copy className="w-5 h-5 mr-2" />
                        Copiar Legenda
                      </Button>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">📋 Informações Extraídas:</Label>
                        <div className="p-4 bg-slate-50 rounded-xl border space-y-2 text-xs">
                          {Object.entries(newPostData).map(([key, value]) => (
                            value && (
                              <div key={key}>
                                <strong className="text-slate-600 capitalize">{key}:</strong>
                                <p className="text-slate-800 ml-2">{value}</p>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}