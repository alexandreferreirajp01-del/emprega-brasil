import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Briefcase, MapPin, Building2, Trash2, ArrowLeft, ExternalLink, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
export default function Historico() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    loadUser();
  }, []);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['my-history', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.ViewHistory.filter({ user_email: user.email }, '-created_date', 50) || [];
    },
    enabled: !!user,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-for-history'],
    queryFn: async () => {
      return await base44.entities.Job.list('-created_date', 500) || [];
    },
  });

  const removeFromHistoryMutation = useMutation({
    mutationFn: (id) => base44.entities.ViewHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-history'] });
    },
  });

  const clearAllHistoryMutation = useMutation({
    mutationFn: async () => {
      for (const item of history) {
        await base44.entities.ViewHistory.delete(item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-history'] });
    },
  });

  const getJobDetails = (jobId) => {
    return jobs.find(j => j.id === jobId);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <RequireAuth>
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Histórico de Vagas</h1>
                <p className="text-white/70">{history.length} vaga(s) visualizada(s)</p>
              </div>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => clearAllHistoryMutation.mutate()}
                disabled={clearAllHistoryMutation.isPending}
                className="text-white/80 hover:text-white hover:bg-white/20"
              >
                <Trash className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {isLoading ? (
          <Card className="rounded-xl">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-[#0056ff] border-t-transparent rounded-full mx-auto" />
            </CardContent>
          </Card>
        ) : history.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="p-8 text-center">
              <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma vaga visualizada</h3>
              <p className="text-slate-500 mb-4">As vagas que você abrir aparecerão aqui</p>
              <Link to={createPageUrl('Jobs')}>
                <Button className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                  Ver Vagas
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const job = getJobDetails(item.job_id);
              return (
                <Card key={item.id} className="rounded-xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">
                          {job?.title || item.job_title || 'Vaga'}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <Building2 className="w-4 h-4" />
                          {job?.company || item.job_company || 'Empresa'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Visto em: {formatDate(item.created_date)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`${createPageUrl('JobDetail')}?id=${item.job_id}`}>
                          <Button size="sm" variant="outline" className="rounded-lg">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromHistoryMutation.mutate(item.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}