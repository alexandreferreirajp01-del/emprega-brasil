import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, Save, X, CheckCircle, Phone, Mail, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const JOB_FUNCTIONS = [
  "Assistente administrativo", "Auxiliar administrativo", "Recepcionista",
  "Vendedor interno", "Vendedor externo", "Consultor comercial",
  "Social media", "Designer gráfico", "Programador", "Suporte técnico",
  "Enfermeiro", "Técnico de enfermagem", "Farmacêutico",
  "Cozinheiro", "Garçom", "Atendente", "Professor", "Motorista", "Motoboy",
  "Estoquista", "Auxiliar de serviços gerais", "Porteiro", "Segurança", "Outros"
];

export default function PostarVaga() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cities, setCities] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    job_function: '',
    city: '',
    description: '',
    salary_range: '',
    contact_phone: '',
    contact_email: '',
    image_url: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Verificar autenticação
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('Splash');
          return;
        }

        // Verificar se é admin
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                        user.role === 'admin' || 
                        user.subscription_type === 'admin';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }

        setIsAuthorized(true);

        // Carregar cidades
        const citiesData = await base44.entities.City.list('name', 200);
        setCities(citiesData || []);
      } catch (e) {
        console.error('Erro:', e);
        window.location.href = createPageUrl('Home');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      if (uploadResult?.file_url) {
        updateField('image_url', uploadResult.file_url);
        
        // Tentar extrair dados com IA
        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Analise esta imagem de vaga de emprego e extraia: título, função, cidade, descrição, salário, telefone e email. Retorne dados encontrados, string vazia se não encontrar.`,
            file_urls: [uploadResult.file_url],
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                job_function: { type: "string" },
                city: { type: "string" },
                description: { type: "string" },
                salary_range: { type: "string" },
                contact_phone: { type: "string" },
                contact_email: { type: "string" }
              }
            }
          });

          if (result && typeof result === 'object') {
            setFormData(prev => ({
              ...prev,
              title: result.title || prev.title,
              job_function: result.job_function || prev.job_function,
              city: result.city || prev.city,
              description: result.description || prev.description,
              salary_range: result.salary_range || prev.salary_range,
              contact_phone: (result.contact_phone || '').replace(/\D/g, '') || prev.contact_phone,
              contact_email: result.contact_email || prev.contact_email,
              image_url: uploadResult.file_url
            }));
            showToast('Dados extraídos!');
          }
        } catch (err) {
          console.log('IA não disponível, preencha manualmente');
        }
      }
    } catch (err) {
      showToast('Erro no upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    
    setSubmitting(true);

    try {
      let description = formData.description || '';
      if (formData.contact_phone || formData.contact_email) {
        description += '\n\n--- CONTATO ---';
        if (formData.contact_phone) description += `\nWhatsApp: ${formData.contact_phone}`;
        if (formData.contact_email) description += `\nEmail: ${formData.contact_email}`;
      }

      await base44.entities.Job.create({
        title: formData.title,
        job_function: formData.job_function,
        city: formData.city,
        salary_range: formData.salary_range,
        image_url: formData.image_url,
        description: description,
        application_link: formData.contact_phone 
          ? `https://wa.me/${formData.contact_phone.replace(/\D/g, '')}` 
          : formData.contact_email 
            ? `mailto:${formData.contact_email}` 
            : ''
      });

      setFormData({
        title: '', job_function: '', city: '', description: '',
        salary_range: '', contact_phone: '', contact_email: '', image_url: ''
      });
      showToast('Vaga publicada!');
    } catch (err) {
      showToast('Erro ao publicar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Postar Vaga</h1>
          </div>
          <p className="text-white/70">Carregue imagem ou preencha manualmente</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Upload */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <label className="cursor-pointer inline-block">
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <Button 
                type="button" 
                className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl pointer-events-none"
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
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <img src={formData.image_url} alt="Vaga" className="w-full max-h-48 object-contain rounded-lg" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full h-8 w-8"
                  onClick={() => updateField('image_url', '')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados da Vaga</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Ex: Vendedor"
                  required
                />
              </div>

              <div>
                <Label>Função</Label>
                <Select value={formData.job_function} onValueChange={(v) => updateField('job_function', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {JOB_FUNCTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cidade</Label>
                <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Requisitos, benefícios..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label>Salário</Label>
                <Input
                  value={formData.salary_range}
                  onChange={(e) => updateField('salary_range', e.target.value)}
                  placeholder="Ex: R$ 1.500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone/WhatsApp</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                    placeholder="83999999999"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              {(formData.contact_phone || formData.contact_email) && (
                <div className="flex flex-wrap gap-2">
                  {formData.contact_phone && (
                    <a 
                      href={`https://wa.me/${formData.contact_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                    >
                      <Phone className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                  {formData.contact_email && (
                    <a 
                      href={`mailto:${formData.contact_email}`}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
                    >
                      <Mail className="w-3 h-3" /> Email
                    </a>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#0056ff] hover:bg-[#0044cc] h-12"
                disabled={submitting || !formData.title}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Publicar Vaga
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}