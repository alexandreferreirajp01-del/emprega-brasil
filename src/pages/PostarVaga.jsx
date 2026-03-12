import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Loader2, X, CheckCircle, Search, ArrowRight, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import UnifiedPostWizard from "@/components/admin/UnifiedPostWizard";
import { useCityStateAutocomplete } from "@/components/admin/useCityStateAutocomplete";
import { extractQRCodeLink } from "@/components/admin/QRCodeExtractor";
import JobsSummaryClipboard from "@/components/admin/JobsSummaryClipboard";

export default function PostarVaga() {
  const [step, setStep] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedJobs, setPublishedJobs] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    job_function: '',
    state: '',
    city: '',
    description: '',
    salary_range: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    image_url: ''
  });

  const [funcSearch, setFuncSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  // Hook de auto-complete
  const { availableStates, getCitiesForState, getStateFromCity } = useCityStateAutocomplete();

  // Buscar categorias profissionais
  const { data: categories = [] } = useQuery({
    queryKey: ['professional-categories'],
    queryFn: () => base44.entities.ProfessionalCategory.list('category_order', 100),
  });

  // Extrair todos os cargos
  const allJobFunctions = React.useMemo(() => {
    const functions = new Set();
    categories.forEach(cat => {
      cat.job_titles?.forEach(title => functions.add(title));
    });
    return Array.from(functions).sort();
  }, [categories]);

  useEffect(() => {
    const init = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('Splash');
          return;
        }
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
        window.location.href = createPageUrl('Home');
      }
    };
    init();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      
      // Extrair QR Code com função poderosa
      const qrCodeLink = await extractQRCodeLink(file_url);
      
      // Extrair dados com IA
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `🔍 ANÁLISE COMPLETA - EXTRAIA TODAS AS INFORMAÇÕES:

📍 LOCALIZAÇÃO (não perca nada):
   - Cidade completa
   - Estado (UF com 2 letras)
   - Bairro (se mencionado)
   - Endereço completo (rua, número, CEP)
   
📞 CONTATOS (EXTRAIR TODOS):
   - Telefone fixo
   - Celular/WhatsApp (TODOS os números)
   - Email (TODOS os emails)
   - Instagram (@usuario ou link)
   - Facebook, LinkedIn
   - Site da empresa
   - Link de formulário${qrCodeLink ? `
   - QR CODE DETECTADO: ${qrCodeLink}` : ''}

💰 SALÁRIO (apenas valores numéricos):
   - Válido: "R$ 1.500", "2.000 a 3.000"
   - Ignore: "a combinar", "compatível"

EXTRAIA TUDO:`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título/cargo da vaga" },
            company: { type: "string", description: "Nome da empresa" },
            job_function: { type: "string", description: "Função/cargo específico" },
            city: { type: "string", description: "Nome completo da cidade" },
            state: { type: "string", description: "UF do estado (2 letras maiúsculas)" },
            description: { type: "string", description: "Descrição completa, requisitos, benefícios" },
            salary_range: { type: "string", description: "APENAS valor monetário ou faixa salarial" },
            contact_phone: { type: "string", description: "Telefone para contato" },
            contact_email: { type: "string", description: "Email para contato" },
            website: { type: "string", description: "Link de inscrição ou site" }
          }
        }
      });
      
      // Priorizar link do QR Code
      if (qrCodeLink && !result.website) {
        result.website = qrCodeLink;
      }
      
      if (result) {
        // Classificar categoria automaticamente
        let categoryData = null;
        try {
          categoryData = await base44.functions.invoke('classifyJobCategory', {
            title: result.title || '',
            description: result.description || ''
          });
        } catch (e) {
          console.error('Erro ao classificar categoria:', e);
        }

        // Priorizar estado extraído, senão auto-completar
        const finalState = result.state || (result.city ? getStateFromCity(result.city) : '');

        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          company: result.company || prev.company,
          job_function: result.job_function || prev.job_function,
          state: finalState || prev.state,
          city: result.city || prev.city,
          description: result.description || prev.description,
          salary_range: result.salary_range || prev.salary_range,
          contact_phone: result.contact_phone || prev.contact_phone,
          contact_email: result.contact_email || prev.contact_email,
          website: result.website || prev.website,
          category: categoryData?.data?.category || prev.category,
        }));
      }
    } catch (err) {
      alert('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (!formData.title) {
      alert('Título é obrigatório');
      return;
    }
    setStep(2);
  };

  const handlePublish = async (wizardData) => {
    setPublishing(true);
    try {
      const jobData = wizardData.jobs[0];
      
      let applicationLink = '';
      if (formData.website) {
        applicationLink = formData.website.startsWith('http') ? formData.website : `https://${formData.website}`;
      } else if (formData.contact_phone) {
        let phone = formData.contact_phone.replace(/\D/g, '');
        if (!phone.startsWith('55')) phone = '55' + phone;
        applicationLink = `https://wa.me/${phone}`;
      } else if (formData.contact_email) {
        applicationLink = `mailto:${formData.contact_email}`;
      }

      // VALIDAÇÃO: Se não houver contato, marcar como pendente
      const hasContact = applicationLink && applicationLink.trim() !== '';
      if (!hasContact) {
        alert('⚠️ ATENÇÃO: Esta vaga não tem informação de contato e será enviada para PENDÊNCIAS. Adicione telefone, email ou site para publicar.');
      }

      const finalJobData = {
        ...jobData,
        title: formData.title,
        company: formData.company,
        job_function: formData.job_function,
        city: formData.city || 'Não informado',
        description: formData.description,
        salary_range: formData.salary_range,
        image_url: formData.image_url,
        application_link: applicationLink,
        status: hasContact ? 'published' : 'pending_contact'
      };

      if (wizardData.schedule) {
        await base44.entities.ScheduledPost.create({
          post_type: 'job',
          scheduled_date: new Date(`${wizardData.schedule.date}T${wizardData.schedule.time}`).toISOString(),
          job_data: finalJobData,
          notification_data: wizardData.notification || {},
          status: 'pending'
        });
        alert('Vaga agendada com sucesso!');
      } else {
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        
        if (!isAdmin) {
          await base44.entities.RecruiterRequest.create({
            recruiter_email: currentUser.email,
            recruiter_name: currentUser.full_name,
            request_type: 'job',
            title: formData.title,
            full_content: finalJobData,
            status: 'pending'
          });
          alert('Vaga enviada para aprovação!');
        } else {
          const createdJob = await base44.entities.Job.create(finalJobData);
          
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
          
          setPublishedJobs([finalJobData]);
          alert('Vaga publicada com sucesso!');
        }
      }
      
      if (!publishedJobs) {
        setFormData({
          title: '', company: '', job_function: '', city: '', description: '',
          salary_range: '', contact_phone: '', contact_email: '', website: '', image_url: ''
        });
        setStep(1);
      }
    } catch (err) {
      alert('Erro ao publicar: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2 h-9">
              ← Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Postar Vaga</h1>
              <p className="text-white/70 text-sm">Carregue imagem ou preencha manualmente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <div className="space-y-4">
            {/* Upload */}
            <Card className="rounded-xl">
              <CardContent className="p-6 text-center">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  id="image-upload"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Button 
                    type="button" 
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl pointer-events-none"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando...</>
                    ) : (
                      <><Camera className="w-5 h-5 mr-2" />Carregar Imagem</>
                    )}
                  </Button>
                </label>
              </CardContent>
            </Card>

            {formData.image_url && (
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <div className="relative">
                    <img src={formData.image_url} alt="Vaga" className="w-full max-h-48 object-contain rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full h-8 w-8"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Dados da Vaga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm">Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Vendedor"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm">Empresa</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Ex: Empresa XYZ"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm">Função</Label>
                  <Select value={formData.job_function} onValueChange={(v) => setFormData(prev => ({ ...prev, job_function: v }))}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-white">
                        <Input
                          placeholder="Buscar..."
                          value={funcSearch}
                          onChange={(e) => setFuncSearch(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <ScrollArea className="h-[200px]">
                        {allJobFunctions.filter(f => f.toLowerCase().includes(funcSearch.toLowerCase())).map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Estado (UF)</Label>
                    <Select value={formData.state} onValueChange={(v) => {
                      setFormData(prev => ({ ...prev, state: v, city: '' }));
                    }}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {availableStates.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Cidade</Label>
                    <Select value={formData.city} onValueChange={(v) => {
                      const autoState = getStateFromCity(v);
                      setFormData(prev => ({ 
                        ...prev, 
                        city: v,
                        state: autoState || prev.state 
                      }));
                    }}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Cidade" /></SelectTrigger>
                      <SelectContent>
                        <div className="p-2 sticky top-0 bg-white">
                          <Input
                            placeholder="Buscar..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <ScrollArea className="h-[200px]">
                          {getCitiesForState(formData.state).filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Requisitos, benefícios..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="text-sm">Salário</Label>
                  <Input
                    value={formData.salary_range}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                    placeholder="Ex: R$ 1.500"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Telefone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="83999999999"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Email</Label>
                    <Input
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Site</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                    className="h-11"
                  />
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={!formData.title}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl mt-4"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <UnifiedPostWizard
            jobsData={[formData]}
            onPublish={handlePublish}
            onSchedule={handlePublish}
            isLoading={publishing}
          />
        )}
      </div>
    </div>
  );
}