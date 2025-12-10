import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Sparkles, Image as ImageIcon, X, Zap, Trash2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import UnifiedPostWizard from "@/components/admin/UnifiedPostWizard";

export default function PostsEmMassa() {
  const [step, setStep] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.role === 'admin' || user.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setIsAuthorized(true);
        setCurrentUser(user);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    init();
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    if (files.length === 0) return;
    
    setUploading(true);
    const uploaded = [];
    let errorCount = 0;
    
    try {
      for (const file of files) {
        try {
          // Validar tamanho (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            console.warn('Arquivo muito grande:', file.name);
            errorCount++;
            continue;
          }
          
          const uploadResult = await base44.integrations.Core.UploadFile({ file });
          if (uploadResult && uploadResult.file_url) {
            uploaded.push({ id: Date.now() + Math.random(), url: uploadResult.file_url, status: 'pending' });
          } else {
            errorCount++;
          }
        } catch (fileError) {
          console.error('Erro no arquivo:', file.name, fileError);
          errorCount++;
        }
      }
      
      if (uploaded.length > 0) {
        setImages(prev => [...prev, ...uploaded]);
      }
      
      if (errorCount > 0) {
        alert(`${errorCount} arquivo(s) falharam no upload. ${uploaded.length} enviado(s) com sucesso.`);
      }
    } catch (err) {
      console.error('Erro geral no upload:', err);
      alert('Erro no upload das imagens. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const processImages = async () => {
    if (images.length === 0) {
      alert('Adicione imagens primeiro');
      return;
    }
    
    setProcessing(true);
    const allJobs = [];
    let errorCount = 0;
    
    try {
      for (const img of images) {
        try {
          setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));
          
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Extraia TODAS as vagas desta imagem: título, empresa, cidade, salário, telefone, link.`,
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
                      contact_phone: { type: "string" },
                      application_link: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          const jobsFound = result?.jobs || [];
          jobsFound.forEach(job => {
            if (job.title) {
              allJobs.push({
                ...job,
                image_url: img.url
              });
            }
          });

          setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'completed', count: jobsFound.length } : i));
        } catch (imgError) {
          console.error('Erro ao processar imagem:', img.url, imgError);
          setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error' } : i));
          errorCount++;
        }
      }
      
      if (allJobs.length === 0) {
        alert('Nenhuma vaga encontrada nas imagens. Tente com imagens mais claras.');
        return;
      }
      
      if (errorCount > 0) {
        alert(`${errorCount} imagem(ns) com erro. ${allJobs.length} vaga(s) extraída(s).`);
      }
      
      setExtractedJobs(allJobs);
      setStep(2);
    } catch (err) {
      console.error('Erro no processamento:', err);
      alert('Erro ao processar imagens. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(i => i.id !== id));
  };

  const handlePublish = async (wizardData) => {
    setPublishing(true);
    try {
      const jobsToCreate = wizardData.jobs;

      if (wizardData.schedule) {
        await base44.entities.ScheduledPost.create({
          post_type: 'job_mass',
          scheduled_date: new Date(`${wizardData.schedule.date}T${wizardData.schedule.time}`).toISOString(),
          job_data: { jobs: jobsToCreate },
          notification_data: wizardData.notification || {},
          status: 'pending'
        });
        alert('Vagas agendadas!');
      } else {
        let firstJobId = null;
        for (const job of jobsToCreate) {
          const created = await base44.entities.Job.create(job);
          if (!firstJobId) firstJobId = created.id;
        }
        
        if (wizardData.notification && firstJobId) {
          const users = await base44.entities.User.list();
          const targetUsers = wizardData.notification.premiumOnly 
            ? users.filter(u => u.subscription_type === 'premium' || u.role === 'admin').map(u => u.email)
            : users.map(u => u.email);

          await base44.functions.invoke('sendNotifications', {
            notification: wizardData.notification,
            jobId: firstJobId,
            targetUsers
          });
        }
        
        alert(`${jobsToCreate.length} vagas publicadas!`);
      }
      
      setImages([]);
      setExtractedJobs([]);
      setStep(1);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2 h-9">← Voltar</Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Posts em Massa</h1>
              <p className="text-white/70 text-sm">Upload múltiplas imagens</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <div className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg">
                    <Upload className="w-5 h-5" />
                    Upload
                  </span>
                  <Badge variant="outline">{images.length}/10</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="mass-upload"
                    onChange={handleImageUpload}
                    disabled={uploading || images.length >= 10}
                  />
                  <label htmlFor="mass-upload" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    )}
                    <p className="text-slate-600 font-medium mb-1">
                      {uploading ? 'Carregando...' : 'Clique para selecionar'}
                    </p>
                    <p className="text-slate-400 text-sm">Até 10 imagens</p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={img.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="ghost" className="text-white" onClick={() => removeImage(img.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {img.status === 'processing' && (
                          <div className="absolute inset-0 bg-purple-600/90 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                        {img.status === 'completed' && img.count > 0 && (
                          <div className="absolute top-1 right-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                            {img.count}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {images.length > 0 && (
                  <Button
                    onClick={processImages}
                    disabled={processing}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl"
                  >
                    {processing ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando...</>
                    ) : (
                      <><Zap className="w-5 h-5 mr-2" />Processar com IA</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && extractedJobs.length > 0 && (
          <UnifiedPostWizard
            jobsData={extractedJobs}
            onPublish={handlePublish}
            onSchedule={handlePublish}
            isLoading={publishing}
          />
        )}
      </div>
    </div>
  );
}