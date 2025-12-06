import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Camera, Loader2, Save, X, CheckCircle, Phone, Mail, Briefcase, Search, Crown, Star, Globe, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import NotificationTemplateSelector from "@/components/admin/NotificationTemplateSelector";
import AdvancedScheduler from "@/components/admin/AdvancedScheduler";

// Função para enviar notificações ao criar vaga (email + push para TODOS)
const sendJobNotification = async (jobId, jobTitle, jobCompany, isHomeOffice = false) => {
  try {
    const result = await base44.functions.invoke('notifyNewJob', {
      jobId,
      jobTitle,
      jobCompany,
      isHomeOffice
    });
    console.log('Notificações enviadas:', result?.data);
  } catch (e) {
    console.error('Erro ao enviar notificações:', e);
  }
};

const JOB_FUNCTIONS = [
  "Auxiliar de cozinha", "ASG", "Auxiliar administrativo", "Analista administrativo",
  "Analista de compras", "Analista de logística", "Analista de marketing",
  "Analista de recursos humanos", "Analista de sistemas", "Atendente de balcão",
  "Atendente de call center", "Auxiliar de limpeza", "Auxiliar de manutenção",
  "Auxiliar de mecânico", "Auxiliar de produção", "Bibliotecário", "Biomédico",
  "Bombeiro", "Cabeleireiro", "Caixa de supermercado", "Carpinteiro",
  "Consultor de vendas", "Coordenador administrativo", "Coordenador de produção",
  "Coordenador de recursos humanos", "Cozinheiro", "Designer gráfico",
  "Desenvolvedor de software", "Digitador", "Eletricista", "Engenheiro civil",
  "Engenheiro de produção", "Engenheiro eletricista", "Engenheiro mecânico",
  "Farmacêutico", "Fisioterapeuta", "Garçom", "Jardineiro", "Jornalista",
  "Motorista", "Nutricionista", "Operador de caixa", "Operador de máquinas",
  "Pedreiro", "Pintor", "Professor", "Psicólogo", "Porteiro", "Recepcionista",
  "Técnico de enfermagem", "Técnico em informática", "Técnico em manutenção",
  "Vendedor", "Zelador", "Mecânico", "Balconista", "Copeiro", "Babá",
  "Lavador de Carros", "Faturista", "Departamento Pessoal", "Repositor",
  "Manobrista", "Tec Enfermagem", "Enfermeira", "Médica", "Gestor Comercial",
  "Gerente", "Coordenador", "Assistente Fiscal", "Assistente contábil",
  "Tec Segurança do trabalho", "Controladoria", "Compras", "Promotor de vendas",
  "Carregador", "Estoquista", "Logística", "Panfletista", "Outros"
];

