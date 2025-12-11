import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Loader2, X, Home, ArrowRight, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import UnifiedPostWizard from "@/components/admin/UnifiedPostWizard";

export default function VagasHomeOffice() {
  const [step, setStep] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    job_function: '',
    city: 'Home Office',
    description: '',
    salary_range: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    image_url: '',
    job_type: 'Home Office'
  });

  const [funcSearch, setFuncSearch] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['professional-categories'],
    queryFn: () => base44.entities.ProfessionalCategory.list('category_order', 100),
  });

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta vaga HOME OFFICE e extraia: título, empresa, função, descrição, salário, telefone, email, site.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            company: { type: "string" },
            job_function: { type: "string" },
            description: { type: "string" },
            salary_range: { type: "string" },
            contact_phone: { type: "string" },
            contact_email: { type: "string" },
            website: { type: "string" }
          }
        }
      });
      
      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          company: result.company || prev.company,
          job_function: result.job_function || prev.job_function,
          description: result.description || prev.description,
          salary_range: result.salary_range || prev.salary_range,
          contact_phone: result.contact_phone || prev.contact_phone,
          contact_email: result.contact_email || prev.contact_email,
          website: result.website || prev.website,
        }));
      }
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
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

      const finalJobData = {
        ...jobData,
        title: formData.title,
        company: formData.company,
        job_function: formData.job_function,
        city: 'Home Office',
        job_type: 'Home Office',
        description: formData.description,
        salary_range: formData.salary_range,
        image_url: formData.image_url,
        application_link: applicationLink
      };

      if (wizardData.schedule) {
        await base44.entities.ScheduledPost.create({
          post_type: 'job_homeoffice',
          scheduled_date: new Date(`${wizardData.schedule.date}T${wizardData.schedule.time}`).toISOString(),
          job_data: finalJobData,
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
            request_type: 'job_homeoffice',
            title: formData.title,
            full_content: finalJobData,
            status: 'pending'
          });
          alert('Vaga enviada para aprovação!');
        } else {
          const createdJob = await base44.entities.Job.create(finalJobData);
          
          if (wizardData.notification) {
            const users = await base44.entities.User.list();
            const targetUsers = wizardData.notification.premiumOnly 
              ? users.filter(u => u.subscription_type === 'premium' || u.role === 'admin').map(u => u.email)
              : users.map(u => u.email);

            await base44.functions.invoke('sendNotifications', {
              notification: wizardData.notification,
              jobId: createdJob.id,
              targetUsers
            });
          }
          
          alert('Vaga Home Office publicada!');
        }
      }
      
      setFormData({
        title: '', company: '', job_function: '', city: 'Home Office', description: '',
        salary_range: '', contact_phone: '', contact_email: '', website: '', image_url: '', job_type: 'Home Office'
      });
      setStep(1);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">← Voltar</Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Home Office</h1>
              <p className="text-white/70 text-sm">Publicar vagas remotas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <div className="space-y-4">
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
                    className="bg-green-600 hover:bg-green-700 rounded-xl pointer-events-none"
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
                  <img src={formData.image_url} alt="Vaga" className="w-full max-h-48 object-contain rounded-lg" />
                </CardContent>
              </Card>
            )}

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  Dados da Vaga Home Office
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Desenvolvedor Full Stack - Remoto"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label>Empresa</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome da empresa"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label>Função</Label>
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

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Requisitos, benefícios, tecnologias..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>Salário</Label>
                  <Input
                    value={formData.salary_range}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                    placeholder="Ex: R$ 3.000 - R$ 5.000"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="83999999999"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label>Site</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                    className="h-11"
                  />
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.title}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl"
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
            onPublish={async (wizardData) => {
              setPublishing(true);
              try {
                const jobData = { ...formData, ...wizardData.jobs[0], job_type: 'Home Office', city: 'Home Office' };
                
                const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
                
                if (!isAdmin) {
                  await base44.entities.RecruiterRequest.create({
                    recruiter_email: currentUser.email,
                    recruiter_name: currentUser.full_name,
                    request_type: 'job_homeoffice',
                    title: formData.title,
                    full_content: jobData,
                    status: 'pending'
                  });
                  alert('Vaga enviada para aprovação!');
                } else {
                  await base44.entities.Job.create(jobData);
                  alert('Vaga publicada!');
                }
                
                setStep(1);
                setFormData({
                  title: '', company: '', job_function: '', city: 'Home Office', 
                  description: '', salary_range: '', contact_phone: '', contact_email: '', 
                  website: '', image_url: '', job_type: 'Home Office'
                });
              } catch (err) {
                alert('Erro: ' + err.message);
              } finally {
                setPublishing(false);
              }
            }}
            isLoading={publishing}
          />
        )}
      </div>
    </div>
  );
}