import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Wand2, Briefcase, MapPin, DollarSign, 
  Phone, Link as LinkIcon, FileText, Loader2, Check,
  Star, Crown, ArrowLeft, Copy, Building2, Search as SearchIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import NotificationTemplateSelector from "@/components/admin/NotificationTemplateSelector";
import AdvancedScheduler from "@/components/admin/AdvancedScheduler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { formatWhatsAppLink } from "@/components/common/ContactOptionsDialog";

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

export default function VagasPorIA() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Campos da vaga
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobFunction, setJobFunction] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [applicationLink, setApplicationLink] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Filtros de busca
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [showNotificationSender, setShowNotificationSender] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  
  const showToast = (msg) => {
    alert(msg);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        const isRecruiter = currentUser?.subscription_type === 'recruiter';
        setIsAuthorized(isAdmin || isRecruiter);
      } catch (e) {
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, []);

  const extractWithAI = async () => {
    if (!rawText.trim()) return;
    
    setIsExtracting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o seguinte texto de vaga de emprego e extraia as informações estruturadas.
        
TEXTO DA VAGA:
${rawText}

Extraia as seguintes informações (se não encontrar, deixe vazio):
- titulo: título/cargo da vaga
- empresa: nome da empresa que está contratando
- funcao: função/cargo (escolha a mais próxima desta lista: ${JOB_FUNCTIONS.join(', ')})
- cidade: cidade da vaga (preferencialmente da Paraíba)
- descricao: descrição completa da vaga, requisitos, benefícios, etc
- salario: faixa salarial ou valor do salário
- telefone: telefone ou WhatsApp para contato
- link: site, email ou link para candidatura

Responda APENAS com o JSON, sem explicações.`,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            empresa: { type: "string" },
            funcao: { type: "string" },
            cidade: { type: "string" },
            descricao: { type: "string" },
            salario: { type: "string" },
            telefone: { type: "string" },
            link: { type: "string" }
          }
        }
      });

      setExtractedData(result);
      
      // Preencher os campos
      if (result.titulo) setTitle(result.titulo);
      if (result.empresa) setCompany(result.empresa);
      if (result.funcao) {
        const matchedFunc = JOB_FUNCTIONS.find(f => 
          f.toLowerCase().includes(result.funcao.toLowerCase()) ||
          result.funcao.toLowerCase().includes(f.toLowerCase())
        );
        setJobFunction(matchedFunc || result.funcao);
      }
      if (result.cidade) {
        const matchedCity = CIDADES_PB.find(c => 
          c.toLowerCase().includes(result.cidade.toLowerCase()) ||
          result.cidade.toLowerCase().includes(c.toLowerCase())
        );
        setCity(matchedCity || result.cidade);
      }
      if (result.descricao) setDescription(result.descricao);
      if (result.salario) setSalary(result.salario);
      if (result.telefone) setPhone(result.telefone);
      if (result.link) setApplicationLink(result.link);

    } catch (error) {
      console.error('Erro ao extrair dados:', error);
    }
    setIsExtracting(false);
  };

  const createJobMutation = useMutation({
    mutationFn: async () => {
      console.log('Iniciando criação de vaga IA:', { title, company, city });
      // Gerar link de candidatura correto
      let finalApplicationLink = applicationLink;
      
      // Se tem telefone e não tem link, usar WhatsApp
      if (phone && !applicationLink) {
        finalApplicationLink = formatWhatsAppLink(phone);
      }
      // Se o link é um número de telefone, converter para WhatsApp
      else if (applicationLink && /^\d+$/.test(applicationLink.replace(/\D/g, '')) && applicationLink.length >= 10) {
        finalApplicationLink = formatWhatsAppLink(applicationLink);
      }
      
      const jobData = {
        title: title,
        company: company,
        job_function: jobFunction,
        city: city,
        description: description,
        salary_range: salary,
        additional_info: phone ? `Contato: ${phone}` : '',
        application_link: finalApplicationLink,
        is_premium: isPremium,
        is_featured: isFeatured
      };

      const isAdmin = user?.email === 'alexandreferreirajp01@gmail.com' || 
                      user?.role === 'admin' || 
                      user?.subscription_type === 'admin';
      const isRecruiter = user?.subscription_type === 'recruiter';

      if (isRecruiter && !isAdmin) {
        // Recrutador - criar solicitação
        await base44.entities.RecruiterRequest.create({
          recruiter_email: user.email,
          recruiter_name: user.full_name,
          recruiter_photo: user.profile_photo,
          request_type: 'job_ai',
          title: title,
          content_preview: `${company || 'Empresa não informada'} - ${city || 'Cidade não informada'}`,
          full_content: jobData,
          status: 'pending'
        });
        return { pending: true };
      }
      
      const createdJob = await base44.entities.Job.create(jobData);
      console.log('Vaga criada com sucesso:', createdJob);
      return createdJob;
    },
    onSuccess: async (result) => {
      if (result?.pending) {
        alert('Vaga enviada para aprovação!');
      } else {
        setShowSuccess(true);
        setLastCreatedJob({
          id: result?.id,
          title: title,
          city: city
        });
        setShowNotificationSender(true);
      }
      // Limpar campos
      setRawText('');
      setTitle('');
      setCompany('');
      setJobFunction('');
      setCity('');
      setDescription('');
      setSalary('');
      setPhone('');
      setApplicationLink('');
      setIsPremium(false);
      setIsFeatured(false);
      setExtractedData(null);
      
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      console.error('Erro ao criar vaga IA:', error);
      alert('Erro ao publicar: ' + (error?.message || 'Erro desconhecido'));
    }
  });

  const clearAll = () => {
    setRawText('');
    setTitle('');
    setCompany('');
    setJobFunction('');
    setCity('');
    setDescription('');
    setSalary('');
    setPhone('');
    setApplicationLink('');
    setIsPremium(false);
    setIsFeatured(false);
    setExtractedData(null);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500">Apenas administradores podem acessar esta função.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Admin')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas por IA</h1>
              <p className="text-white/70">Cole o texto da vaga e deixe a IA preencher os campos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Sucesso */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Vaga publicada com sucesso!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Input de texto */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-purple-600" />
                Texto da Vaga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-600 mb-2 block">
                  Cole aqui o texto completo da vaga (até 5000 caracteres)
                </Label>
                <Textarea
                  placeholder="Cole aqui o texto da vaga copiado de qualquer fonte (WhatsApp, Instagram, Facebook, site, etc)...

Exemplo:
VAGA: Vendedor
Empresa XYZ está contratando vendedor para loja no centro de João Pessoa.
Salário: R$ 1.500 + comissão
Requisitos: Ensino médio completo
WhatsApp: (83) 99999-9999"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value.slice(0, 5000))}
                  className="min-h-[300px] text-base"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-400">
                    {rawText.length}/5000 caracteres
                  </span>
                  {rawText && (
                    <Button variant="ghost" size="sm" onClick={() => setRawText('')}>
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              <Button
                onClick={extractWithAI}
                disabled={!rawText.trim() || isExtracting}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extraindo dados...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Gerar Vaga com IA
                  </>
                )}
              </Button>

              {extractedData && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Dados extraídos! Revise os campos ao lado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coluna 2: Campos extraídos */}
          <Card className="shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Dados da Vaga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Título */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Título da Vaga
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vendedor, Auxiliar Administrativo..."
                />
              </div>

              {/* Empresa */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Empresa
                </Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: Empresa XYZ"
                />
              </div>

              {/* Função */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Função
                </Label>
                <Select value={jobFunction} onValueChange={setJobFunction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b sticky top-0 bg-white z-10">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar função..."
                          value={funcSearch}
                          onChange={(e) => setFuncSearch(e.target.value)}
                          className="w-full h-9 pl-8 pr-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="off"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
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

              {/* Cidade */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Cidade
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b sticky top-0 bg-white z-10">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar cidade..."
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          className="w-full h-9 pl-8 pr-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="off"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
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

              {/* Descrição */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Descrição
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição da vaga, requisitos, benefícios..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Salário */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  Salário
                </Label>
                <Input
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="Ex: R$ 1.500, A combinar..."
                />
              </div>

              {/* Telefone */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Telefone/WhatsApp
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(83) 99999-9999"
                />
              </div>

              {/* Link */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  Site/Link de Candidatura
                </Label>
                <Input
                  value={applicationLink}
                  onChange={(e) => setApplicationLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Switches Premium e Destaque */}
              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-slate-800">Vaga Premium</p>
                      <p className="text-xs text-slate-500">Apenas assinantes verão</p>
                    </div>
                  </div>
                  <Switch checked={isPremium} onCheckedChange={setIsPremium} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-slate-800">Destaque</p>
                      <p className="text-xs text-slate-500">Aparece no topo</p>
                    </div>
                  </div>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>

              {/* Badges */}
              {(isPremium || isFeatured) && (
                <div className="flex gap-2">
                  {isPremium && (
                    <Badge className="bg-purple-100 text-purple-700">Premium</Badge>
                  )}
                  {isFeatured && (
                    <Badge className="bg-yellow-100 text-yellow-700">Destaque</Badge>
                  )}
                </div>
              )}

              {/* Botões de ação */}
              <div className="space-y-3 pt-4">
               <div className="flex gap-3">
                 <Button
                   variant="outline"
                   onClick={clearAll}
                   className="flex-1"
                 >
                   Limpar Tudo
                 </Button>
                 <Button
                   onClick={() => setShowScheduler(true)}
                   disabled={!title}
                   variant="outline"
                   className="flex-1"
                 >
                   <Bell className="w-4 h-4 mr-2" />
                   Agendar
                 </Button>
               </div>
               <Button
                 onClick={() => createJobMutation.mutate()}
                 disabled={!title || createJobMutation.isPending}
                 className="w-full bg-[#0056ff] hover:bg-[#0044cc] h-12"
               >
                 {createJobMutation.isPending ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Publicando...
                   </>
                 ) : (
                   <>
                     <Check className="w-4 h-4 mr-2" />
                     Publicar Agora
                   </>
                 )}
               </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template + Scheduler */}
        {showScheduler && !showNotificationSender && (
          <div className="mt-6 space-y-6">
            <NotificationTemplateSelector
              onNotificationDataChange={setNotificationData}
              jobTitle={title}
              jobCompany={company}
              jobCity={city}
            />
            <AdvancedScheduler
              jobData={{ title, company, job_function: jobFunction, city, description, salary_range: salary }}
              notificationData={notificationData}
              postType="job_ai"
              onScheduled={() => {
                setShowScheduler(false);
                clearAll();
                showToast('Vaga agendada!');
              }}
              onPublishNow={() => {
                setShowScheduler(false);
                createJobMutation.mutate();
              }}
              showToast={showToast}
            />
          </div>
        )}

        {/* Notification Template */}
        {showNotificationSender && lastCreatedJob && !showScheduler && (
          <div className="mt-6">
            <NotificationTemplateSelector
              onNotificationDataChange={setNotificationData}
              onSendNotification={async () => {
               if (notificationData && notificationData.title && notificationData.message && lastCreatedJob?.id) {
                 try {
                   const targetGroups = notificationData.premiumOnly ? ['premium', 'admin'] : ['visitor', 'basic', 'premium', 'recruiter', 'admin'];

                   await base44.functions.invoke('pushSend', {
                     title: notificationData.title,
                     message: notificationData.message,
                     icon: notificationData.icon,
                     url: `/jobs?id=${lastCreatedJob.id}`,
                     targetGroups
                   });

                   const users = await base44.entities.User.list();
                   const targetUsers = users.filter(u => {
                     if (notificationData.premiumOnly) {
                       return u.subscription_type === 'premium' || u.subscription_type === 'admin' || u.role === 'admin';
                     }
                     return true;
                   });

                   const notificationPromises = targetUsers.map(u => 
                     base44.entities.Notification.create({
                       user_email: u.email,
                       title: notificationData.title,
                       message: notificationData.message,
                       type: 'job',
                       is_read: false,
                       link: `/jobs?id=${lastCreatedJob.id}`
                     })
                   );
                   await Promise.all(notificationPromises);

                   if (notificationData.sendEmail) {
                     for (const u of targetUsers) {
                       try {
                         await base44.integrations.Core.SendEmail({
                           to: u.email,
                           subject: notificationData.title,
                           body: `${notificationData.message}\n\nAcesse: ${window.location.origin}/jobs?id=${lastCreatedJob.id}`
                         });
                       } catch (e) {
                         console.error('Erro ao enviar email:', e);
                       }
                     }
                   }

                   showToast('Notificação enviada!');
                 } catch (e) {
                   console.error('Erro:', e);
                 }
               }
               setShowNotificationSender(false);
              }
              onSkipNotification={() => setShowNotificationSender(false)}
              jobTitle={lastCreatedJob.title}
              jobCompany={company}
              jobCity={lastCreatedJob.city}
              isLoading={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}