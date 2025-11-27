import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Users, Briefcase, MapPin, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0056ff', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsDashboard() {
  const { data: views = [] } = useQuery({
    queryKey: ['job-views'],
    queryFn: async () => {
      try {
        return await base44.entities.JobView.list('-created_date', 1000) || [];
      } catch (e) {
        console.error('Erro ao carregar visualizações:', e);
        return [];
      }
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      try {
        return await base44.entities.Job.list('-created_date', 500) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list('-created_date', 500) || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Estatísticas gerais
  const totalViews = views.length;
  const uniqueViewers = new Set(views.map(v => v.viewer_id)).size;
  const todayViews = views.filter(v => {
    const viewDate = new Date(v.created_date);
    const today = new Date();
    return viewDate.toDateString() === today.toDateString();
  }).length;

  // Visualizações por dia (últimos 7 dias)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayViews = views.filter(v => v.created_date?.startsWith(dateStr)).length;
    last7Days.push({
      date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      views: dayViews
    });
  }

  // Top vagas mais visualizadas
  const viewsByJob = {};
  views.forEach(v => {
    viewsByJob[v.job_id] = (viewsByJob[v.job_id] || 0) + 1;
  });
  const topJobs = Object.entries(viewsByJob)
    .map(([jobId, count]) => {
      const job = jobs.find(j => j.id === jobId);
      return { id: jobId, title: job?.title || 'Vaga removida', count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Visualizações por cidade
  const viewsByCity = {};
  views.forEach(v => {
    if (v.city) {
      viewsByCity[v.city] = (viewsByCity[v.city] || 0) + 1;
    }
  });
  const cityData = Object.entries(viewsByCity)
    .map(([city, count]) => ({ name: city, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Visualizações por dispositivo
  const viewsByDevice = {};
  views.forEach(v => {
    const device = v.device_type || 'unknown';
    viewsByDevice[device] = (viewsByDevice[device] || 0) + 1;
  });
  const deviceData = Object.entries(viewsByDevice)
    .map(([device, count]) => ({ 
      name: device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Outros', 
      value: count 
    }));

  // Calcular tendência (comparar últimos 7 dias com 7 dias anteriores)
  const last7DaysTotal = views.filter(v => {
    const viewDate = new Date(v.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return viewDate >= weekAgo;
  }).length;

  const previous7DaysTotal = views.filter(v => {
    const viewDate = new Date(v.created_date);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return viewDate >= twoWeeksAgo && viewDate < weekAgo;
  }).length;

  const trendPercentage = previous7DaysTotal > 0 
    ? Math.round(((last7DaysTotal - previous7DaysTotal) / previous7DaysTotal) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Total de Visualizações</p>
                <p className="text-3xl font-bold mt-1">{totalViews.toLocaleString()}</p>
              </div>
              <Eye className="w-10 h-10 text-blue-200" />
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              {trendPercentage >= 0 ? (
                <ArrowUp className="w-4 h-4 text-green-300" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-300" />
              )}
              <span className={trendPercentage >= 0 ? 'text-green-300' : 'text-red-300'}>
                {Math.abs(trendPercentage)}%
              </span>
              <span className="text-blue-200">vs semana anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Visitantes Únicos</p>
                <p className="text-3xl font-bold mt-1">{uniqueViewers.toLocaleString()}</p>
              </div>
              <Users className="w-10 h-10 text-green-200" />
            </div>
            <div className="mt-4 text-sm text-green-200">
              Taxa de retorno: {totalViews > 0 ? Math.round((totalViews / uniqueViewers) * 10) / 10 : 0}x
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Visualizações Hoje</p>
                <p className="text-3xl font-bold mt-1">{todayViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-200" />
            </div>
            <div className="mt-4 text-sm text-purple-200">
              Média: {last7Days.length > 0 ? Math.round(last7Days.reduce((a, b) => a + b.views, 0) / last7Days.length) : 0}/dia
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100">Vagas Ativas</p>
                <p className="text-3xl font-bold mt-1">{jobs.length}</p>
              </div>
              <Briefcase className="w-10 h-10 text-amber-200" />
            </div>
            <div className="mt-4 text-sm text-amber-200">
              Usuários: {users.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualizações ao longo do tempo */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0056ff]" />
              Visualizações nos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0056ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0056ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value, 'Visualizações']}
                />
                <Area type="monotone" dataKey="views" stroke="#0056ff" fill="url(#colorViews)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top vagas */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#0056ff]" />
              Vagas Mais Visualizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topJobs.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topJobs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="title" type="category" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [value, 'Visualizações']}
                  />
                  <Bar dataKey="count" fill="#0056ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Nenhuma visualização registrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por cidade */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0056ff]" />
              Visualizações por Cidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={cityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Dados de localização não disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por dispositivo */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0056ff]" />
              Visualizações por Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Dados de dispositivo não disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}