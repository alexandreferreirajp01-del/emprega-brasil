import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Calendar, Briefcase, TrendingUp, 
  Clock, ChevronRight, Star, Building2, Filter, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);

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
    queryFn: async () => {
      try {
        return await base44.entities.Job.list('-created_date', 50) || [];
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

  const featuredJobs = jobs.filter(job => job.is_featured).slice(0, 5);
  const recentJobs = jobs.slice(0, 6);

  const userIsPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin' || user?.email === 'alexandreferreirajp01@gmail.com';

  const canViewJob = (job) => {
    if (!job.is_premium) return true;
    if (userIsPremium) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] pt-8 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Vagas Abertas Paraíba
            </h1>
            <p className="text-xl text-white/90 mb-2">
              Encontre sua próxima oportunidade
            </p>
            <p className="text-white/70 text-lg">
              Milhares de vagas esperando por você
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-xl max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Cargo, empresa ou palavra-chave"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-slate-200"
                />
              </div>
              <Link to={createPageUrl('Jobs') + `?search=${searchTerm}`}>
                <Button className="h-12 px-8 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl w-full md:w-auto">
                  Buscar Vagas
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-8 mt-8 text-white/80"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{jobs.length}+</p>
              <p className="text-sm">Vagas Ativas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{cities.length}+</p>
              <p className="text-sm">Cidades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-sm">Gratuito</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-4 flex flex-wrap gap-3 justify-center"
        >
          <Link to={createPageUrl('Jobs') + '?type=CLT'}>
            <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-[#0056ff] hover:text-white transition-colors rounded-full">
              CLT
            </Badge>
          </Link>
          <Link to={createPageUrl('Jobs') + '?type=Estágio'}>
            <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-[#0056ff] hover:text-white transition-colors rounded-full">
              Estágio
            </Badge>
          </Link>
          <Link to={createPageUrl('Jobs') + '?type=Home Office'}>
            <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-[#0056ff] hover:text-white transition-colors rounded-full">
              Home Office
            </Badge>
          </Link>
          <Link to={createPageUrl('Jobs') + '?type=Temporário'}>
            <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-[#0056ff] hover:text-white transition-colors rounded-full">
              Temporário
            </Badge>
          </Link>
          <Link to={createPageUrl('Jobs') + '?type=Jovem Aprendiz'}>
            <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-[#0056ff] hover:text-white transition-colors rounded-full">
              Jovem Aprendiz
            </Badge>
          </Link>
        </motion.div>
      </div>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-slate-800">Vagas em Destaque</h2>
            </div>
            <Link to={createPageUrl('Jobs')} className="text-[#0056ff] font-medium flex items-center gap-1 hover:underline">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <JobCard job={job} canView={canViewJob(job)} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#0056ff]" />
            <h2 className="text-2xl font-bold text-slate-800">Vagas Recentes</h2>
          </div>
          <Link to={createPageUrl('Jobs')} className="text-[#0056ff] font-medium flex items-center gap-1 hover:underline">
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <JobCard job={job} canView={canViewJob(job)} />
              </motion.div>
            ))}
          </div>
        )}

        {jobs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma vaga disponível</h3>
            <p className="text-slate-500">Volte em breve para novas oportunidades</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Quer acesso a todas as vagas?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Assine o plano vitalício e tenha acesso ilimitado a todas as oportunidades
          </p>
          <Link to={createPageUrl('Subscription')}>
            <Button className="h-14 px-8 text-lg bg-white text-[#0056ff] hover:bg-white/90 rounded-xl">
              Ver Planos
            </Button>
          </Link>
        </div>
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
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group relative">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/50 z-10 flex flex-col items-center justify-center p-6">
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
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
                {job.title || 'Não informado'}
              </h3>
              <p className="text-slate-500 flex items-center gap-1 mt-1">
                <Building2 className="w-4 h-4" />
                {job.company || 'Empresa confidencial'}
              </p>
            </div>
            {job.is_featured && (
              <Badge className="bg-yellow-100 text-yellow-700 border-0">
                <Star className="w-3 h-3 mr-1" /> Destaque
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="rounded-full">
              <MapPin className="w-3 h-3 mr-1" />
              {job.city || 'Não informado'}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {job.job_type || 'Não informado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(job.created_date)}
            </span>
            {job.salary_range && (
              <span className="font-medium text-green-600">{job.salary_range}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={createPageUrl('JobDetail') + `?id=${job.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
                {job.title || 'Não informado'}
              </h3>
              <p className="text-slate-500 flex items-center gap-1 mt-1">
                <Building2 className="w-4 h-4" />
                {job.company || 'Empresa confidencial'}
              </p>
            </div>
            {job.is_featured && (
              <Badge className="bg-yellow-100 text-yellow-700 border-0">
                <Star className="w-3 h-3 mr-1" /> Destaque
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="rounded-full">
              <MapPin className="w-3 h-3 mr-1" />
              {job.city || 'Não informado'}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {job.job_type || 'Não informado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(job.created_date)}
            </span>
            {job.salary_range && (
              <span className="font-medium text-green-600">{job.salary_range}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}