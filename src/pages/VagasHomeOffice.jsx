import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Home, Wand2, Copy, ExternalLink, X, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import UnifiedPostWizard from "@/components/admin/UnifiedPostWizard";
import { useCityStateAutocomplete } from "@/components/admin/useCityStateAutocomplete";
import { extractQRCodeLink } from "@/components/admin/QRCodeExtractor";

export default function VagasHomeOffice() {
  const { getStateFromCity } = useCityStateAutocomplete();
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [step, setStep] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.role === 'admin' || user.subscription_type === 'admin';
        const isRecruiter = user.subscription_type === 'recruiter';
        if (!isAdmin && !isRecruiter) {
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

  const extractJobs = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    try {
      // Extrair QR Code se houver imagem
      let qrCodeLink = null;
      if (imageUrl) {
        qrCodeLink = await extractQRCodeLink(imageUrl);
      }
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `EXTRAIA TODAS as vagas HOME OFFICE deste texto:

INSTRUÇÕES:
1. Para cada vaga identifique:
   - Título/cargo
   - Link de inscrição
   - Descrição completa
   - Se mencionar cidade específica: extraia cidade e UF
   
2. IMPORTANTE: se a vaga for 100% remota SEM cidade específica:
   - city: "Home Office"
   - state: ""
   
3. Se mencionar cidade: identifique UF correspondente
   - Ex: "Home Office com suporte em Recife" → city: "Recife", state: "PE"
${qrCodeLink ? `
QR CODE LINK: ${qrCodeLink}` : ''}

TEXTO:
${rawText}`,
        response_json_schema: {
          type: "object",
          properties: {
            vagas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  city: { type: "string", description: "Cidade ou 'Home Office'" },
                  state: { type: "string", description: "UF de 2 letras" },
                  link: { type: "string" },
                  descricao: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      const jobs = (result.vagas || []).map(v => {
        // Priorizar dados da IA, fallback para "Home Office"
        let finalCity = v.city || 'Home Office';
        let finalState = v.state || '';
        
        // Fallback: tentar extrair cidade do título se IA não pegou
        if (!v.city || v.city === 'Home Office') {
          const cityMatch = v.titulo?.match(/\b([A-ZÇÁÉÍÓÚÂÊÔÃÕ][a-zçáéíóúâêôãõ]+(?:\s+[A-ZÇÁÉÍÓÚÂÊÔÃÕ][a-zçáéíóúâêôãõ]+)*)\b/);
          if (cityMatch) {
            const detectedCity = cityMatch[0];
            const detectedState = getStateFromCity(detectedCity);
            if (detectedState) {
              finalCity = detectedCity;
              finalState = detectedState;
            }
          }
        }
        
        // Priorizar link do QR Code se não houver link na vaga
        const finalLink = v.link || qrCodeLink || '';
        
        // VALIDAÇÃO: marcar status baseado em contato
        const hasContact = finalLink && finalLink.trim() !== '';
        
        return {
          title: v.titulo,
          description: v.descricao || `Vaga Home Office - ${v.titulo}`,
          application_link: finalLink,
          job_type: 'Home Office',
          state: finalState,
          city: finalCity || 'Não informado',
          status: hasContact ? 'published' : 'pending_contact'
        };
      });
      
      setExtractedJobs(jobs);
      setStep(2);
    } catch (err) {
      alert('Erro ao extrair');
    } finally {
      setExtracting(false);
    }
  };

  const removeJob = (index) => {
    setExtractedJobs(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async (wizardData) => {
    setPublishing(true);
    try {
      const jobsToCreate = wizardData.jobs;

      if (wizardData.schedule) {
        await base44.entities.ScheduledPost.create({
          post_type: 'job_homeoffice',
          scheduled_date: new Date(`${wizardData.schedule.date}T${wizardData.schedule.time}`).toISOString(),
          job_data: { jobs: jobsToCreate },
          notification_data: wizardData.notification || {},
          status: 'pending'
        });
        alert('Vagas agendadas!');
      } else {
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        
        if (!isAdmin) {
          await base44.entities.RecruiterRequest.create({
            recruiter_email: currentUser.email,
            recruiter_name: currentUser.full_name,
            request_type: 'job_homeoffice',
            title: `${jobsToCreate.length} Vagas Home Office`,
            full_content: { jobs: jobsToCreate },
            status: 'pending'
          });
          alert('Vagas enviadas para aprovação!');
        } else {
          const batchSize = 5;
          const batches = [];
          for (let i = 0; i < jobsToCreate.length; i += batchSize) {
            batches.push(jobsToCreate.slice(i, i + batchSize));
          }

          let firstJobId = null;
          for (const batch of batches) {
            const results = await Promise.all(
              batch.map(job => base44.entities.Job.create(job))
            );
            if (!firstJobId && results[0]) {
              firstJobId = results[0].id;
            }
          }
          
          if (wizardData.notification && firstJobId) {
            base44.entities.User.list().then(users => {
              const targetUsers = wizardData.notification.premiumOnly 
                ? users.filter(u => u.subscription_type === 'premium' || u.role === 'admin').map(u => u.email)
                : users.map(u => u.email);

              base44.functions.invoke('sendNotifications', {
                notification: wizardData.notification,
                jobId: firstJobId,
                targetUsers
              }).catch(() => {});
            }).catch(() => {});
          }
          
          alert(`${jobsToCreate.length} vagas publicadas!`);
        }
      }
      
      setRawText('');
      setExtractedJobs([]);
      setStep(1);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2 h-9">← Voltar</Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Home Office</h1>
              <p className="text-white/70 text-sm">Extraia várias vagas de uma vez</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Copy className="w-5 h-5 text-green-600" />
                Texto das Vagas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Imagem (opcional, para detectar QR Code)</Label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="ho-image"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      try {
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        setImageUrl(file_url);
                      } catch (err) {
                        alert('Erro no upload');
                      }
                    }
                  }}
                />
                <label htmlFor="ho-image">
                  <Button type="button" variant="outline" className="w-full pointer-events-none">
                    <Upload className="w-4 h-4 mr-2" />
                    {imageFile ? imageFile.name : 'Carregar Imagem'}
                  </Button>
                </label>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Cole o texto com as vagas home office</Label>
                <Textarea
                  placeholder="Cole aqui o texto com várias vagas..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-[250px]"
                />
              </div>

              <Button
                onClick={extractJobs}
                disabled={!rawText.trim() || extracting}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-xl"
              >
                {extracting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Extraindo...</>
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2" />Gerar Vagas</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && extractedJobs.length > 0 && (
          <div className="space-y-4">
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {extractedJobs.map((job, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-800">{job.title}</p>
                        <Badge className="bg-green-100 text-green-700 mt-1 text-xs">Home Office</Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeJob(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <UnifiedPostWizard
              jobsData={extractedJobs}
              onPublish={handlePublish}
              onSchedule={handlePublish}
              isLoading={publishing}
            />
          </div>
        )}
      </div>
    </div>
  );
}