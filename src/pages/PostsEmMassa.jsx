import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Upload, Loader2, Sparkles, Image as ImageIcon, 
  FileText, CheckCircle, AlertCircle, Zap, Eye, Trash2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function PostsEmMassa() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [postMode, setPostMode] = useState('separated'); // 'separated', 'grouped', 'batch'
  const [results, setResults] = useState(null);

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
          prompt: `Analise esta imagem e extraia TODAS as vagas de emprego presentes. 
          
Para cada vaga encontrada, retorne:
- title: título da vaga
- company: nome da empresa
- city: cidade (se mencionar)
- salary_range: salário (se mencionar)
- job_type: tipo (CLT, Home Office, etc)
- description: descrição completa
- application_link: como se candidatar

Retorne TODAS as vagas encontradas, mesmo que sejam múltiplas.`,
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
                    city: { type: "string" },
                    salary_range: { type: "string" },
                    job_type: { type: "string" },
                    description: { type: "string" },
                    application_link: { type: "string" }
                  }
                }
              }
            }
          }
        });

        const jobs = result.jobs || [];
        
        jobs.forEach(job => {
          allJobs.push({
            ...job,
            imageUrl: img.url,
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

    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      if (postMode === 'grouped') {
        // Criar um único post com todas as vagas
        const groupedContent = extractedJobs.map((job, i) => 
          `📌 VAGA ${i + 1}: ${job.title}\n🏢 ${job.company}\n📍 ${job.city || 'Local não especificado'}\n💰 ${job.salary_range || 'A combinar'}\n📝 ${job.description}\n\n`
        ).join('');

        await base44.entities.FeedPost.create({
          autor_email: (await base44.auth.me()).email,
          autor_nome: (await base44.auth.me()).full_name,
          conteudo: groupedContent,
          imagens: images.map(img => img.url)
        });
        successCount = 1;

      } else {
        // Criar posts separados
        for (const job of extractedJobs) {
          try {
            await base44.entities.FeedPost.create({
              autor_email: (await base44.auth.me()).email,
              autor_nome: (await base44.auth.me()).full_name,
              conteudo: `📌 ${job.title}\n\n🏢 Empresa: ${job.company}\n📍 Local: ${job.city || 'Não especificado'}\n💰 Salário: ${job.salary_range || 'A combinar'}\n📋 Tipo: ${job.job_type || 'Não especificado'}\n\n${job.description}\n\n${job.application_link ? `📲 Como se candidatar: ${job.application_link}` : ''}`,
              imagens: [job.imageUrl]
            });
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
        total: postMode === 'grouped' ? 1 : extractedJobs.length
      });

    } catch (error) {
      console.error('Erro ao publicar posts:', error);
      alert('Erro ao publicar posts');
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
                onClick={() => setPostMode('separated')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  postMode === 'separated' 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                    postMode === 'separated' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }`}>
                    {postMode === 'separated' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-1"></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Posts Separados</p>
                    <p className="text-sm text-slate-500">Criar um post individual para cada vaga encontrada</p>
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
                    <p className="text-sm text-slate-500">Criar um único post com todas as vagas</p>
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
                      {job.job_type && <p>📋 {job.job_type}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={publishPosts}
                disabled={processing}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Publicar {postMode === 'grouped' ? '1 Post Agrupado' : `${extractedJobs.length} Posts`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {results && (
          <Card className="rounded-2xl border-2 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Publicação Concluída!</h3>
              <p className="text-slate-600 mb-6">
                {results.success} de {results.total} posts publicados com sucesso
              </p>
              <div className="flex gap-3">
                <Link to={createPageUrl('Feed')} className="flex-1">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">
                    <Eye className="w-5 h-5 mr-2" />
                    Ver no Feed
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