import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Calendar, Building2, Briefcase, Star, Lock, X, ExternalLink, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Feed de Vagas</h1>
          <p className="text-white/70">Vagas Abertas Paraíba</p>
        </div>
      </div>

      {/* Feed Grid - Instagram Style */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-square bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="relative aspect-square cursor-pointer group"
                onClick={() => canViewJob(job) && setSelectedJob(job)}
              >
                {job.image_url ? (
                  <img 
                    src={job.image_url} 
                    alt={job.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0056ff] to-[#0044cc] rounded-lg flex flex-col items-center justify-center p-3 text-white">
                    <Briefcase className="w-8 h-8 mb-2" />
                    <p className="text-xs font-medium text-center line-clamp-2">{job.title}</p>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="text-white text-center p-2">
                    <p className="text-sm font-semibold line-clamp-2">{job.title}</p>
                    <p className="text-xs opacity-80">{job.city}</p>
                  </div>
                </div>

                {/* Premium Lock */}
                {!canViewJob(job) && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                )}

                {/* Featured Badge */}
                {job.is_featured && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                )}

                {/* Premium Badge */}
                {job.is_premium && canViewJob(job) && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-purple-500 text-white border-0 text-xs px-1.5 py-0.5">
                      Premium
                    </Badge>
                  </div>
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

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="sticky top-0 bg-white z-10 p-4 border-b flex items-center justify-between">
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              {selectedJob.image_url && (
                <img 
                  src={selectedJob.image_url} 
                  alt={selectedJob.title}
                  className="w-full aspect-video object-cover"
                />
              )}

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedJob.title}</h2>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {selectedJob.company || 'Empresa confidencial'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">{formatDate(selectedJob.created_date)}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="rounded-full">
                    <MapPin className="w-3 h-3 mr-1" />
                    {selectedJob.city || 'Não informado'}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {selectedJob.job_type || 'Não informado'}
                  </Badge>
                  {selectedJob.salary_range && (
                    <Badge className="bg-green-100 text-green-700 border-0 rounded-full">
                      {selectedJob.salary_range}
                    </Badge>
                  )}
                </div>

                {selectedJob.description && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Descrição</h3>
                    <p className="text-slate-600 whitespace-pre-line text-sm">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.requirements && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Requisitos</h3>
                    <p className="text-slate-600 whitespace-pre-line text-sm">{selectedJob.requirements}</p>
                  </div>
                )}

                {selectedJob.additional_info && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Informações Adicionais</h3>
                    <p className="text-slate-600 whitespace-pre-line text-sm">{selectedJob.additional_info}</p>
                  </div>
                )}

                {selectedJob.application_link && (
                  <a href={selectedJob.application_link} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12">
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Candidatar-se
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}