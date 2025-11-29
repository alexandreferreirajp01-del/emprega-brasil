import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Calendar, Briefcase, Building2, 
  Lock, Star, X, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
// Função de data local para evitar dependências
const formatRelativeDate = (dateStr) => {
  if (!dateStr) return 'Não informado';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = todayStart.getTime() - dateStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = date.toLocaleDateString('pt-BR');
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias`;
    return formattedDate;
  } catch (e) {
    return 'Data inválida';
  }
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
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
        return [];
      }
    },
  });

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
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_function?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || job.city === selectedCity;
    const matchesType = selectedType === 'all' || job.job_type === selectedType;
    
    return matchesSearch && matchesCity && matchesType;
  });

  const priorityCities = ['João Pessoa', 'Cabedelo', 'Bayeux', 'Santa Rita', 'Campina Grande'];
  
  const sortedCities = [...cities].sort((a, b) => {
    const aIndex = priorityCities.indexOf(a.name);
    const bIndex = priorityCities.indexOf(b.name);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR');
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchTerm || selectedCity !== 'all' || selectedType !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Vagas de Emprego</h1>
          
          {/* Barra de Pesquisa Principal */}
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Pesquisar por cargo, empresa, cidade ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-4 rounded-lg border-0 bg-slate-50 text-base w-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Filtrar por:</span>
              
              {/* Filtro Cidade */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[180px] h-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Cidade" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {sortedCities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro Tipo */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[160px] h-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Tipo" />
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

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters} 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" /> Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3) }}
                >
                  <JobCard job={job} canView={canViewJob(job)} viewCount={viewsCountMap[job.id] || 0} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredJobs.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Briefcase className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-slate-500 mb-6">Tente ajustar os filtros ou termo de busca</p>
            <Button onClick={clearFilters} variant="outline" className="rounded-lg">
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, canView, viewCount = 0 }) {
  if (!canView) {
    return (
      <Card className="overflow-hidden relative">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center p-6">
          <Lock className="w-12 h-12 text-[#0056ff] mb-3" />
          <p className="text-center text-slate-700 font-medium mb-3">
            Vaga exclusiva para assinantes
          </p>
          <Link to={createPageUrl('Subscription')}>
            <Button size="sm" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-full">
              Adquira o Plano Premium
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
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-transparent hover:border-l-[#0056ff]">
        <CardContent className="p-6">
          <JobCardContent job={job} viewCount={viewCount} />
        </CardContent>
      </Card>
    </Link>
  );
}

function JobCardContent({ job, viewCount }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
            {job.title || 'Vaga não informada'}
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
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{job.company || 'Empresa confidencial'}</span>
        </p>
        
        <div className="flex flex-wrap gap-2">
          {job.city && (
            <Badge variant="secondary" className="rounded-full text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {job.city}
            </Badge>
          )}
          {job.job_type && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {job.job_type}
            </Badge>
          )}
          {job.job_function && (
            <Badge variant="outline" className="rounded-full text-xs">
              {job.job_function}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 text-right">
        <p className="text-sm text-slate-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatRelativeDate(job.created_date)}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {viewCount} views
        </p>
        {job.salary_range && (
          <p className="font-semibold text-green-600 text-sm">{job.salary_range}</p>
        )}
      </div>
    </div>
  );
}