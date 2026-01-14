import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Upload, Download, Copy, Image as ImageIcon, FileText, 
  Loader2, CheckCircle, Wand2, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export default function PostConverter() {
  const [mode, setMode] = useState(null); // 'convert' ou 'create'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedText, setUploadedText] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [convertedImage, setConvertedImage] = useState(null);
  const [newPostData, setNewPostData] = useState(null);
  const canvasRef = useRef(null);
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

  // Opção 1: Apenas Converter (Story -> Feed)
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

      // Fundo branco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Calcular dimensões para manter aspect ratio da imagem original
      const imgRatio = img.width / img.height;
      let drawWidth, drawHeight, x, y;

      if (imgRatio > 1) {
        drawWidth = size;
        drawHeight = size / imgRatio;
        x = 0;
        y = (size - drawHeight) / 2;
      } else {
        drawHeight = size * 0.85; // 85% da altura para deixar espaço para o @
        drawWidth = drawHeight * imgRatio;
        x = (size - drawWidth) / 2;
        y = 0;
      }

      // Desenhar imagem original
      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // Adicionar @ no final
      const footerHeight = 80;
      const footerY = size - footerHeight;
      
      ctx.fillStyle = '#0A66C2';
      ctx.fillRect(0, footerY, size, footerHeight);

      // Logo Instagram + @
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('@vagasabertaspb', size / 2, footerY + 50);

      const dataUrl = canvas.toDataURL('image/png');
      setConvertedImage(dataUrl);

      // Gerar descrição com IA
      const { data } = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie uma descrição para Instagram para uma vaga de emprego. Inclua:
- Texto atraente e profissional
- Exatamente 5 hashtags relevantes (#vagas #emprego etc)
- CTA para seguir o perfil e marcar amigos
- SEO otimizado
- Máximo 150 palavras

Formato: [Descrição] + [Hashtags] + [CTA]`,
      });

      setGeneratedCaption(data);
      toast.success('Imagem convertida com sucesso!');
    } catch (error) {
      console.error('Erro ao converter:', error);
      toast.error('Erro ao converter imagem');
    } finally {
      setProcessing(false);
    }
  };

  // Opção 2: Criar Novo POST
  const handleCreateNew = async () => {
    if (!previewUrl && !uploadedText) {
      toast.error('Faça upload de uma imagem ou insira texto');
      return;
    }

    setProcessing(true);
    try {
      let extractedData;

      if (uploadedFile) {
        // Upload da imagem
        const formData = new FormData();
        formData.append('file', uploadedFile);
        const uploadRes = await base44.integrations.Core.UploadFile({ file: uploadedFile });
        
        // Extrair informações da imagem com IA
        const { data } = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise esta imagem de vaga de emprego e extraia TODAS as informações:
- Título da vaga
- Nome da empresa
- Local (cidade/estado)
- Tipo de contrato (CLT, PJ, etc)
- Salário (se houver)
- Requisitos
- Benefícios
- Forma de candidatura

Retorne em JSON estruturado.`,
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

        extractedData = data;
      } else {
        // Extrair do texto
        const { data } = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este texto de vaga e extraia informações estruturadas:\n\n${uploadedText}`,
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

        extractedData = data;
      }

      setNewPostData(extractedData);

      // Gerar caption
      const captionRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie uma descrição Instagram para esta vaga:
${JSON.stringify(extractedData, null, 2)}

Inclua:
- Texto atraente
- 5 hashtags
- CTA para seguir e marcar amigos
- Máximo 150 palavras`,
      });

      setGeneratedCaption(captionRes.data);
      toast.success('POST criado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar POST');
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = async (imageUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadNewPost = async () => {
    if (!newPostRef.current) return;

    try {
      const canvas = await html2canvas(newPostRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      downloadImage(dataUrl, 'post-instagram.png');
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao fazer download');
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast.success('Legenda copiada!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>POST Converter - Instagram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!mode && (
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => setMode('convert')}
                className="h-32 flex-col gap-3 bg-gradient-to-br from-[#0A66C2] to-[#004182] hover:opacity-90"
              >
                <RefreshCw className="w-8 h-8" />
                <div>
                  <div className="font-bold text-lg">Apenas Converter</div>
                  <div className="text-xs opacity-90">Story → Feed (1:1)</div>
                </div>
              </Button>

              <Button
                onClick={() => setMode('create')}
                className="h-32 flex-col gap-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:opacity-90"
              >
                <Wand2 className="w-8 h-8" />
                <div>
                  <div className="font-bold text-lg">Criar Novo POST</div>
                  <div className="text-xs opacity-90">Gerar design automático</div>
                </div>
              </Button>
            </div>
          )}

          {mode && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {mode === 'convert' ? 'Converter Imagem' : 'Criar Novo POST'}
                </h3>
                <Button variant="outline" onClick={resetAll}>
                  Voltar
                </Button>
              </div>

              {/* Upload */}
              <div className="space-y-4">
                <Label>Upload de Imagem</Label>
                <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm text-slate-600">Clique para fazer upload da imagem</p>
                  </label>
                </div>

                {mode === 'create' && (
                  <>
                    <div className="text-center text-sm text-slate-500">OU</div>
                    <div>
                      <Label>Cole o texto da vaga</Label>
                      <Textarea
                        value={uploadedText}
                        onChange={(e) => setUploadedText(e.target.value)}
                        placeholder="Cole aqui o texto completo da vaga..."
                        rows={6}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}

                {previewUrl && (
                  <div className="rounded-lg overflow-hidden border max-w-xs mx-auto">
                    <img src={previewUrl} alt="Preview" className="w-full" />
                  </div>
                )}
              </div>

              {/* Botão Processar */}
              <Button
                onClick={mode === 'convert' ? handleConvert : handleCreateNew}
                disabled={processing || (!previewUrl && !uploadedText)}
                className="w-full h-12 text-lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {mode === 'convert' ? 'Converter Agora' : 'Criar POST'}
                  </>
                )}
              </Button>

              {/* Resultados - Converter */}
              {mode === 'convert' && convertedImage && (
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-semibold text-lg">Resultado</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Imagem Convertida</Label>
                      <div className="mt-2 border rounded-lg overflow-hidden">
                        <img src={convertedImage} alt="Convertida" className="w-full" />
                      </div>
                      <Button
                        onClick={() => downloadImage(convertedImage, 'post-feed-instagram.png')}
                        className="w-full mt-3"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Imagem
                      </Button>
                    </div>

                    <div>
                      <Label>Legenda Gerada</Label>
                      <Textarea
                        value={generatedCaption}
                        onChange={(e) => setGeneratedCaption(e.target.value)}
                        rows={10}
                        className="mt-2 font-sans text-sm"
                      />
                      <Button
                        onClick={copyCaption}
                        variant="outline"
                        className="w-full mt-3"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Legenda
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados - Criar Novo */}
              {mode === 'create' && newPostData && (
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-semibold text-lg">POST Criado</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Preview do POST</Label>
                      <div 
                        ref={newPostRef}
                        className="mt-2 bg-white rounded-lg overflow-hidden shadow-lg"
                        style={{ width: '540px', height: '540px', maxWidth: '100%' }}
                      >
                        {/* Design do POST */}
                        <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex flex-col justify-between">
                          {/* Logo */}
                          <div className="absolute top-4 right-4 w-16 h-16 bg-[#0A66C2] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">EB+</span>
                          </div>

                          {/* Conteúdo */}
                          <div className="space-y-4">
                            <div className="bg-white rounded-xl p-6 shadow-md">
                              <h2 className="text-2xl font-bold text-[#0A66C2] mb-2 leading-tight">
                                {newPostData.titulo}
                              </h2>
                              <p className="text-lg text-slate-700 font-semibold">{newPostData.empresa}</p>
                            </div>

                            <div className="bg-white/90 rounded-xl p-5 space-y-3">
                              {newPostData.local && (
                                <div className="flex items-start gap-2">
                                  <span className="text-[#0A66C2] font-bold">📍</span>
                                  <span className="text-sm text-slate-700">{newPostData.local}</span>
                                </div>
                              )}
                              {newPostData.tipo && (
                                <div className="flex items-start gap-2">
                                  <span className="text-[#0A66C2] font-bold">💼</span>
                                  <span className="text-sm text-slate-700">{newPostData.tipo}</span>
                                </div>
                              )}
                              {newPostData.salario && (
                                <div className="flex items-start gap-2">
                                  <span className="text-[#0A66C2] font-bold">💰</span>
                                  <span className="text-sm text-slate-700 font-semibold">{newPostData.salario}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="bg-[#0A66C2] rounded-xl p-4 text-center">
                            <p className="text-white font-bold text-lg">@vagasabertaspb</p>
                            <p className="text-white/80 text-xs">Emprega Brasil+</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={downloadNewPost}
                        className="w-full mt-3"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download POST
                      </Button>
                    </div>

                    <div>
                      <Label>Legenda Gerada</Label>
                      <Textarea
                        value={generatedCaption}
                        onChange={(e) => setGeneratedCaption(e.target.value)}
                        rows={12}
                        className="mt-2 font-sans text-sm"
                      />
                      <Button
                        onClick={copyCaption}
                        variant="outline"
                        className="w-full mt-3"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Legenda
                      </Button>

                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-slate-600">
                          <strong>Informações Extraídas:</strong>
                        </p>
                        <pre className="text-xs mt-2 text-slate-700 whitespace-pre-wrap">
                          {JSON.stringify(newPostData, null, 2)}
                        </pre>
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