import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, Activity, Users, Eye, Calendar, Loader2, 
  RefreshCw, ChevronRight, Clock, MapPin, Briefcase, Newspaper,
  MessageCircle, Search, Filter as FilterIcon, Star, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function FluxoUsuarios() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Buscar atividades do dia selecionado
  const { data: activities = [], isLoading: loadingActivities, refetch } = useQuery({
    queryKey: ['user-activities', selectedDate],
    queryFn: async () => {
      const startDate = new Date(selectedDate + 'T00:00:00');
      const endDate = new Date(selectedDate + 'T23:59:59');
      
      return await base44.entities.UserActivity.filter({
        created_date: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      }, '-created_date', 1000);
    },
    refetchInterval: 30000,
    enabled: !loading,
  });

  // Buscar dados dos usuários
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    enabled: !loading,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-activities'] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // Agrupar atividades por usuário
  const userActivityMap = {};
  activities.forEach(activity => {
    if (!userActivityMap[activity.user_email]) {
      userActivityMap[activity.user_email] = [];
    }
    userActivityMap[activity.user_email].push(activity);
  });

  // Lista de usuários que tiveram atividade no dia
  const activeUsers = Object.keys(userActivityMap).map(email => {
    const userData = users.find(u => u.email === email);
    const userActivities = userActivityMap[email];
    const firstActivity = userActivities[0];
    
    return {
      email,
      name: userData?.custom_full_name || userData?.username || email,
      photo: userData?.profile_photo,
      activitiesCount: userActivities.length,
      firstActivity: firstActivity.created_date,
      lastActivity: userActivities[userActivities.length - 1].created_date
    };
  }).sort((a, b) => new Date(b.firstActivity) - new Date(a.firstActivity));

  // Filtrar usuários pela busca
  const filteredUsers = activeUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Estatísticas do dia
  const totalUsers = activeUsers.length;
  const totalActivities = activities.length;

  // Ícones por tipo de atividade
  const getActivityIcon = (type) => {
    const icons = {
      page_view: <Eye className="w-4 h-4" />,
      job_view: <Briefcase className="w-4 h-4" />,
      job_apply: <Briefcase className="w-4 h-4" />,
      job_favorite: <Star className="w-4 h-4" />,
      news_view: <Newspaper className="w-4 h-4" />,
      feed_post: <MessageCircle className="w-4 h-4" />,
      feed_comment: <MessageCircle className="w-4 h-4" />,
      profile_edit: <Users className="w-4 h-4" />,
      search: <Search className="w-4 h-4" />,
      filter: <FilterIcon className="w-4 h-4" />
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getActivityLabel = (activity) => {
    const labels = {
      page_view: `Visitou: ${activity.page_name || activity.activity_details?.page_name || 'Página'}`,
      job_view: `Visualizou vaga: ${activity.reference_title || 'Vaga'}`,
      job_apply: `Candidatou-se: ${activity.reference_title || 'Vaga'}`,
      job_favorite: `Favoritou: ${activity.reference_title || 'Vaga'}`,
      news_view: `Leu notícia: ${activity.reference_title || 'Notícia'}`,
      feed_post: 'Criou post no feed',
      feed_comment: 'Comentou no feed',
      profile_edit: 'Editou perfil',
      search: `Pesquisou: ${activity.activity_details?.query || ''}`,
      filter: 'Aplicou filtros'
    };
    return labels[activity.activity_type] || 'Atividade';
  };

  // Se um usuário foi selecionado, mostrar detalhes
  if (selectedUser) {
    const userActivities = userActivityMap[selectedUser.email] || [];
    
    return (
      <div className="min-h-screen bg-[#F3F2EF] pb-20">
        <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 mb-2 -ml-2"
              onClick={() => setSelectedUser(null)}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white/30">
                {selectedUser.photo ? (
                  <AvatarImage src={selectedUser.photo} alt={selectedUser.name} />
                ) : (
                  <AvatarFallback className="bg-white/20 text-white">
                    {selectedUser.name[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-white">{selectedUser.name}</h1>
                <p className="text-white/70 text-sm">{userActivities.length} atividades em {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {userActivities.map((activity, index) => (
                  <div key={activity.id || index} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {getActivityLabel(activity)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(activity.created_date).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <p className="text-white/70 text-sm">Rastreamento de atividades</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              className="text-white hover:bg-white/20"
              disabled={loadingActivities}
            >
              <RefreshCw className={`w-5 h-5 ${loadingActivities ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalUsers}</p>
                  <p className="text-xs text-slate-500">Usuários Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalActivities}</p>
                  <p className="text-xs text-slate-500">Total de Atividades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar usuário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingActivities ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0A66C2]" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchQuery ? 'Nenhum usuário encontrado' : 'Nenhuma atividade registrada neste dia'}</p>
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredUsers.map((userInfo) => (
                  <div 
                    key={userInfo.email} 
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(userInfo)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        {userInfo.photo ? (
                          <AvatarImage src={userInfo.photo} alt={userInfo.name} />
                        ) : (
                          <AvatarFallback className="bg-[#0A66C2]/10 text-[#0A66C2]">
                            {userInfo.name[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">
                            {userInfo.name}
                          </p>
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            {userInfo.activitiesCount} atividades
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>
                            Primeiro acesso: {new Date(userInfo.firstActivity).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}