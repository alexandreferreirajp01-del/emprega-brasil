import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Eye, MousePointerClick, Users, Download, 
  Calendar, MapPin, Crown, Loader2, ArrowLeft, BarChart3
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function Estatisticas() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: interactions = [] } = useQuery({
    queryKey: ['job-interactions'],
    queryFn: () => base44.entities.JobInteraction.list('-created_date', 5000),
    enabled: !!user,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['all-jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 1000),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  // Estatísticas
  const mostViewedJobs = [...jobs]
    .map(job => ({
      ...job,
      viewCount: interactions.filter(i => i.job_id === job.id && i.interaction_type === 'view').length,
      contactCount: interactions.filter(i => i.job_id === job.id && i.interaction_type === 'contact').length,
      applyCount: interactions.filter(i => i.job_id === job.id && i.interaction_type === 'apply').length,
    }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10);

  const mostContactedJobs = [...jobs]
    .map(job => ({
      ...job,
      contactCount: interactions.filter(i => i.job_id === job.id && (i.interaction_type === 'contact' || i.interaction_type === 'apply')).length,
    }))
    .filter(j => j.contactCount > 0)
    .sort((a, b) => b.contactCount - a.contactCount)
    .slice(0, 10);

  const usersByPlan = {
    visitor: users.filter(u => u.subscription_type === 'visitor').length,
    basic: users.filter(u => u.subscription_type === 'basic').length,
    premium: users.filter(u => u.subscription_type === 'premium').length,
    recruiter: users.filter(u => u.subscription_type === 'recruiter').length,
    admin: users.filter(u => u.subscription_type === 'admin' || u.role === 'admin').length,
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Vaga', 'Empresa', 'Cidade', 'Visualizações', 'Contatos', 'Aplicações'],
      ...mostViewedJobs.map(j => [
        j.title, j.company, j.city, j.viewCount, j.contactCount, j.applyCount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatisticas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Estatísticas
              </h1>
              <p className="text-white/70 text-sm">Análise de desempenho</p>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="border-white text-white hover:bg-white/20">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{interactions.filter(i => i.interaction_type === 'view').length}</p>
              <p className="text-xs text-slate-500">Visualizações</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <MousePointerClick className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{interactions.filter(i => i.interaction_type === 'contact' || i.interaction_type === 'apply').length}</p>
              <p className="text-xs text-slate-500">Candidaturas</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-slate-500">Usuários</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{jobs.length}</p>
              <p className="text-xs text-slate-500">Vagas Ativas</p>
            </CardContent>
          </Card>
        </div>

        {/* Usuários por Plano */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-xl font-bold text-slate-700">{usersByPlan.visitor}</p>
                <p className="text-xs text-slate-500">Visitantes</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xl font-bold text-blue-700">{usersByPlan.basic}</p>
                <p className="text-xs text-blue-600">Básico</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xl font-bold text-green-700">{usersByPlan.premium}</p>
                <p className="text-xs text-green-600">Premium</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xl font-bold text-purple-700">{usersByPlan.recruiter}</p>
                <p className="text-xs text-purple-600">Recrutador</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xl font-bold text-orange-700">{usersByPlan.admin}</p>
                <p className="text-xs text-orange-600">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vagas Mais Visualizadas */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vagas Mais Visualizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mostViewedJobs.map((job, i) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge className="bg-blue-600 text-white shrink-0">#{i + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.company} • {job.city}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-blue-600">{job.viewCount}</p>
                    <p className="text-xs text-slate-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vagas com Mais Contatos */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MousePointerClick className="w-5 h-5" />
              Vagas com Mais Candidaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mostContactedJobs.map((job, i) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge className="bg-green-600 text-white shrink-0">#{i + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.company} • {job.city}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-green-600">{job.contactCount}</p>
                    <p className="text-xs text-slate-400">candidaturas</p>
                  </div>
                </div>
              ))}
              {mostContactedJobs.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-sm">Nenhuma candidatura registrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}