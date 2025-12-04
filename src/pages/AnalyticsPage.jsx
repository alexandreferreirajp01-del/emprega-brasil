import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Loader2, Users, Briefcase, Eye, Heart, 
  MessageCircle, TrendingUp, Clock, Calendar, BarChart3,
  FileText, Bookmark, Bell, Share2, UserPlus, Crown, Filter
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtro de datas
  const today = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(today);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultStartDate);
  const [appliedEndDate, setAppliedEndDate] = useState(today);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
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
    checkAdmin();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['analytics-jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['analytics-posts'],
    queryFn: () => base44.entities.FeedPost.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['analytics-comments'],
    queryFn: () => base44.entities.FeedComentario.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['analytics-favorites'],
    queryFn: () => base44.entities.FavoriteJob.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: viewHistory = [] } = useQuery({
    queryKey: ['analytics-views'],
    queryFn: () => base44.entities.ViewHistory.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['analytics-visits'],
    queryFn: () => base44.entities.AppVisit.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['analytics-messages'],
    queryFn: () => base44.entities.MensagemDireta.list('-created_date', 1000),
    staleTime: 60000
  });

  const { data: savedPosts = [] } = useQuery({
    queryKey: ['analytics-saved-posts'],
    queryFn: () => base44.entities.FeedSalvo.list('-created_date', 1000),
    staleTime: 60000
  });

  // Cálculos
  const totalLikes = posts.reduce((sum, p) => sum + (p.total_curtidas || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.total_comentarios || 0), 0);
  const premiumUsers = users.filter(u => u.subscription_type === 'premium').length;
  const recruiterUsers = users.filter(u => u.subscription_type === 'recruiter').length;
  const basicUsers = users.filter(u => u.subscription_type === 'basic' || !u.subscription_type).length;

  // Dados por tipo de usuário
  const userTypeData = [
    { name: 'Básico', value: basicUsers, color: '#64748b' },
    { name: 'Premium', value: premiumUsers, color: '#22c55e' },
    { name: 'Recrutador', value: recruiterUsers, color: '#8b5cf6' },
  ];

  // Dados dos últimos 7 dias
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  const activityData = last7Days.map(day => {
    const dayVisits = visits.filter(v => v.created_date?.startsWith(day)).length;
    const dayPosts = posts.filter(p => p.created_date?.startsWith(day)).length;
    const dayJobs = jobs.filter(j => j.created_date?.startsWith(day)).length;
    const dayUsers = users.filter(u => u.created_date?.startsWith(day)).length;
    
    return {
      day: new Date(day).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      visitas: dayVisits,
      posts: dayPosts,
      vagas: dayJobs,
      usuarios: dayUsers
    };
  });

  // Jobs por tipo
  const jobsByType = jobs.reduce((acc, job) => {
    const type = job.job_type || 'Outros';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const jobTypeData = Object.entries(jobsByType).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Usuários', value: users.length, icon: Users, color: 'blue', change: `+${users.filter(u => {
      const d = new Date(u.created_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length} este mês` },
    { label: 'Vagas Publicadas', value: jobs.length, icon: Briefcase, color: 'green' },
    { label: 'Posts no Feed', value: posts.length, icon: FileText, color: 'purple' },
    { label: 'Visualizações', value: viewHistory.length, icon: Eye, color: 'cyan' },
    { label: 'Curtidas', value: totalLikes, icon: Heart, color: 'red' },
    { label: 'Comentários', value: totalComments, icon: MessageCircle, color: 'amber' },
    { label: 'Favoritos', value: favorites.length, icon: Bookmark, color: 'pink' },
    { label: 'Mensagens', value: messages.length, icon: MessageCircle, color: 'indigo' },
    { label: 'Visitas App', value: visits.length, icon: TrendingUp, color: 'emerald' },
    { label: 'Posts Salvos', value: savedPosts.length, icon: Bookmark, color: 'orange' },
    { label: 'Usuários Premium', value: premiumUsers, icon: Crown, color: 'yellow' },
    { label: 'Recrutadores', value: recruiterUsers, icon: UserPlus, color: 'violet' },
  ];

  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    cyan: 'from-cyan-500 to-cyan-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    violet: 'from-violet-500 to-violet-600',
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Analytics do App</h1>
          <p className="text-white/70 text-sm">Análises em tempo real de todo o aplicativo</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <Card key={i} className={`bg-gradient-to-br ${colorMap[stat.color]} text-white rounded-xl overflow-hidden`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/80">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    {stat.change && <p className="text-[10px] text-white/70 mt-1">{stat.change}</p>}
                  </div>
                  <stat.icon className="w-8 h-8 text-white/30" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico de Atividade */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Atividade dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="visitas" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Visitas" />
                <Area type="monotone" dataKey="posts" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Posts" />
                <Area type="monotone" dataKey="vagas" stroke="#0056ff" fill="#0056ff" fillOpacity={0.3} name="Vagas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tipos de Usuário */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Tipos de Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={userTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {userTypeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vagas por Tipo */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-green-600" />
                Vagas por Tipo de Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={jobTypeData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Resumo em tempo real */}
        <Card className="rounded-xl border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
              <Clock className="w-5 h-5" />
              Resumo em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{users.filter(u => {
                  const d = new Date(u.created_date);
                  const today = new Date();
                  return d.toDateString() === today.toDateString();
                }).length}</p>
                <p className="text-xs text-slate-600">Novos usuários hoje</p>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <p className="text-2xl font-bold text-green-600">{jobs.filter(j => {
                  const d = new Date(j.created_date);
                  const today = new Date();
                  return d.toDateString() === today.toDateString();
                }).length}</p>
                <p className="text-xs text-slate-600">Vagas hoje</p>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{posts.filter(p => {
                  const d = new Date(p.created_date);
                  const today = new Date();
                  return d.toDateString() === today.toDateString();
                }).length}</p>
                <p className="text-xs text-slate-600">Posts hoje</p>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <p className="text-2xl font-bold text-amber-600">{visits.filter(v => {
                  const d = new Date(v.created_date);
                  const today = new Date();
                  return d.toDateString() === today.toDateString();
                }).length}</p>
                <p className="text-xs text-slate-600">Visitas hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}