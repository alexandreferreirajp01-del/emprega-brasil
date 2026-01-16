import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Sparkles, FileText, X, Zap, Trash2, CheckCircle, ClipboardPaste } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import UnifiedPostWizard from "@/components/admin/UnifiedPostWizard";
import { useCityStateAutocomplete } from "@/components/admin/useCityStateAutocomplete";
import { extractQRCodeLink } from "@/components/admin/QRCodeExtractor";

export default function PostsEmMassaTXT() {
  const { getStateFromCity } = useCityStateAutocomplete();
  const [step, setStep] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

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

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files).slice(0, 50);
    if (uploadedFiles.length === 0) return;
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of uploadedFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ 
          id: Date.now() + Math.random(), 
          url: file_url, 
          name: file.name,
          status: 'pending' 
        });
      }
      setFiles(prev => [...prev, ...uploaded]);
    } catch (err) {
      alert('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const processPastedText = async () => {
    if (!pastedText.trim()) return;
    
    setProcessing(true);
    try {
      // Extrair QR Code se houver imagem
      let qrCodeLink = null;
      if (imageUrl) {
        qrCodeLink = await extractQRCodeLink(imageUrl);
      }
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `🔍 EXTRAÇÃO EM MASSA - ANÁLISE PROFUNDA (até 50 vagas):

Para CADA VAGA extraia TUDO:

📍 LOCALIZAÇÃO COMPLETA:
   - Cidade (nome completo)
   - Estado (UF: PE, PB, SP, etc)
   - Bairro (se mencionar)
   - Endereço (se houver)
   - Se remoto: city: "Remoto", state: ""
   
📞 TODOS OS CONTATOS (não perca nenhum):
   - Telefones (fixo, celular, WhatsApp)
   - Emails (primário e secundário)
   - Instagram, Facebook, LinkedIn
   - Sites, formulários, links${qrCodeLink ? `
   - QR CODE: ${qrCodeLink}` : ''}

💰 SALÁRIO (apenas valores):
   - "R$ 1.500", "2k a 3k"
   - Ignore "a combinar"

📋 DADOS COMPLETOS:
   - Título/cargo
   - Empresa
   - Descrição detalhada
   - Benefícios
   - Requisitos

⚠️ REGRA DE OURO: NÃO OMITA NENHUMA INFORMAÇÃO!

TEXTO COMPLETO:
${pastedText}`,
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

      const extractedJobs = (result.jobs || []).map(job => {
        const autoState = (job.city && !job.state) ? getStateFromCity(job.city) : null;
        
        // Priorizar link do QR Code se não houver link na vaga
        const finalLink = job.application_link || qrCodeLink || '';
        
        // VALIDAÇÃO: marcar status baseado em contato
        const hasContact = finalLink && finalLink.trim() !== '';
        
        return {
          ...job,
          city: job.city || 'Não informado',
          state: job.state || autoState || '',
          application_link: finalLink,
          status: hasContact ? 'published' : 'pending_contact'
        };
      });

      setExtractedJobs(extractedJobs);
      setStep(2);
    } catch (err) {
      alert('Erro ao processar: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processFiles = async () => {
    setProcessing(true);
    const allJobs = [];
    try {
      for (const file of files) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f));
        
        // Buscar o conteúdo do arquivo
        const response = await fetch(file.url);
        const text = await response.text();
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `EXTRAIA TODAS AS VAGAS deste texto com MÁXIMA PRECISÃO (pode ter até 50 vagas):

REGRAS CRÍTICAS para CADA vaga:
1. CIDADE e UF: SEMPRE identifique ambos
   - Recife → city: "Recife", state: "PE"
   - João Pessoa → city: "João Pessoa", state: "PB"
   - São Paulo → city: "São Paulo", state: "SP"
   
2. SALÁRIO: extraia SOMENTE valores numéricos/monetários
   - Correto: "R$ 1.500", "2.000 a 3.000"
   - Deixe VAZIO se não houver valor numérico
   
3. Se vaga for remota: city: "Remoto", state: ""

TEXTO:
${text}`,
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

        (result.jobs || []).forEach(job => {
          // Fallback: auto-completar estado se não veio da IA
          const autoState = (job.city && !job.state) ? getStateFromCity(job.city) : null;
          
          allJobs.push({
            ...job,
            city: job.city || 'Não informado',
            state: job.state || autoState || ''
          });
        });

        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'completed', count: result.jobs?.length || 0 } : f));
      }
      setExtractedJobs(allJobs);
      setStep(2);
    } catch (err) {
      alert('Erro ao processar: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handlePublish = async (wizardData) => {
    setPublishing(true);
    try {
      const jobsToCreate = wizardData.jobs;

      if (wizardData.schedule) {
        await base44.entities.ScheduledPost.create({
          post_type: 'job_mass_txt',
          scheduled_date: new Date(`${wizardData.schedule.date}T${wizardData.schedule.time}`).toISOString(),
          job_data: { jobs: jobsToCreate },
          notification_data: wizardData.notification || {},
          status: 'pending'
        });
        alert('Vagas agendadas!');
      } else {
        // Criar vagas em paralelo (máximo 5 por vez)
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
        
        // Notificações em background
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
      
      setFiles([]);
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
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2 h-9">← Voltar</Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Posts em Massa TXT</h1>
              <p className="text-white/70 text-sm">Upload múltiplos arquivos de texto (até 50 vagas)</p>
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
                    <ClipboardPaste className="w-5 h-5" />
                    Colar Texto Direto
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Imagem (opcional, para detectar QR Code):</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="txt-image"
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
                  <label htmlFor="txt-image">
                    <Button type="button" variant="outline" className="w-full pointer-events-none mb-2">
                      <Upload className="w-4 h-4 mr-2" />
                      {imageFile ? imageFile.name : 'Carregar Imagem'}
                    </Button>
                  </label>
                  {imageUrl && (
                    <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-2" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Cole o texto copiado dos grupos:</label>
                  <Textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Cole aqui o texto com as vagas copiado dos grupos WhatsApp..."
                    className="min-h-[200px] rounded-xl"
                    disabled={processing}
                  />
                  <p className="text-xs text-slate-500">
                    💡 Cole múltiplas vagas de uma vez - a IA vai extrair automaticamente
                  </p>
                </div>

                {pastedText.trim() && (
                  <Button
                    onClick={processPastedText}
                    disabled={processing}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
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

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg">
                    <Upload className="w-5 h-5" />
                    Ou Upload de Arquivos
                  </span>
                  <Badge variant="outline">{files.length}/50</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".txt,.doc,.docx,.pdf"
                    className="hidden"
                    id="mass-txt-upload"
                    onChange={handleFileUpload}
                    disabled={uploading || files.length >= 50}
                  />
                  <label htmlFor="mass-txt-upload" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    ) : (
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    )}
                    <p className="text-slate-600 font-medium mb-1">
                      {uploading ? 'Carregando...' : 'Clique para selecionar'}
                    </p>
                    <p className="text-slate-400 text-sm">TXT, DOC, DOCX, PDF - Até 50 arquivos</p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                        <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          {file.status === 'completed' && file.count > 0 && (
                            <p className="text-xs text-green-600">{file.count} vagas extraídas</p>
                          )}
                        </div>
                        {file.status === 'processing' && (
                          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        )}
                        {file.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {file.status === 'pending' && (
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeFile(file.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <Button
                    onClick={processFiles}
                    disabled={processing}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
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