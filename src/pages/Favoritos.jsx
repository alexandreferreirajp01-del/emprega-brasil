import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Briefcase, MapPin, Building2, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Favoritos() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    checkAuth();
  }, []);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['my-favorites', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.FavoriteJob.filter({ user_email: user.email }, '-created_date', 100) || [];
    },
    enabled: !!user,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-for-favorites'],
    queryFn: async () => {
      return await base44.entities.Job.list('-created_date', 500) || [];
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteJob.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
    },
  });

  const getJobDetails = (jobId) => {
    return jobs.find(j => j.id === jobId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0056ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-red-500 to-pink-500 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Profile')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Minhas Vagas Favoritas</h1>
              <p className="text-white/70">{favorites.length} vaga(s) salva(s)</p>
            </div>
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
        ) : favorites.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="p-8 text-center">
              <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma vaga favorita</h3>
              <p className="text-slate-500 mb-4">Clique no coração nas vagas para salvá-las aqui</p>
              <Link to={createPageUrl('Jobs')}>
                <Button className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                  Ver Vagas
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav) => {
              const job = getJobDetails(fav.job_id);
              return (
                <Card key={fav.id} className="rounded-xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">
                          {job?.title || fav.job_title || 'Vaga'}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <Building2 className="w-4 h-4" />
                          {job?.company || fav.job_company || 'Empresa'}
                          {job?.city && (
                            <>
                              <span>•</span>
                              <MapPin className="w-4 h-4" />
                              {job.city}
                            </>
                          )}
                        </p>
                        {job?.job_type && (
                          <Badge variant="outline" className="mt-2">
                            {job.job_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`${createPageUrl('JobDetail')}?id=${fav.job_id}`}>
                          <Button size="sm" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-lg">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFavoriteMutation.mutate(fav.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
  );
}