const CIDADES_PB = [
  "João Pessoa", "Campina Grande", "Bayeux", "Cabedelo", "Santa Rita",
  "Água Branca", "Aguiar", "Alagoa Grande", "Alagoa Nova", "Alagoinha", "Alcantil",
  "Algodão de Jandaíra", "Alhandra", "Amparo", "Aparecida", "Araçagi", "Arara",
  "Araruna", "Areia", "Areia de Baraúnas", "Areial", "Aroeiras", "Assunção",
  "Baía da Traição", "Bananeiras", "Baraúna", "Barra de Santa Rosa", "Barra de Santana",
  "Barra de São Miguel", "Belém", "Belém do Brejo do Cruz", "Bernardino Batista",
  "Boa Ventura", "Boa Vista", "Bom Jesus", "Bom Sucesso", "Bonito de Santa Fé",
  "Boqueirão", "Borborema", "Brejo do Cruz", "Brejo dos Santos", "Caaporã",
  "Cabaceiras", "Cachoeira dos Índios", "Cacimba de Areia", "Cacimba de Dentro",
  "Cacimbas", "Caiçara", "Caldas Brandão", "Camalaú", "Capim", "Caraúbas",
  "Carrapateira", "Casserengue", "Catingueira", "Catolé do Rocha", "Caturité",
  "Conceição", "Condado", "Conde", "Congo", "Coremas", "Coxixola",
  "Cruz do Espírito Santo", "Cubati", "Cuité", "Cuité de Mamanguape", "Cuitegi",
  "Curral de Cima", "Curral Velho", "Damião", "Desterro", "Diamante", "Dona Inês",
  "Duas Estradas", "Emas", "Esperança", "Fagundes", "Frei Martinho", "Gado Bravo",
  "Guarabira", "Gurinhém", "Gurjão", "Ibiara", "Igaracy", "Imaculada", "Ingá",
  "Itabaiana", "Itaporanga", "Itapororoca", "Itatuba", "Jacaraú", "Jericó",
  "Joca Claudino", "Juarez Távora", "Juazeirinho", "Junco do Seridó", "Juripiranga",
  "Juru", "Lagoa", "Lagoa de Dentro", "Lagoa Seca", "Lastro", "Livramento",
  "Logradouro", "Lucena", "Mãe d'Água", "Malta", "Mamanguape", "Manaíra",
  "Marcação", "Mari", "Marizópolis", "Massaranduba", "Mataraca", "Matinhas",
  "Mato Grosso", "Maturéia", "Mogeiro", "Montadas", "Monte Horebe", "Monteiro",
  "Mulungu", "Natuba", "Nazarezinho", "Nova Floresta", "Nova Olinda", "Nova Palmeira",
  "Olho d'Água", "Olivedos", "Ouro Velho", "Parari", "Passagem", "Patos", "Paulista",
  "Pedra Branca", "Pedra Lavrada", "Pedras de Fogo", "Pedro Régis", "Piancó", "Picuí",
  "Pilar", "Pilões", "Pilõezinhos", "Pirpirituba", "Pitimbu", "Pocinhos",
  "Poço Dantas", "Poço de José de Moura", "Pombal", "Prata", "Princesa Isabel",
  "Puxinanã", "Queimadas", "Quixaba", "Remígio", "Riachão", "Riachão do Bacamarte",
  "Riachão do Poço", "Riacho de Santo Antônio", "Riacho dos Cavalos", "Rio Tinto",
  "Salgadinho", "Salgado de São Félix", "Santa Cecília", "Santa Cruz", "Santa Helena",
  "Santa Inês", "Santa Luzia", "Santa Teresinha", "Santana de Mangueira",
  "Santana dos Garrotes", "Santarém", "Santo André", "São Bentinho", "São Bento",
  "São Domingos", "São Domingos do Cariri", "São Francisco", "São João do Cariri",
  "São João do Rio do Peixe", "São João do Tigre", "São José da Lagoa Tapada",
  "São José de Caiana", "São José de Espinharas", "São José de Piranhas",
  "São José de Princesa", "São José do Bonfim", "São José do Brejo do Cruz",
  "São José do Sabugi", "São José dos Cordeiros", "São José dos Ramos", "São Mamede",
  "São Miguel de Taipu", "São Sebastião de Lagoa de Roça", "São Sebastião do Umbuzeiro",
  "Sapé", "Serra Branca", "Serra da Raiz", "Serra Grande", "Serra Redonda", "Serraria",
  "Sertãozinho", "Sobrado", "Solânea", "Soledade", "Sossego", "Sousa", "Sumé",
  "Tacima", "Taperoá", "Tavares", "Teixeira", "Tenório", "Triunfo", "Uiraúna",
  "Umbuzeiro", "Várzea", "Vieirópolis", "Vista Serrana", "Zabelê"
];

