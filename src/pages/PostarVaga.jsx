import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Camera, Loader2, Save, X, CheckCircle, Sparkles, Phone, Mail, MapPin, Briefcase
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";

const JOB_FUNCTIONS = [
  "Assistente administrativo", "Auxiliar administrativo", "Secretária executiva", "Recepcionista",
  "Atendente de escritório", "Office boy / Office girl", "Analista administrativo", "Contador",
  "Auxiliar contábil", "Analista financeiro", "Vendedor interno", "Vendedor externo",
  "Consultor comercial", "Promotor de vendas", "Gerente de vendas", "Social media",
  "Designer gráfico", "Copywriter", "Editor de vídeo", "Fotógrafo", "Programador front-end",
  "Programador back-end", "Desenvolvedor mobile", "Suporte técnico", "Técnico de informática",
  "Enfermeiro", "Técnico de enfermagem", "Farmacêutico", "Nutricionista", "Fisioterapeuta",
  "Psicólogo", "Cuidador de idosos", "Pedreiro", "Eletricista", "Pintor", "Motorista de aplicativo",
  "Motoboy", "Entregador", "Estoquista", "Auxiliar de serviços gerais", "Porteiro", "Segurança",
  "Cozinheiro", "Auxiliar de cozinha", "Garçom", "Atendente de lanchonete", "Professor",
  "Cabeleireiro", "Barbeiro", "Manicure", "Personal trainer", "Advogado", "Recrutador",
  "Analista de RH", "Operador de máquinas", "Soldador", "Agricultor", "Veterinário",
  "Assistente virtual", "Freelancer de design", "Mecânico", "Corretor de imóveis", "Outros"
];

