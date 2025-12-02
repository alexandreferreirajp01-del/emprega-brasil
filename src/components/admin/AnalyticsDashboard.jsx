import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, TrendingUp, Users, Briefcase, MapPin, Calendar, ArrowUp, ArrowDown, Filter, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#0056ff', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsDashboard() {
  // Filtros de data - temporários (antes de aplicar)
  const [tempStartDate, setTempStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [tempEndDate, setTempEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Filtros aplicados
  const [startDate, setStartDate] = useState(tempStartDate);
  const [endDate, setEndDate] = useState(tempEndDate);

  const applyFilters = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
  };

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

  const { data: appVisits = [] } = useQuery({
    queryKey: ['app-visits'],
    queryFn: async () => {
      try {
        return await base44.entities.AppVisit.list('-created_date', 2000) || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Filtrar visualizações pelo período selecionado
  const filteredViews = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return views.filter(v => {
      const viewDate = new Date(v.created_date);
      return viewDate >= start && viewDate <= end;
    });
  }, [views, startDate, endDate]);

  // Estatísticas gerais (baseadas no período filtrado)
  const totalViews = filteredViews.length;
  const uniqueViewers = new Set(filteredViews.map(v => v.viewer_id)).size;
  const todayViews = views.filter(v => {
    const viewDate = new Date(v.created_date);
    const today = new Date();
    return viewDate.toDateString() === today.toDateString();
  }).length;
  
  // Estatísticas de visitas ao app
  const totalAppVisits = appVisits.length;
  const uniqueAppVisitors = new Set(appVisits.map(v => v.visitor_id)).size;

  // Visualizações por dia no período selecionado
  const dailyViews = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayViews = views.filter(v => v.created_date?.startsWith(dateStr)).length;
      days.push({
        date: current.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        views: dayViews,
        fullDate: dateStr
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [views, startDate, endDate]);

  // Top vagas mais visualizadas (no período)
  const topJobs = useMemo(() => {
    const viewsByJob = {};
    filteredViews.forEach(v => {
      viewsByJob[v.job_id] = (viewsByJob[v.job_id] || 0) + 1;
    });
    return Object.entries(viewsByJob)
      .map(([jobId, count]) => {
        const job = jobs.find(j => j.id === jobId);
        return { id: jobId, title: job?.title || 'Vaga removida', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredViews, jobs]);

  // Visualizações por cidade (no período)
  const cityData = useMemo(() => {
    const viewsByCity = {};
    filteredViews.forEach(v => {
      if (v.city) {
        viewsByCity[v.city] = (viewsByCity[v.city] || 0) + 1;
      }
    });
    return Object.entries(viewsByCity)
      .map(([city, count]) => ({ name: city, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredViews]);

  // Visualizações por dispositivo (no período)
  const deviceData = useMemo(() => {
    const viewsByDevice = {};
    filteredViews.forEach(v => {
      const device = v.device_type || 'unknown';
      viewsByDevice[device] = (viewsByDevice[device] || 0) + 1;
    });
    return Object.entries(viewsByDevice)
      .map(([device, count]) => ({ 
        name: device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Outros', 
        value: count 
      }));
  }, [filteredViews]);

  // Visualizações por hora do dia
  const hourlyData = useMemo(() => {
    const viewsByHour = {};
    for (let i = 0; i < 24; i++) {
      viewsByHour[i] = 0;
    }
    filteredViews.forEach(v => {
      if (v.created_date) {
        const hour = new Date(v.created_date).getHours();
        viewsByHour[hour] = (viewsByHour[hour] || 0) + 1;
      }
    });
    return Object.entries(viewsByHour).map(([hour, count]) => ({
      hour: `${hour}h`,
      views: count
    }));
  }, [filteredViews]);

  // Visualizações por dia da semana
  const weekdayData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const viewsByDay = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    filteredViews.forEach(v => {
      if (v.created_date) {
        const day = new Date(v.created_date).getDay();
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;
      }
    });
    return Object.entries(viewsByDay).map(([day, count]) => ({
      day: days[parseInt(day)],
      views: count
    }));
  }, [filteredViews]);

  // Crescimento semanal
  const weeklyGrowth = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      const weekViews = views.filter(v => {
        const viewDate = new Date(v.created_date);
        return viewDate >= weekStart && viewDate <= weekEnd;
      }).length;
      
      weeks.push({
        week: `Semana ${4 - i}`,
        views: weekViews
      });
    }
    return weeks;
  }, [views]);

  // Calcular tendência (comparar período atual com período anterior de mesma duração)
  const periodDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
  
  const previousPeriodViews = useMemo(() => {
    const end = new Date(startDate);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - periodDays + 1);
    
    return views.filter(v => {
      const viewDate = new Date(v.created_date);
      return viewDate >= start && viewDate <= end;
    }).length;
  }, [views, startDate, periodDays]);

  const trendPercentage = previousPeriodViews > 0 
    ? Math.round(((totalViews - previousPeriodViews) / previousPeriodViews) * 100)
    : 100;

  // Dados de visitantes por tipo de plano ao longo do tempo
  const visitorsByPlanData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Contar visitas por tipo de usuário nesse dia
      const dayVisits = appVisits.filter(v => v.created_date?.startsWith(dateStr));
      
      let visitors = 0;
      let basic = 0;
      let premium = 0;
      
      dayVisits.forEach(visit => {
        const visitUser = users.find(u => u.email === visit.user_email);
        if (!visitUser || !visit.user_email) {
          visitors++;
        } else if (visitUser.subscription_type === 'premium' || visitUser.subscription_type === 'admin' || visitUser.role === 'admin') {
          premium++;
        } else if (visitUser.subscription_type === 'basic') {
          basic++;
        } else {
          visitors++;
        }
      });
      
      days.push({
        date: current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        visitantes: visitors,
        basico: basic,
        premium: premium,
        fullDate: dateStr
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [appVisits, users, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Filtros de Data */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700">Período:</span>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:flex gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Data Inicial</Label>
                <Input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="rounded-lg h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Data Final</Label>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="rounded-lg h-9"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  setTempStartDate(d.toISOString().split('T')[0]);
                  setTempEndDate(new Date().toISOString().split('T')[0]);
                }}
                className="rounded-lg text-xs"
              >
                Última semana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  setTempStartDate(d.toISOString().split('T')[0]);
                  setTempEndDate(new Date().toISOString().split('T')[0]);
                }}
                className="rounded-lg text-xs"
              >
                Último mês
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
                className="rounded-lg text-xs bg-[#0056ff] hover:bg-[#0044cc]"
              >
                <Check className="w-4 h-4 mr-1" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Exibindo dados de {periodDays} dia{periodDays !== 1 ? 's' : ''} 
            {previousPeriodViews > 0 && (
              <span className={trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                {' '}({trendPercentage >= 0 ? '+' : ''}{trendPercentage}% vs período anterior)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

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
              Média: {dailyViews.length > 0 ? Math.round(dailyViews.reduce((a, b) => a + b.views, 0) / dailyViews.length) : 0}/dia
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

      {/* Cards de Visitas ao App */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-100">Visitas ao App</p>
                <p className="text-3xl font-bold mt-1">{totalAppVisits.toLocaleString()}</p>
              </div>
              <Eye className="w-10 h-10 text-indigo-200" />
            </div>
            <div className="mt-4 text-sm text-indigo-200">
              Total de acessos registrados
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-100">Visitantes Únicos (App)</p>
                <p className="text-3xl font-bold mt-1">{uniqueAppVisitors.toLocaleString()}</p>
              </div>
              <Users className="w-10 h-10 text-teal-200" />
            </div>
            <div className="mt-4 text-sm text-teal-200">
              Pessoas diferentes acessaram
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
              Visualizações no Período ({dailyViews.length} dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyViews}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0056ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0056ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value, 'Visualizações']}
                  labelFormatter={(label) => `Data: ${label}`}
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

        {/* Por hora do dia */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0056ff]" />
              Horários de Maior Tráfego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#00C49F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por dia da semana */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0056ff]" />
              Tráfego por Dia da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#FFBB28" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crescimento semanal */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0056ff]" />
              Crescimento Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyGrowth}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#8884d8" fill="url(#colorGrowth)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Visitantes por Tipo de Plano */}
        <Card className="rounded-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0056ff]" />
              Visitantes por Tipo de Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visitorsByPlanData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visitantes" 
                  name="Visitantes" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="basico" 
                  name="Básico" 
                  stroke="#0056ff" 
                  strokeWidth={2} 
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="premium" 
                  name="Premium" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}