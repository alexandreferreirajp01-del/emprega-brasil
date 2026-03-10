import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Wand2, Copy, ArrowRight, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import UnifiedPostWizard from "@/components/admin/UnifiedPostWizard";
import { useCityStateAutocomplete } from "@/components/admin/useCityStateAutocomplete";
import { extractQRCodeLink } from "@/components/admin/QRCodeExtractor";

export default function VagasPorIA() {
  const { getStateFromCity } = useCityStateAutocomplete();
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [step, setStep] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
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

  const extractWithAI = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    try {
      // Extrair QR Code se houver imagem
      let qrCodeLink = null;
      if (imageUrl) {
        qrCodeLink = await extractQRCodeLink(imageUrl);
      }
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `🔍 EXTRAÇÃO COMPLETA E DETALHADA - NÃO OMITA NADA:

📍 LOCALIZAÇÃO:
   - Cidade completa (ex: "João Pessoa", "Campina Grande")
   - Estado UF (2 letras: PB, PE, SP, RJ)
   - Bairro (se mencionar)
   - Endereço (se houver rua/número)
   - Se não houver localidade informada: deixe city vazio ("")
   
📞 CONTATOS (EXTRAIR ABSOLUTAMENTE TODOS):
   - Telefones (fixo e celular)
   - WhatsApp (pode ser diferente do celular)
   - Emails (TODOS)
   - Instagram, Facebook, LinkedIn
   - Site, formulário, links${qrCodeLink ? `
   - QR CODE: ${qrCodeLink}` : ''}

💰 SALÁRIO (apenas números):
   - Válido: "R$ 1.500", "2k a 3k"
   - Ignore: "a combinar"

📋 TEXTO COMPLETO:
${rawText}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título do cargo" },
            company: { type: "string", description: "Nome da empresa" },
            job_function: { type: "string", description: "Função específica" },
            city: { type: "string", description: "Nome da cidade (ou 'Remoto')" },
            state: { type: "string", description: "UF de 2 letras maiúsculas" },
            description: { type: "string", description: "Descrição completa" },
            salary_range: { type: "string", description: "APENAS valor monetário" },
            contact_phone: { type: "string", description: "Telefone de contato" },
            application_link: { type: "string", description: "Link de inscrição" }
          }
        }
      });
      
      // Fallback: auto-completar estado se não veio da IA
      if (result.city && !result.state) {
        const autoState = getStateFromCity(result.city);
        result.state = autoState || '';
      }
      
      // Priorizar link do QR Code
      if (qrCodeLink && !result.application_link) {
        result.application_link = qrCodeLink;
      }
      
      // VALIDAÇÃO: marcar status baseado em contato
      const hasContact = result.application_link && result.application_link.trim() !== '';
      result.status = hasContact ? 'published' : 'pending_contact';
      
      setExtractedData(result);
      setStep(2);
    } catch (err) {
      alert('Erro ao extrair dados');
    } finally {
      setExtracting(false);
    }
  };

  const handlePublish = async (wizardData) => {
    setPublishing(true);
    try {
      const jobData = {
        ...extractedData,
        ...wizardData.jobs[0],
        city: wizardData.jobs[0].city || extractedData.city || 'Não informado'
      };

      if (wizardData.schedule) {
        await base44.entities.ScheduledPost.create({
          post_type: 'job_ai',
          scheduled_date: new Date(`${wizardData.schedule.date}T${wizardData.schedule.time}`).toISOString(),
          job_data: jobData,
          notification_data: wizardData.notification || {},
          status: 'pending'
        });
        alert('Vaga agendada!');
      } else {
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        
        if (!isAdmin) {
          await base44.entities.RecruiterRequest.create({
            recruiter_email: currentUser.email,
            recruiter_name: currentUser.full_name,
            request_type: 'job_ai',
            title: extractedData.title,
            full_content: jobData,
            status: 'pending'
          });
          alert('Vaga enviada para aprovação!');
        } else {
          const createdJob = await base44.entities.Job.create(jobData);
          
          if (wizardData.notification) {
            base44.entities.User.list().then(users => {
              const targetUsers = wizardData.notification.premiumOnly 
                ? users.filter(u => u.subscription_type === 'premium' || u.role === 'admin').map(u => u.email)
                : users.map(u => u.email);

              base44.functions.invoke('sendNotifications', {
                notification: wizardData.notification,
                jobId: createdJob.id,
                targetUsers
              }).catch(() => {});
            }).catch(() => {});
          }
          
          alert('Vaga publicada!');
        }
      }
      
      setRawText('');
      setExtractedData(null);
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2 h-9">← Voltar</Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas por IA</h1>
              <p className="text-white/70 text-sm">Cole o texto e a IA extrai os dados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Copy className="w-5 h-5 text-purple-600" />
                Texto da Vaga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Imagem da Vaga (opcional, para detectar QR Code)</Label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="ia-image"
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
                <label htmlFor="ia-image">
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
                <Label className="text-sm text-slate-600 mb-2 block">Cole o texto completo da vaga</Label>
                <Textarea
                  placeholder="Ex: VAGA: Vendedor&#10;Empresa XYZ contratando...&#10;Salário: R$ 1.500&#10;WhatsApp: (83) 99999-9999"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-slate-400 mt-1">{rawText.length}/5000</p>
              </div>

              <Button
                onClick={extractWithAI}
                disabled={!rawText.trim() || extracting}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl"
              >
                {extracting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Extraindo...</>
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2" />Gerar com IA</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && extractedData && (
          <UnifiedPostWizard
            jobsData={[extractedData]}
            onPublish={handlePublish}
            onSchedule={handlePublish}
            isLoading={publishing}
          />
        )}
      </div>
    </div>
  );
}