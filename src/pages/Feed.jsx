import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Calendar, Building2, Briefcase, Star, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Feed() {
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
    queryKey: ['feed-jobs'],
    queryFn: async () => {
      try {
        return await base44.entities.Job.list('-created_date', 100) || [];
      } catch (e) {
        console.error('Erro ao carregar vagas:', e);
        return [];
      }
    },
  });

  const userIsPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin' || user?.email === 'alexandreferreirajp01@gmail.com';

  const canViewJob = (job) => {
    if (!job.is_premium) return true;
    if (userIsPremium) return true;
    return false;
  };

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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Feed de Vagas</h1>
          <p className="text-white/70">Todas as vagas em um só lugar</p>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <Card key={i} className="animate-pulse rounded-2xl">
                <CardContent className="p-6">
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {canViewJob(job) ? (
                  <Link to={createPageUrl('JobDetail') + `?id=${job.id}`}>
                    <Card className="rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
                                {job.title || 'Não informado'}
                              </h3>
                              {job.is_featured && (
                                <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                                  <Star className="w-3 h-3 mr-1" /> Destaque
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-500 flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {job.company || 'Empresa confidencial'}
                            </p>
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(job.created_date)}
                          </p>
                        </div>
                        
                        {job.description && (
                          <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.city || 'Não informado'}
                          </Badge>
                          <Badge variant="secondary" className="rounded-full text-xs">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {job.job_type || 'Não informado'}
                          </Badge>
                          {job.salary_range && (
                            <Badge className="bg-green-100 text-green-700 border-0 rounded-full text-xs">
                              {job.salary_range}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="rounded-2xl overflow-hidden relative">
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
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-800">
                            {job.title || 'Não informado'}
                          </h3>
                          <p className="text-slate-500 flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {job.company || 'Empresa confidencial'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="rounded-full text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.city || 'Não informado'}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {job.job_type || 'Não informado'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
    </div>
  );
}