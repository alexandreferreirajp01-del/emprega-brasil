import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Sparkles, Image as ImageIcon, X, Zap, Trash2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import UnifiedPostWizard from "@/components/admin/UnifiedPostWizard";
import { useCityStateAutocomplete } from "@/components/admin/useCityStateAutocomplete";
import { extractQRCodeLink } from "@/components/admin/QRCodeExtractor";
import JobsSummaryClipboard from "@/components/admin/JobsSummaryClipboard";

export default function PostsEmMassa() {
  const { getStateFromCity } = useCityStateAutocomplete();
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
    const files = Array.from(e.target.files).slice(0, 50);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ id: Date.now() + Math.random(), url: file_url, status: 'pending' });
      }
      setImages(prev => [...prev, ...uploaded]);
    } catch (err) {
      alert('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const processImages = async () => {
    setProcessing(true);
    const allJobs = [];
    try {
      for (const img of images) {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));
        
        // Extrair QR Code com função poderosa
        const qrCodeLink = await extractQRCodeLink(img.url);
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `EXTRAIA TODAS AS VAGAS desta imagem com MÁXIMA PRECISÃO:

REGRAS CRÍTICAS para CADA vaga:
1. CIDADE e UF: SEMPRE identifique ambos
   - Recife → city: "Recife", state: "PE"
   - João Pessoa → city: "João Pessoa", state: "PB"
   - São Paulo → city: "São Paulo", state: "SP"
   
2. SALÁRIO: extraia SOMENTE valores numéricos/monetários
   - Correto: "R$ 1.500", "2.000 a 3.000"
   - Deixe VAZIO se não houver valor numérico
   
3. Se vaga for remota: city: "Remoto", state: ""
${qrCodeLink ? `
4. QR CODE LINK DETECTADO: ${qrCodeLink}` : ''}`,
          file_urls: [img.url],
          response_json_schema: {
            type: "object",
            properties: {
              jobs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Cargo da vaga" },
                    company: { type: "string", description: "Nome da empresa" },
                    city: { type: "string", description: "Cidade (ou 'Remoto')" },
                    state: { type: "string", description: "UF de 2 letras" },
                    salary_range: { type: "string", description: "APENAS valor monetário" },
                    contact_phone: { type: "string" },
                    application_link: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        // Aplicar link do QR Code se não houver link nas vagas
        (result.jobs || []).forEach(job => {
          if (qrCodeLink && !job.application_link) {
            job.application_link = qrCodeLink;
          }
        });

        (result.jobs || []).forEach(job => {
          // Fallback: auto-completar estado se não veio da IA
          const autoState = (job.city && !job.state) ? getStateFromCity(job.city) : null;
          
          // VALIDAÇÃO: marcar status baseado em contato
          const hasContact = job.application_link && job.application_link.trim() !== '';
          
          allJobs.push({
            ...job,
            state: job.state || autoState || '',
            image_url: img.url,
            status: hasContact ? 'published' : 'pending_contact'
          });
        });

        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'completed', count: result.jobs?.length || 0 } : i));
      }
      setExtractedJobs(allJobs);
      setStep(2);
    } catch (err) {
      alert('Erro ao processar');
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
        // Criar vagas em paralelo (máximo 5 por vez para não sobrecarregar)
        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < jobsToCreate.length; i += batchSize) {
          batches.push(jobsToCreate.slice(i, i + batchSize));
        }

        const createdJobIds = [];
        for (const batch of batches) {
          const results = await Promise.all(
            batch.map(job => base44.entities.Job.create(job))
          );
          createdJobIds.push(...results.map(r => r.id));
        }
        
        // Notificações em background (não bloquear)
        if (wizardData.notification && createdJobIds.length > 0) {
          base44.entities.User.list().then(users => {
            const targetUsers = wizardData.notification.premiumOnly 
              ? users.filter(u => u.subscription_type === 'premium' || u.role === 'admin').map(u => u.email)
              : users.map(u => u.email);

            base44.functions.invoke('sendNotifications', {
              notification: wizardData.notification,
              jobIds: createdJobIds, // Array de IDs
              templateId: wizardData.notification.templateId,
              targetUsers
            }).catch(() => {});
          }).catch(() => {});
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
                  <Badge variant="outline">{images.length}/50</Badge>
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
                    disabled={uploading || images.length >= 50}
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
                    <p className="text-slate-400 text-sm">Até 50 imagens</p>
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