export default function PostarVaga() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [funcFilter, setFuncFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  
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

  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      try {
        return await base44.entities.City.list('name', 500) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setFormData({
        title: '',
        job_function: '',
        city: '',
        description: '',
        salary_range: '',
        contact_phone: '',
        contact_email: '',
        image_url: ''
      });
      showToast('Vaga publicada com sucesso!');
    },
    onError: () => showToast('Erro ao publicar vaga', 'error')
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setProgress('Enviando imagem...');

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult?.file_url;

      if (!fileUrl) {
        showToast('Erro no upload', 'error');
        setUploading(false);
        setProgress('');
        return;
      }

      updateField('image_url', fileUrl);
      setProgress('Analisando com IA...');

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise esta imagem de vaga de emprego brasileira e extraia TODAS as informações.

EXTRAIA COM PRECISÃO:

1. TÍTULO: O cargo/título da vaga (ex: Vendedor, Auxiliar Administrativo)

2. FUNÇÃO: Categoria do trabalho (Vendedor, Administrativo, Atendente, etc)

3. CIDADE/LOCALIDADE: Identifique a cidade. Se mencionar bairro:
   - Mangabeira, Manaíra, Tambaú, Bancários, Cristo = João Pessoa
   - Intermares, Camboinha = Cabedelo
   - Catolé, Bodocongó = Campina Grande

4. DESCRIÇÃO E REQUISITOS: Transcreva TUDO:
   - Requisitos obrigatórios e desejáveis
   - Benefícios oferecidos
   - Horário de trabalho
   - Qualquer outra informação

5. SALÁRIO: Valor ou faixa salarial mencionada

6. TELEFONE/WHATSAPP: Extraia números de contato com DDD (formato: 83999999999)

7. EMAIL: Extraia endereços de email se houver

Retorne os dados encontrados. Se não encontrar algum campo, retorne string vazia.`,
          file_urls: [fileUrl],
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
          // Encontrar cidade na lista
          const foundCity = cities.find(c => 
            c.name?.toLowerCase() === (result.city || '').toLowerCase()
          );

          // Limpar telefone
          let phone = (result.contact_phone || '').replace(/\D/g, '');
          if (phone.length === 11 && !phone.startsWith('55')) {
            phone = '55' + phone;
          }

          setFormData(prev => ({
            ...prev,
            title: result.title || prev.title,
            job_function: result.job_function || prev.job_function,
            city: foundCity?.name || prev.city,
            description: result.description || prev.description,
            salary_range: result.salary_range || prev.salary_range,
            contact_phone: phone || prev.contact_phone,
            contact_email: result.contact_email || prev.contact_email,
            image_url: fileUrl
          }));

          setProgress('Dados extraídos!');
          showToast('Dados extraídos! Revise as informações.');
        } else {
          showToast('Imagem carregada. Preencha manualmente.');
        }
      } catch (err) {
        console.error('Erro extração:', err);
        showToast('Imagem carregada. Preencha manualmente.');
      }
    } catch (err) {
      console.error('Erro upload:', err);
      showToast('Erro ao enviar imagem', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(''), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Preparar dados para salvar
    const jobData = {
      title: formData.title,
      job_function: formData.job_function,
      city: formData.city,
      salary_range: formData.salary_range,
      image_url: formData.image_url,
      description: formData.description
    };

    // Adicionar contatos na descrição se existirem
    let fullDescription = formData.description || '';
    if (formData.contact_phone || formData.contact_email) {
      fullDescription += '\n\n--- CONTATO ---';
      if (formData.contact_phone) {
        fullDescription += `\nWhatsApp: ${formData.contact_phone}`;
      }
      if (formData.contact_email) {
        fullDescription += `\nEmail: ${formData.contact_email}`;
      }
    }
    jobData.description = fullDescription;

    // Adicionar link de candidatura
    if (formData.contact_phone) {
      jobData.application_link = `https://wa.me/${formData.contact_phone.replace(/\D/g, '')}`;
    } else if (formData.contact_email) {
      jobData.application_link = `mailto:${formData.contact_email}`;
    }

    createJobMutation.mutate(jobData);
  };

  const filteredCities = cities.filter(c => 
    c.name?.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const filteredFuncs = JOB_FUNCTIONS.filter(f => 
    f.toLowerCase().includes(funcFilter.toLowerCase())
  );

  const copyEmail = () => {
    if (formData.contact_email) {
      navigator.clipboard.writeText(formData.contact_email);
      showToast('Email copiado!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-[#0056ff]'
        } text-white`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Postar Vaga</h1>
          </div>
          <p className="text-white/70">Carregue uma imagem e a IA extrai os dados automaticamente</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Upload com IA */}
        <Card className="mb-6 border-2 border-dashed border-[#0056ff]/30 bg-gradient-to-br from-[#0056ff]/5 to-transparent">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0056ff]/10 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-[#0056ff]" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Extração Inteligente com IA</h3>
            <p className="text-sm text-slate-600 mb-4">
              Tire uma foto ou escolha da galeria - a IA preenche tudo automaticamente
            </p>
            
            <label className="cursor-pointer inline-block">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <Button 
                type="button" 
                size="lg"
                className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl pointer-events-none"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {progress || 'Processando...'}
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Carregar Imagem da Vaga
                  </>
                )}
              </Button>
            </label>
            
            {progress && progress.includes('extraídos') && (
              <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{progress}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview da imagem */}
        {formData.image_url && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <img 
                  src={formData.image_url} 
                  alt="Vaga" 
                  className="w-full max-h-64 object-contain rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={() => updateField('image_url', '')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Vaga</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título da Vaga *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Ex: Vendedor, Auxiliar Administrativo"
                  className="rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={formData.job_function} onValueChange={(v) => updateField('job_function', v)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar função..."
                        value={funcFilter}
                        onChange={(e) => setFuncFilter(e.target.value)}
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <ScrollArea className="h-48">
                      {filteredFuncs.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Localidade</Label>
                <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar cidade..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <ScrollArea className="h-48">
                      {filteredCities.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição e Requisitos</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Requisitos, benefícios, horário de trabalho..."
                  className="rounded-lg min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Pretensão Salarial</Label>
                <Input
                  value={formData.salary_range}
                  onChange={(e) => updateField('salary_range', e.target.value)}
                  placeholder="Ex: R$ 1.500 - R$ 2.000"
                  className="rounded-lg"
                />
              </div>

              {/* Contatos extraídos */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-semibold mb-3 block">Contatos Identificados</Label>
                
                {formData.contact_phone && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-3">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span className="flex-1 font-medium">{formData.contact_phone}</span>
                    <a 
                      href={`https://wa.me/${formData.contact_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Abrir WhatsApp
                    </a>
                  </div>
                )}

                {formData.contact_email && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="flex-1 font-medium">{formData.contact_email}</span>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyEmail}
                      className="mr-2"
                    >
                      Copiar
                    </Button>
                    <a 
                      href={`mailto:${formData.contact_email}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Enviar Email
                    </a>
                  </div>
                )}

                {!formData.contact_phone && !formData.contact_email && (
                  <p className="text-slate-500 text-sm">Nenhum contato identificado na imagem</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12"
                  disabled={createJobMutation.isPending || !formData.title}
                >
                  {createJobMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  Publicar Vaga
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}