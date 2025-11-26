import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, MapPin, Calendar, Building2, Briefcase, 
  DollarSign, ExternalLink, Lock, Clock, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatLocationWithCity } from "@/components/common/NeighborhoodCityMap";

export default function JobDetail() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

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

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.Job.filter({ id: jobId });
      return jobs[0];
    },
    enabled: !!jobId,
  });

  const userIsPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin' || user?.email === 'alexandreferreirajp01@gmail.com';

  const canViewJob = () => {
    if (!job?.is_premium) return true;
    if (userIsPremium) return true;
    return false;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informado';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Vaga não encontrada</h2>
          <Link to={createPageUrl('Jobs')}>
            <Button className="mt-4">Voltar para vagas</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!canViewJob()) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Jobs')} className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para vagas
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <Card className="shadow-xl rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 backdrop-blur-md bg-white/70 z-10 flex flex-col items-center justify-center p-8">
              <Lock className="w-16 h-16 text-[#0056ff] mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
                Conteúdo Exclusivo
              </h2>
              <p className="text-slate-600 text-center mb-6 max-w-md">
                Esta vaga é exclusiva para assinantes. Adquira o plano vitalício para ter acesso completo a todas as oportunidades.
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button size="lg" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-8">
                  Adquira o Plano
                </Button>
              </Link>
            </div>
            <CardContent className="p-8 filter blur-md">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">{job.title}</h1>
              <p className="text-slate-600">{job.description?.substring(0, 200)}...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Jobs')} className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para vagas
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-xl rounded-2xl overflow-hidden mb-6">
            <CardContent className="p-6 md:p-8">
              {/* Title Section */}
              <div className="mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                      {job.title || 'Não informado'}
                    </h1>
                    <p className="text-lg text-slate-500 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {job.company || 'Empresa confidencial'}
                    </p>
                  </div>
                  {job.salary_range && (
                    <div className="bg-green-50 px-4 py-2 rounded-xl">
                      <p className="text-green-700 font-semibold flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        {job.salary_range}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Badge className="bg-[#0056ff]/10 text-[#0056ff] border-0 px-4 py-2 text-sm rounded-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  {formatLocationWithCity(job.city)}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 border-0 px-4 py-2 text-sm rounded-full">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {job.job_type || 'Não informado'}
                </Badge>
                {job.job_function && (
                  <Badge className="bg-purple-100 text-purple-700 border-0 px-4 py-2 text-sm rounded-full">
                    {job.job_function}
                  </Badge>
                )}
                <Badge variant="outline" className="px-4 py-2 text-sm rounded-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Publicado em {formatDate(job.created_date)}
                </Badge>
              </div>

              {/* Description */}
              {job.description && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Descrição da Vaga</h2>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 whitespace-pre-line">{job.description}</p>
                  </div>
                </div>
              )}



              {/* Additional Info */}
              {job.additional_info && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações Adicionais</h2>
                  <p className="text-slate-600 whitespace-pre-line">{job.additional_info}</p>
                </div>
              )}

              {/* Apply Button */}
              {job.application_link && (
                <div className="pt-6 border-t">
                  <a href={job.application_link} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="w-full md:w-auto bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-14 px-8 text-lg">
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Candidatar-se
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}