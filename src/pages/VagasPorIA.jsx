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
  Star, Crown, ArrowLeft, Copy, Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  "Patos", "Sousa", "Cajazeiras", "Guarabira", "Mamanguape", "Sapé",
  "Pombal", "Monteiro", "Queimadas", "Esperança", "Itabaiana", "Areia",
  "Solânea", "Bananeiras", "Cuité", "Picuí", "Catolé do Rocha"
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        setIsAuthorized(isAdmin);
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
      const jobData = {
        title: title,
        company: company,
        job_function: jobFunction,
        city: city,
        description: description,
        salary_range: salary,
        additional_info: phone ? `Contato: ${phone}` : '',
        application_link: applicationLink,
        is_premium: isPremium,
        is_featured: isFeatured
      };
      
      return await base44.entities.Job.create(jobData);
    },
    onSuccess: () => {
      setShowSuccess(true);
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
                    {JOB_FUNCTIONS.map((func) => (
                      <SelectItem key={func} value={func}>{func}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cidade */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Cidade
                </Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: João Pessoa, Campina Grande..."
                />
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
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="flex-1"
                >
                  Limpar Tudo
                </Button>
                <Button
                  onClick={() => createJobMutation.mutate()}
                  disabled={!title || createJobMutation.isPending}
                  className="flex-1 bg-[#0056ff] hover:bg-[#0044cc]"
                >
                  {createJobMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Publicar Vaga
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}