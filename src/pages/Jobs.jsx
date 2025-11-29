import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Calendar, Briefcase, Building2, 
  Filter, Lock, Star, X, Eye, ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatLocationWithCity } from "@/components/common/NeighborhoodCityMap";
import { formatRelativeDate } from "@/components/common/ClickableContent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [showFunctionDialog, setShowFunctionDialog] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [functionSearch, setFunctionSearch] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const searchParam = urlParams.get('search');
    if (typeParam) setSelectedType(typeParam);
    if (searchParam) setSearchTerm(searchParam);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
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
    queryFn: async () => {
      try {
        return await base44.entities.Job.list('-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar vagas:', e);
        return [];
      }
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      try {
        return await base44.entities.City.list('name', 300) || [];
      } catch (e) {
        console.error('Erro ao carregar cidades:', e);
        return [];
      }
    },
  });

  // Buscar contagem de visualizações
  const { data: allViews = [] } = useQuery({
    queryKey: ['all-job-views'],
    queryFn: async () => {
      try {
        return await base44.entities.JobView.list('-created_date', 5000) || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Criar mapa de contagem de visualizações
  const viewsCountMap = {};
  allViews.forEach(v => {
    viewsCountMap[v.job_id] = (viewsCountMap[v.job_id] || 0) + 1;
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

  // Cidades prioritárias
  const priorityCities = ['João Pessoa', 'Cabedelo', 'Bayeux', 'Santa Rita', 'Campina Grande'];
  
  const sortedCities = [...cities].sort((a, b) => {
    const aIndex = priorityCities.indexOf(a.name);
    const bIndex = priorityCities.indexOf(b.name);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR');
  });

  const filteredCities = sortedCities.filter(c => 
    c.name?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredFunctions = JOB_FUNCTIONS.filter(f => 
    f.toLowerCase().includes(functionSearch.toLowerCase())
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
              <Button
                variant="outline"
                onClick={() => setShowCityDialog(true)}
                className="h-10 justify-between rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className={selectedCity === 'all' ? 'text-slate-500' : 'text-slate-800'}>
                    {selectedCity === 'all' ? 'Todas as cidades' : selectedCity}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Tipo de vaga" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="Home Office">Home Office</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                </SelectContent>
              </Select>

              {/* Function Filter */}
              <Button
                variant="outline"
                onClick={() => setShowFunctionDialog(true)}
                className="h-10 justify-between rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className={`${selectedFunction === 'all' ? 'text-slate-500' : 'text-slate-800'} truncate max-w-[150px]`}>
                    {selectedFunction === 'all' ? 'Todas as funções' : selectedFunction}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
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
                  <JobCard job={job} canView={canViewJob(job)} viewCount={viewsCountMap[job.id] || 0} />
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

      {/* City Selection Dialog */}
      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0056ff]" />
              Selecionar Cidade
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Pesquisar cidade..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="pl-10 rounded-lg"
            />
          </div>
          
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <button
              onClick={() => { setSelectedCity('all'); setShowCityDialog(false); setCitySearch(''); }}
              className={`w-full p-3 text-left rounded-lg mb-1 flex items-center gap-3 ${
                selectedCity === 'all' ? 'bg-[#0056ff] text-white' : 'hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Todas as cidades
            </button>
            
            {filteredCities.map((city) => (
              <button
                key={city.id}
                onClick={() => { setSelectedCity(city.name); setShowCityDialog(false); setCitySearch(''); }}
                className={`w-full p-3 text-left rounded-lg mb-1 flex items-center gap-3 ${
                  selectedCity === city.name ? 'bg-[#0056ff] text-white' : 'hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {city.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Function Selection Dialog */}
      <Dialog open={showFunctionDialog} onOpenChange={setShowFunctionDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#0056ff]" />
              Selecionar Função
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Pesquisar função..."
              value={functionSearch}
              onChange={(e) => setFunctionSearch(e.target.value)}
              className="pl-10 rounded-lg"
            />
          </div>
          
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <button
              onClick={() => { setSelectedFunction('all'); setShowFunctionDialog(false); setFunctionSearch(''); }}
              className={`w-full p-3 text-left rounded-lg mb-1 flex items-center gap-3 ${
                selectedFunction === 'all' ? 'bg-[#0056ff] text-white' : 'hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Todas as funções
            </button>
            
            {filteredFunctions.map((func, index) => (
              <button
                key={index}
                onClick={() => { setSelectedFunction(func); setShowFunctionDialog(false); setFunctionSearch(''); }}
                className={`w-full p-3 text-left rounded-lg mb-1 flex items-center gap-3 ${
                  selectedFunction === func ? 'bg-[#0056ff] text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                {func}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobCard({ job, canView, viewCount = 0 }) {

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
          <JobCardContent job={job} viewCount={viewCount} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={createPageUrl('JobDetail') + `?id=${job.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
        <CardContent className="p-6">
          <JobCardContent job={job} viewCount={viewCount} />
        </CardContent>
      </Card>
    </Link>
  );
}

function JobCardContent({ job, viewCount }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
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
            {formatLocationWithCity(job.city)}
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
      <div className="text-right ml-4">
        <p className="text-sm text-slate-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatRelativeDate(job.created_date)}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 justify-end">
          <Eye className="w-3 h-3" />
          {viewCount} visualizações
        </p>
        {job.salary_range && (
          <p className="font-semibold text-green-600 mt-1">{job.salary_range}</p>
        )}
      </div>
    </div>
  );
}