export default function PostarVaga() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    job_function: '',
    city: '',
    description: '',
    salary_range: '',
    contact_phone: '',
    contact_email: '',
    image_url: '',
    is_premium: false,
    is_featured: false,
    website: ''
  });
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [showNotificationSender, setShowNotificationSender] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [notificationData, setNotificationData] = useState(null);

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

        // Verificar se é admin ou recrutador
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                        user.role === 'admin' || 
                        user.subscription_type === 'admin';
        const isRecruiter = user.subscription_type === 'recruiter';
        
        if (!isAdmin && !isRecruiter) {
          window.location.href = createPageUrl('Home');
          return;
        }

        setIsAuthorized(true);
        setCurrentUser(user);
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
          prompt: `Analise esta imagem de vaga de emprego brasileira e extraia TODAS as informações visíveis:

          1. TÍTULO: O cargo/função da vaga
          2. EMPRESA: Nome da empresa que está contratando
          3. FUNÇÃO: Categoria (Vendedor, Administrativo, Atendente, etc)
          4. CIDADE: Cidade da Paraíba. Se mencionar bairros como Mangabeira, Manaíra, Tambaú, Bancários = João Pessoa. Se Intermares = Cabedelo.
          5. DESCRIÇÃO: Transcreva TODOS os requisitos, benefícios, horário, informações
          6. SALÁRIO: Valor ou faixa salarial
          7. TELEFONE: Números com DDD (formato: 83999999999)
          8. EMAIL: Endereços de email

          IMPORTANTE: Extraia o máximo de informação possível. Se não encontrar, retorne string vazia.`,
          file_urls: [uploadResult.file_url],
          response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título/cargo da vaga" },
            company: { type: "string", description: "Nome da empresa" },
            job_function: { type: "string", description: "Função/categoria" },
            city: { type: "string", description: "Cidade" },
            description: { type: "string", description: "Descrição completa com requisitos e benefícios" },
            salary_range: { type: "string", description: "Salário ou faixa salarial" },
            contact_phone: { type: "string", description: "Telefone/WhatsApp" },
            contact_email: { type: "string", description: "Email de contato" },
            website: { type: "string", description: "Site ou link de candidatura" }
          }
          }
          });

          if (result && typeof result === 'object') {
            // Encontrar cidade na lista
            let foundCity = '';
            if (result.city) {
              const cityLower = result.city.toLowerCase();
              foundCity = CIDADES_PB.find(c => c.toLowerCase() === cityLower) || 
                          CIDADES_PB.find(c => cityLower.includes(c.toLowerCase())) || '';
            }

            setFormData(prev => ({
              ...prev,
              title: result.title || prev.title,
              company: result.company || prev.company,
              job_function: result.job_function || prev.job_function,
              city: foundCity || prev.city,
              description: result.description || prev.description,
              salary_range: result.salary_range || prev.salary_range,
              contact_phone: (result.contact_phone || '').replace(/\D/g, '') || prev.contact_phone,
              contact_email: result.contact_email || prev.contact_email,
              website: result.website || prev.website,
              image_url: uploadResult.file_url
            }));
            showToast('Dados extraídos com sucesso!');
          }
        } catch (err) {
          console.log('IA não disponível:', err);
          showToast('Imagem carregada. Preencha manualmente.');
        }
      }
    } catch (err) {
      showToast('Erro no upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.title) {
      showToast('Título é obrigatório', 'error');
      return;
    }
    
    setSubmitting(true);

    try {
      let description = formData.description || '';
      if (formData.contact_phone || formData.contact_email) {
        description += '\n\n--- CONTATO ---';
        if (formData.contact_phone) description += `\nWhatsApp: ${formData.contact_phone}`;
        if (formData.contact_email) description += `\nEmail: ${formData.contact_email}`;
      }

      // Determinar link de candidatura (prioridade: site > whatsapp > email)
      let applicationLink = '';
      if (formData.website) {
        applicationLink = formData.website.startsWith('http') ? formData.website : `https://${formData.website}`;
      } else if (formData.contact_phone) {
        let phone = formData.contact_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = phone.substring(1);
        }
        if (!phone.startsWith('55')) {
          phone = '55' + phone;
        }
        applicationLink = `https://wa.me/${phone}`;
      } else if (formData.contact_email) {
        applicationLink = `mailto:${formData.contact_email}`;
      }

      const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                      currentUser?.role === 'admin' || 
                      currentUser?.subscription_type === 'admin';
      const isRecruiter = currentUser?.subscription_type === 'recruiter';

      const jobData = {
        title: formData.title,
        company: formData.company,
        job_function: formData.job_function,
        city: formData.city,
        salary_range: formData.salary_range,
        image_url: formData.image_url,
        description: description,
        is_premium: formData.is_premium,
        is_featured: formData.is_featured,
        application_link: applicationLink
      };

      if (isRecruiter && !isAdmin) {
        // Recrutador - criar solicitação para aprovação
        await base44.entities.RecruiterRequest.create({
          recruiter_email: currentUser.email,
          recruiter_name: currentUser.full_name,
          recruiter_photo: currentUser.profile_photo,
          request_type: 'job',
          title: formData.title,
          content_preview: `${formData.company || 'Empresa não informada'} - ${formData.city || 'Cidade não informada'}`,
          full_content: jobData,
          status: 'pending'
        });
        
        setFormData({
          title: '', company: '', job_function: '', city: '', description: '',
          salary_range: '', contact_phone: '', contact_email: '', image_url: '',
          is_premium: false, is_featured: false, website: ''
        });
        showToast('Vaga enviada para aprovação!');
      } else {
        // Admin - publicar diretamente
        const createdJob = await base44.entities.Job.create(jobData);

        setLastCreatedJob({
          id: createdJob?.id,
          title: formData.title,
          city: formData.city
        });
        
        sendJobNotification(createdJob?.id, formData.title, formData.company);
        
        setFormData({
          title: '', company: '', job_function: '', city: '', description: '',
          salary_range: '', contact_phone: '', contact_email: '', image_url: '',
          is_premium: false, is_featured: false, website: ''
        });
        showToast('Vaga publicada!');
        setShowNotificationSender(true);
      }
    } catch (err) {
      console.error('Erro completo ao publicar:', err);
      showToast(err?.message || 'Erro ao publicar vaga', 'error');
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
                <Label>Empresa</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Ex: Empresa XYZ"
                />
              </div>

              <div>
                <Label>Função</Label>
                <Select value={formData.job_function} onValueChange={(v) => updateField('job_function', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b sticky top-0 bg-white z-10">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar função..."
                          value={funcSearch}
                          onChange={(e) => setFuncSearch(e.target.value)}
                          className="w-full h-9 pl-8 pr-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="off"
                          autoFocus={false}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[200px]">
                      {JOB_FUNCTIONS.filter(f => f.toLowerCase().includes(funcSearch.toLowerCase())).map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cidade</Label>
                <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b sticky top-0 bg-white z-10">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar cidade..."
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          className="w-full h-9 pl-8 pr-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="off"
                          autoFocus={false}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[200px]">
                      {CIDADES_PB.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </ScrollArea>
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

              <div>
                <Label>Site / Link de Candidatura</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://exemplo.com/vagas"
                />
              </div>

              {(formData.contact_phone || formData.contact_email || formData.website) && (
                <div className="flex flex-wrap gap-2">
                  {formData.contact_phone && (
                    <a 
                      href={`https://wa.me/55${formData.contact_phone.replace(/\D/g, '').replace(/^55/, '')}`}
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
                  {formData.website && (
                    <a 
                      href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
                    >
                      <Globe className="w-3 h-3" /> Site
                    </a>
                  )}
                </div>
              )}

              {/* Opções Premium e Destaque */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-slate-800">Vaga Premium</p>
                      <p className="text-xs text-slate-500">Visível apenas para assinantes</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.is_premium} 
                    onCheckedChange={(v) => updateField('is_premium', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-slate-800">Vaga em Destaque</p>
                      <p className="text-xs text-slate-500">Aparece no topo das listagens</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.is_featured} 
                    onCheckedChange={(v) => updateField('is_featured', v)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setShowScheduler(true)}
                  disabled={!formData.title}
                >
                  <Bell className="w-5 h-5 mr-2" />
                  Agendar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#0056ff] hover:bg-[#0044cc] h-12"
                  disabled={submitting || !formData.title}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Publicar Agora
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Template + Agendamento */}
        {showScheduler && !showNotificationSender && (
          <div className="mt-6 space-y-6">
            <NotificationTemplateSelector
              onNotificationDataChange={setNotificationData}
              jobTitle={formData.title}
              jobCompany={formData.company}
              jobCity={formData.city}
            />
            <AdvancedScheduler
              jobData={formData}
              notificationData={notificationData}
              postType="job"
              onScheduled={() => {
                setShowScheduler(false);
                setFormData({
                  title: '', company: '', job_function: '', city: '', description: '',
                  salary_range: '', contact_phone: '', contact_email: '', image_url: '',
                  is_premium: false, is_featured: false, website: ''
                });
                showToast('Vaga agendada!');
              }}
              onPublishNow={() => handleSubmit(null)}
              showToast={showToast}
            />
            <Button 
              variant="ghost" 
              onClick={() => setShowScheduler(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Enviar Notificação após publicar vaga */}
        {showNotificationSender && lastCreatedJob && !showScheduler && (
          <div className="mt-6">
            <NotificationTemplateSelector
              onNotificationDataChange={setNotificationData}
              onSendNotification={async () => {
                if (notificationData && notificationData.title && notificationData.message) {
                  try {
                    await base44.functions.invoke('pushSend', {
                      title: notificationData.title,
                      message: notificationData.message,
                      icon: notificationData.icon,
                      url: `/jobs?id=${lastCreatedJob.id}`,
                      targetGroups: notificationData.premiumOnly ? ['premium'] : ['visitor', 'basic', 'premium', 'recruiter', 'admin']
                    });
                    showToast('Notificação enviada!');
                  } catch (e) {
                    console.error('Erro:', e);
                  }
                }
                setShowNotificationSender(false);
                setLastCreatedJob(null);
              }}
              onSkipNotification={() => {
                setShowNotificationSender(false);
                setLastCreatedJob(null);
              }}
              jobTitle={lastCreatedJob.title}
              jobCompany={formData.company}
              jobCity={lastCreatedJob.city}
              isLoading={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}