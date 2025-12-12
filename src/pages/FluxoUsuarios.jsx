import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, Activity, Users, TrendingUp, Clock, LogIn, LogOut, 
  Calendar, Filter, Loader2, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FluxoUsuarios() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('today');
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
    const checkAuth = async () => {
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
    checkAuth();
  }, []);

  // Buscar todas as sessões
  const { data: allSessions = [], isLoading: loadingSessions, refetch } = useQuery({
    queryKey: ['user-sessions', periodFilter],
    queryFn: async () => {
      let filter = {};
      const now = new Date();
      
      if (periodFilter === 'today') {
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        filter.session_start = { $gte: todayStart };
      } else if (periodFilter === 'week') {
        const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();
        filter.session_start = { $gte: weekStart };
      } else if (periodFilter === 'month') {
        const monthStart = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        filter.session_start = { $gte: monthStart };
      }
      
      return await base44.entities.UserSession.filter(filter, '-session_start', 500);
    },
    refetchInterval: 15000, // Atualiza a cada 15 segundos
    enabled: !loading,
  });

  // Buscar dados dos usuários
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    enabled: !loading,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // Estatísticas
  const activeSessions = allSessions.filter(s => s.is_active);
  const uniqueUsersToday = new Set(allSessions.filter(s => {
    const sessionDate = new Date(s.session_start);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  }).map(s => s.user_email)).size;

  const totalEntries = allSessions.length;
  const totalExits = allSessions.filter(s => s.session_end).length;

  // Agrupar sessões por usuário
  const userSessionsMap = {};
  allSessions.forEach(session => {
    if (!userSessionsMap[session.user_email]) {
      userSessionsMap[session.user_email] = [];
    }
    userSessionsMap[session.user_email].push(session);
  });

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Fluxo de Usuários
              </h1>
              <p className="text-white/70 text-sm">Monitoramento em tempo real</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              className="text-white hover:bg-white/20"
              disabled={loadingSessions}
            >
              <RefreshCw className={`w-5 h-5 ${loadingSessions ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{activeSessions.length}</p>
                  <p className="text-xs text-slate-500">Online Agora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{uniqueUsersToday}</p>
                  <p className="text-xs text-slate-500">Usuários Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalEntries}</p>
                  <p className="text-xs text-slate-500">Entradas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalExits}</p>
                  <p className="text-xs text-slate-500">Saídas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtro de Período */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-slate-400" />
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-48 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Sessões */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Sessões Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSessions ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0A66C2]" />
              </div>
            ) : allSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma sessão encontrada</p>
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {allSessions.slice(0, 50).map((session) => {
                  const userData = users.find(u => u.email === session.user_email);
                  const isActive = session.is_active;
                  const duration = session.session_end 
                    ? Math.round((new Date(session.session_end) - new Date(session.session_start)) / 1000 / 60)
                    : null;

                  return (
                    <div key={session.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          {userData?.profile_photo ? (
                            <AvatarImage src={userData.profile_photo} alt={userData.full_name} />
                          ) : (
                            <AvatarFallback className="bg-[#0A66C2]/10 text-[#0A66C2]">
                              {userData?.full_name?.[0]?.toUpperCase() || session.user_email?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">
                              {userData?.full_name || session.user_email}
                            </p>
                            {isActive && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <Activity className="w-3 h-3 mr-1" />
                                Online
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <LogIn className="w-3 h-3" />
                              {new Date(session.session_start).toLocaleString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {session.session_end && (
                              <>
                                <span className="flex items-center gap-1">
                                  <LogOut className="w-3 h-3" />
                                  {new Date(session.session_end).toLocaleString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {duration !== null && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {duration}min
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}