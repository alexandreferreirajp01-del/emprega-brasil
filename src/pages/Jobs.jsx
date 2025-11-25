import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, MapPin, Calendar, Briefcase, Building2, 
  Filter, Lock, Star, ChevronDown, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

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

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState('all');
  const [citySearch, setCitySearch] = useState('');
  const [functionSearch, setFunctionSearch] = useState('');
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const searchParam = urlParams.get('search');
    if (typeParam) setSelectedType(typeParam);
    if (searchParam) setSearchTerm(searchParam);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('workly_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 500),
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list('name', 300),
  });

  const userIsPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin' || user?.email === 'alexandreferreirajp01@gmail.com';

  const canViewJob = (job) => {
    if (!job.is_premium) return true;
    if (userIsPremium) return true;
    return false;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || job.city === selectedCity;
    const matchesType = selectedType === 'all' || job.job_type === selectedType;
    const matchesFunction = selectedFunction === 'all' || job.job_function === selectedFunction;
    
    return matchesSearch && matchesCity && matchesType && matchesFunction;
  });

  const filteredCities = cities.filter(city => 
    city.name?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredFunctions = JOB_FUNCTIONS.filter(func =>
    func.toLowerCase().includes(functionSearch.toLowerCase())
  );

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedType('all');
    setSelectedFunction('all');
  };

  const hasActiveFilters = searchTerm || selectedCity !== 'all' || selectedType !== 'all' || selectedFunction !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Vagas de Emprego</h1>
          
          {/* Search */}
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar vagas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10 rounded-lg border-0 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filtros</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs h-7">
                  <X className="w-3 h-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* City Filter */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-10 rounded-lg">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="p-2 sticky top-0 bg-white">
                    <Input
                      placeholder="Pesquisar cidade..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {filteredCities.map(city => (
                      <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10 rounded-lg">
                  <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="Home Office">Home Office</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                </SelectContent>
              </Select>

              {/* Function Filter */}
              <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                <SelectTrigger className="h-10 rounded-lg">
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="p-2 sticky top-0 bg-white">
                    <Input
                      placeholder="Pesquisar função..."
                      value={functionSearch}
                      onChange={(e) => setFunctionSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <SelectItem value="all">Todas as funções</SelectItem>
                    {filteredFunctions.map(func => (
                      <SelectItem key={func} value={func}>{func}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-sm text-slate-500 mb-4">
          {filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} encontrada{filteredJobs.length !== 1 ? 's' : ''}
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <JobCard job={job} canView={canViewJob(job)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredJobs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-slate-500">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, canView }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informado';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!canView) {
    return (
      <Card className="overflow-hidden relative">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/60 z-10 flex flex-col items-center justify-center p-6">
          <Lock className="w-10 h-10 text-[#0056ff] mb-3" />
          <p className="text-center text-slate-700 font-medium mb-3">
            Conteúdo exclusivo para assinantes
          </p>
          <Link to={createPageUrl('Subscription')}>
            <Button size="sm" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-full">
              Adquira o Plano
            </Button>
          </Link>
        </div>
        <CardContent className="p-6 filter blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg text-slate-800">
                  {job.title || 'Não informado'}
                </h3>
                {job.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                    <Star className="w-3 h-3 mr-1" /> Destaque
                  </Badge>
                )}
              </div>
              <p className="text-slate-500 flex items-center gap-1 mb-3">
                <Building2 className="w-4 h-4" />
                {job.company || 'Empresa confidencial'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {job.city || 'Não informado'}
                </Badge>
                <Badge variant="secondary" className="rounded-full text-xs">
                  {job.job_type || 'Não informado'}
                </Badge>
                {job.job_function && (
                  <Badge variant="outline" className="rounded-full text-xs">
                    {job.job_function}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(job.created_date)}
              </p>
              {job.salary_range && (
                <p className="font-semibold text-green-600 mt-1">{job.salary_range}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={createPageUrl('JobDetail') + `?id=${job.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
                  {job.title || 'Não informado'}
                </h3>
                {job.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                    <Star className="w-3 h-3 mr-1" /> Destaque
                  </Badge>
                )}
                {job.is_premium && (
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-slate-500 flex items-center gap-1 mb-3">
                <Building2 className="w-4 h-4" />
                {job.company || 'Empresa confidencial'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {job.city || 'Não informado'}
                </Badge>
                <Badge variant="secondary" className="rounded-full text-xs">
                  {job.job_type || 'Não informado'}
                </Badge>
                {job.job_function && (
                  <Badge variant="outline" className="rounded-full text-xs">
                    {job.job_function}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(job.created_date)}
              </p>
              {job.salary_range && (
                <p className="font-semibold text-green-600 mt-1">{job.salary_range}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}