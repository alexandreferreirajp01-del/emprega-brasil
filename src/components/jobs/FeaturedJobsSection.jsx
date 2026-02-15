import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, MapPin, Briefcase, Building2, Clock, Calendar, 
  ChevronRight, ChevronLeft, Eye, Zap 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import TimeAgo from "@/components/common/TimeAgo";

export default function FeaturedJobsSection() {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadFeaturedJobs();
  }, []);

  const loadFeaturedJobs = async () => {
    try {
      setLoading(true);
      setError(false);

      const [jobsData, viewsData] = await Promise.all([
        base44.entities.Job.list('-created_date', 100),
        base44.entities.JobView.list('-created_date', 1000)
      ]);

      // Filtrar vagas em destaque e ativas
      const featured = jobsData.filter(job => 
        job.is_featured === true && 
        job.status === 'ativa'
      );

      // Ordenar: 1) mais recentes primeiro, 2) depois por expiração próxima
      const sorted = featured.sort((a, b) => {
        const dateA = new Date(a.created_date);
        const dateB = new Date(b.created_date);
        const diff = dateB - dateA;
        
        if (Math.abs(diff) < 86400000) { // Se diferença < 24h
          if (a.expiration_date && b.expiration_date) {
            return new Date(a.expiration_date) - new Date(b.expiration_date);
          }
        }
        return diff;
      });

      setFeaturedJobs(sorted);
      setViews(viewsData);
    } catch (err) {
      console.error('Erro ao carregar vagas em destaque:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const viewsCountMap = {};
  views.forEach(v => {
    viewsCountMap[v.job_id] = (viewsCountMap[v.job_id] || 0) + 1;
  });

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-2xl">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">Erro ao carregar vagas em destaque</p>
              <Button 
                onClick={loadFeaturedJobs}
                variant="outline"
                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (featuredJobs.length === 0) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0 rounded-2xl shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Nenhuma vaga em destaque no momento
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Explore todas as oportunidades disponíveis
              </p>
              <Link to={createPageUrl('Jobs')}>
                <Button className="bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-xl">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Buscar Vagas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Vagas em Destaque
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {featuredJobs.length} {featuredJobs.length === 1 ? 'oportunidade selecionada' : 'oportunidades selecionadas'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div 
          ref={scrollRef}
          className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {featuredJobs.map((job) => (
            <JobCard key={job.id} job={job} viewCount={viewsCountMap[job.id] || 0} />
          ))}
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featuredJobs.slice(0, 8).map((job) => (
            <JobCard key={job.id} job={job} viewCount={viewsCountMap[job.id] || 0} />
          ))}
        </div>

        {/* View All Link */}
        {featuredJobs.length > 8 && (
          <div className="text-center mt-6">
            <Link to={createPageUrl('Jobs')}>
              <Button variant="outline" className="rounded-xl">
                Ver todas as vagas em destaque
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, viewCount }) {
  return (
    <Link 
      to={`${createPageUrl('JobDetail')}?id=${job.id}`}
      className="block min-w-[280px] md:min-w-0 snap-start"
    >
      <Card className="h-full bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Badge Destaque */}
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 rounded-full px-3 py-1">
              <Star className="w-3 h-3 mr-1 fill-white" />
              Destaque
            </Badge>
            {job.is_premium && (
              <Badge className="bg-purple-100 text-purple-700 border-0 rounded-full px-3 py-1">
                Premium
              </Badge>
            )}
          </div>

          {/* Título */}
          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-[#1D4371] dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
            {job.title}
          </h3>

          {/* Empresa */}
          {job.company && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-3">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{job.company}</span>
            </div>
          )}

          {/* Localização */}
          {(job.city || job.state) && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {job.city && job.state ? `${job.city} - ${job.state}` : job.city || job.state}
              </span>
            </div>
          )}

          {/* Tipo e Modelo */}
          <div className="flex flex-wrap gap-2 mb-3">
            {job.job_type && (
              <Badge variant="secondary" className="rounded-full text-xs">
                {job.job_type}
              </Badge>
            )}
            {job.work_mode && (
              <Badge variant="outline" className="rounded-full text-xs">
                {job.work_mode}
              </Badge>
            )}
          </div>

          {/* Salário */}
          {job.salary_range && (
            <div className="mb-3">
              <p className="text-green-600 dark:text-green-400 font-semibold text-sm">
                {job.salary_range}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <TimeAgo date={job.created_date} />
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{viewCount}</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full mt-4 bg-[#1D4371] hover:bg-[#0F2744] text-white rounded-xl"
            size="sm"
          >
            Ver vaga
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}