import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Calendar, Briefcase, TrendingUp, 
  Clock, ChevronRight, Star, Building2, Users, Crown,
  Newspaper, MessageCircle, ArrowRight, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatRelativeDate } from "@/components/common/ClickableContent";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);

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
        return await base44.entities.Job.list('-created_date', 50) || [];
      } catch (e) {
        console.error('Erro ao carregar vagas:', e);
        return [];
      }
    },
  });

  const { data: news = [] } = useQuery({
    queryKey: ['news-home'],
    queryFn: async () => {
      try {
        return await base44.entities.News.list('-created_date', 3) || [];
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

  const featuredJobs = jobs.filter(job => job.is_featured).slice(0, 4);
  const recentJobs = jobs.filter(job => !job.is_featured).slice(0, 4);

  const userIsPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin';

  const canViewJob = (job) => {
    if (!job.is_premium) return true;
    if (userIsPremium) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] pt-8 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Badge className="bg-white/20 text-white border-0 mb-4 px-4 py-1">
              🚀 A maior plataforma de vagas da Paraíba
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Encontre sua próxima
              <span className="block text-white/90">oportunidade de emprego</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Milhares de vagas atualizadas diariamente nas principais cidades da Paraíba
            </p>
          </motion.div>

          {/* Search CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto"
          >
            <Link to={createPageUrl('Jobs')} className="flex-1">
              <Button className="w-full h-14 text-lg bg-white text-[#0056ff] hover:bg-white/90 rounded-xl shadow-xl">
                <Search className="w-5 h-5 mr-2" />
                Buscar Vagas
              </Button>
            </Link>
            <Link to={createPageUrl('Subscription')}>
              <Button variant="outline" className="w-full sm:w-auto h-14 text-lg border-white/30 text-white hover:bg-white/10 rounded-xl">
                <Crown className="w-5 h-5 mr-2" />
                Ver Planos
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-8 md:gap-16 mt-12"
          >
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">{jobs.length}+</p>
              <p className="text-white/70 text-sm">Vagas Ativas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">{cities.length}+</p>
              <p className="text-white/70 text-sm">Cidades</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">24h</p>
              <p className="text-white/70 text-sm">Atualizações</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">Buscar por tipo de vaga</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {['CLT', 'Estágio', 'Home Office', 'Jovem Aprendiz', 'Temporário', 'PJ'].map((type) => (
              <Link key={type} to={createPageUrl('Jobs') + `?type=${type}`}>
                <Badge 
                  variant="outline" 
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-[#0056ff] hover:text-white hover:border-[#0056ff] transition-all rounded-full"
                >
                  {type}
                </Badge>
              </Link>
            ))}
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <JobCard job={job} canView={canViewJob(job)} featured />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="bg-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map((i) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="text-center mt-8">
            <Link to={createPageUrl('Jobs')}>
              <Button className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12 px-8">
                Ver Todas as Vagas
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* News Section */}
      {news.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Newspaper className="w-6 h-6 text-[#0056ff]" />
              <h2 className="text-2xl font-bold text-slate-800">Últimas Notícias</h2>
            </div>
            <Link to={createPageUrl('News')} className="text-[#0056ff] font-medium flex items-center gap-1 hover:underline">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl('NewsDetail') + `?id=${item.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                    {item.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <Badge variant="outline" className="mb-2 text-xs">{item.category}</Badge>
                      <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-[#0056ff] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-2">
                        {formatRelativeDate(item.created_date)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Por que usar o Vagas Abertas?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-[#0056ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-[#0056ff]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Vagas Atualizadas</h3>
              <p className="text-slate-500 text-sm">Novas oportunidades adicionadas diariamente</p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-[#0056ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-[#0056ff]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Foco na Paraíba</h3>
              <p className="text-slate-500 text-sm">Vagas em todas as cidades do estado</p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-[#0056ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#0056ff]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Comunidade Ativa</h3>
              <p className="text-slate-500 text-sm">Troque experiências com outros profissionais</p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Acesso Vitalício por apenas R$29,90
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Tenha acesso ilimitado a todas as vagas premium e funcionalidades exclusivas
          </p>
          <Link to={createPageUrl('Subscription')}>
            <Button className="h-14 px-8 text-lg bg-white text-[#0056ff] hover:bg-white/90 rounded-xl">
              Adquirir Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, canView, featured = false }) {
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
          <JobCardContent job={job} featured={featured} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={createPageUrl('JobDetail') + `?id=${job.id}`}>
      <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full ${featured ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
        <CardContent className="p-6">
          <JobCardContent job={job} featured={featured} />
        </CardContent>
      </Card>
    </Link>
  );
}

function JobCardContent({ job, featured }) {
  return (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
              {job.title || 'Não informado'}
            </h3>
            {featured && (
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
          <p className="text-slate-500 flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            {job.company || 'Empresa confidencial'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="secondary" className="rounded-full text-xs">
          <MapPin className="w-3 h-3 mr-1" />
          {job.city || 'Não informado'}
        </Badge>
        <Badge variant="secondary" className="rounded-full text-xs">
          {job.job_type || 'Não informado'}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatRelativeDate(job.created_date)}
        </span>
        {job.salary_range && (
          <span className="font-medium text-green-600">{job.salary_range}</span>
        )}
      </div>
    </>
  );
}