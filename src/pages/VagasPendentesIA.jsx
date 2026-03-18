import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Search, Rocket, Trash2, Crown, Star, 
  Loader2, MapPin, Building2, Calendar, MessageCircle, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import TimeAgo from "@/components/common/TimeAgo";

export default function VagasPendentesIA() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVaga, setSelectedVaga] = useState(null);
  const queryClient = useQueryClient();

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const hasAccess = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                         currentUser?.role === 'admin' || 
                         currentUser?.subscription_type === 'admin';
        
        if (!hasAccess) {
          window.location.href = createPageUrl('Home');
          return;
        }
        
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch pending jobs
  const { data: pendingJobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['pending-ai-jobs'],
    queryFn: async () => {
      const allJobs = await base44.entities.Job.list('-created_date', 1000);
      return allJobs.filter(job => job.status === 'pending_ai');
    },
    enabled: !!user
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async ({ jobId, updates }) => {
      await base44.entities.Job.update(jobId, {
        ...updates,
        published_at: new Date().toISOString(),
        status: 'ativa'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
      toast.success('✅ Vaga publicada com sucesso!');
    },
    onError: (error) => {
      toast.error('❌ Erro ao publicar: ' + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (jobId) => {
      await base44.entities.Job.delete(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
      toast.success('✅ Vaga descartada!');
    },
    onError: (error) => {
      toast.error('❌ Erro ao descartar: ' + error.message);
    }
  });

  const handlePublish = (job, isPremium = false, isFeatured = false) => {
    if (confirm(`Publicar vaga "${job.title}"?${isPremium ? '\nMarcada como PREMIUM' : ''}${isFeatured ? '\nMarcada como DESTAQUE' : ''}`)) {
      publishMutation.mutate({
        jobId: job.id,
        updates: {
          is_premium: isPremium,
          is_featured: isFeatured
        }
      });
    }
  };

  const handleDelete = (job) => {
    if (confirm(`Descartar vaga "${job.title}"?`)) {
      deleteMutation.mutate(job.id);
    }
  };

  const filteredJobs = pendingJobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Pendentes da IA</h1>
              <p className="text-white/80 text-sm">
                Vagas recebidas via Auto post N8N aguardando revisão
              </p>
            </div>
            <Badge className="bg-white/20 text-white border-0 text-lg px-4 py-2">
              {pendingJobs.length} {pendingJobs.length === 1 ? 'vaga' : 'vagas'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {/* Search */}
        <Card className="shadow-lg mb-6 rounded-2xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar vagas pendentes..."
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {loadingJobs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="shadow hover:shadow-lg transition-shadow rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-slate-800">{job.title}</h3>
                          {job.is_home_office && (
                            <Badge className="bg-teal-100 text-teal-700">🏠 Home Office</Badge>
                          )}
                          <Badge className="bg-yellow-100 text-yellow-700">⏳ Pendente</Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                          {job.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {job.company}
                            </span>
                          )}
                          {job.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.city}{job.state ? `, ${job.state}` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <TimeAgo date={job.created_date} />
                          </span>
                        </div>

                        {/* Origin Info */}
                        {job.origin_group_name && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                            <MessageCircle className="w-3 h-3" />
                            <span>Origem: {job.origin_group_name}</span>
                            {job.origin_channel && (
                              <span>• {job.origin_channel}</span>
                            )}
                          </div>
                        )}

                        {/* Description Preview */}
                        {job.description && (
                          <p className="text-sm text-slate-600 mt-3 line-clamp-3">
                            {job.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handlePublish(job, false, false)}
                        disabled={publishMutation.isPending}
                        className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Publicar
                      </Button>
                      
                      <Button
                        onClick={() => handlePublish(job, true, false)}
                        disabled={publishMutation.isPending}
                        variant="outline"
                        className="rounded-xl border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Premium
                      </Button>
                      
                      <Button
                        onClick={() => handlePublish(job, false, true)}
                        disabled={publishMutation.isPending}
                        variant="outline"
                        className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Destaque
                      </Button>
                      
                      <Button
                        onClick={() => handlePublish(job, true, true)}
                        disabled={publishMutation.isPending}
                        variant="outline"
                        className="rounded-xl border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Premium + Destaque
                      </Button>

                      <div className="ml-auto">
                        <Button
                          onClick={() => handleDelete(job)}
                          disabled={deleteMutation.isPending}
                          variant="outline"
                          className="rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Descartar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredJobs.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma vaga pendente</p>
                <p className="text-sm">
                  As vagas recebidas via Auto post N8N aparecerão aqui
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}