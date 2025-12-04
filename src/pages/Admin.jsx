import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, Briefcase, MapPin, Trash2, Edit, X, Loader2, CheckCircle, 
  Shield, Search, Building2, Users, MessageSquare, Upload, Save,
  Check, XCircle, Clock, Crown, UserX, BarChart3, 
  Key, CreditCard, Globe, Star
} from "lucide-react";

import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import PaymentsManager from "@/components/admin/PaymentsManager";
import ChatManager from "@/components/admin/ChatManager";

import NotificationSender from "@/components/admin/NotificationSender";
import RecruiterRequestsPanel from "@/components/admin/RecruiterRequestsPanel";


const JOB_FUNCTIONS = [
  "Assistente administrativo", "Auxiliar administrativo", "Secretária executiva", "Recepcionista",
  "Atendente de escritório", "Office boy / Office girl", "Analista administrativo", "Contador",
  "Auxiliar contábil", "Analista financeiro", "Vendedor interno", "Vendedor externo",
  "Consultor comercial", "Promotor de vendas", "Gerente de vendas", "Social media",
  "Designer gráfico", "Copywriter", "Editor de vídeo", "Fotógrafo", "Programador front-end",
  "Programador back-end", "Desenvolvedor mobile", "Suporte técnico", "Técnico de informática",
  "Enfermeiro", "Técnico de enfermagem", "Farmacêutico", "Nutricionista", "Fisioterapeuta",
  "Psicólogo", "Cuidador de idosos", "Pedreiro", "Eletricista", "Pintor", "Motorista de aplicativo",
  "Motoboy", "Entregador", "Estoquista", "Auxiliar de serviços gerais", "Porteiro", "Segurança",
  "Cozinheiro", "Auxiliar de cozinha", "Garçom", "Atendente de lanchonete", "Professor",
  "Cabeleireiro", "Barbeiro", "Manicure", "Personal trainer", "Advogado", "Recrutador",
  "Analista de RH", "Operador de máquinas", "Soldador", "Agricultor", "Veterinário",
  "Assistente virtual", "Freelancer de design", "Mecânico", "Corretor de imóveis", "Outros"
];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [newCity, setNewCity] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: '', subtitle: '', content: '', image_url: '', video_url: '', category: 'Geral', author_name: '', is_featured: false
  });
  const [uploadingNewsImage, setUploadingNewsImage] = useState(false);
  const [showNewsNotification, setShowNewsNotification] = useState(false);
  const [lastCreatedNews, setLastCreatedNews] = useState(null);
  const queryClient = useQueryClient();



  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        // Permitir apenas o email específico ou role admin
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const result = await base44.entities.Job.list('-created_date', 500);
      return result || [];
    },
    staleTime: 120000,
    gcTime: 600000,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const result = await base44.entities.City.list('name', 500);
      return result || [];
    },
    staleTime: 300000,
    gcTime: 600000,
    retry: 3,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const result = await base44.entities.User.list('-created_date', 500);
      return result || [];
    },
    staleTime: 120000,
    gcTime: 600000,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const result = await base44.entities.Post.list('-created_date', 500);
      return result || [];
    },
    staleTime: 120000,
    gcTime: 600000,
    retry: 3,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: async () => {
      const result = await base44.entities.Comment.list('-created_date', 500);
      return result || [];
    },
    staleTime: 120000,
    gcTime: 600000,
    retry: 3,
  });

  const { data: newsList = [] } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const result = await base44.entities.News.list('-created_date', 100);
      return result || [];
    },
    staleTime: 120000,
    gcTime: 600000,
    retry: 3,
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      showToast('Vaga excluída com sucesso!');
    },
    onError: () => showToast('Erro ao excluir vaga', 'error')
  });

  // City Mutations
  const createCityMutation = useMutation({
    mutationFn: (name) => base44.entities.City.create({ name, state: 'PB' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setNewCity('');
      showToast('Cidade adicionada com sucesso!');
    },
    onError: () => showToast('Erro ao adicionar cidade', 'error')
  });

  const deleteCityMutation = useMutation({
    mutationFn: (id) => base44.entities.City.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      showToast('Cidade removida com sucesso!');
    },
    onError: () => showToast('Erro ao remover cidade', 'error')
  });

  // User Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('Usuário atualizado com sucesso!');
    },
    onError: () => showToast('Erro ao atualizar usuário', 'error')
  });

  // Post/Comment Mutations
  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Post.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      showToast('Post atualizado!');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      showToast('Post excluído!');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Comment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      showToast('Comentário atualizado!');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      showToast('Comentário excluído!');
    },
  });

  // News Mutations
  const createNewsMutation = useMutation({
    mutationFn: (data) => base44.entities.News.create(data),
    onSuccess: (createdNews) => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      setLastCreatedNews({
        id: createdNews?.id,
        title: newsForm.title
      });
      setNewsForm({ title: '', subtitle: '', content: '', image_url: '', video_url: '', category: 'Geral', author_name: '', is_featured: false });
      setShowNewsForm(false);
      setShowNewsNotification(true);
      showToast('Notícia publicada!');
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      showToast('Notícia excluída!');
    },
  });

  const approveUser = (userId, subscriptionType = 'basic') => {
    updateUserMutation.mutate({
      id: userId,
      data: {
        access_status: 'approved',
        subscription_type: subscriptionType,
        subscription_date: new Date().toISOString()
      }
    });
  };

  const rejectUser = (userId) => {
    updateUserMutation.mutate({
      id: userId,
      data: { access_status: 'rejected' }
    });
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCities = cities.filter(city =>
    city.name?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const pendingUsers = users.filter(u => u.access_status === 'pending' || !u.access_status);
  const pendingPosts = posts.filter(p => p.status === 'pending');
  const pendingComments = comments.filter(c => c.status === 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
            : 'bg-gradient-to-r from-[#0056ff] to-[#0044cc] text-white'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          </div>
          <p className="text-white/70">Gerencie vagas, usuários e comunidade</p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-4">
            {pendingUsers.length > 0 && (
              <Badge className="bg-amber-500 text-white border-0 px-3 py-1">
                <Clock className="w-3 h-3 mr-1" />
                {pendingUsers.length} usuário(s) pendente(s)
              </Badge>
            )}
            {pendingPosts.length > 0 && (
              <Badge className="bg-purple-500 text-white border-0 px-3 py-1">
                <MessageSquare className="w-3 h-3 mr-1" />
                {pendingPosts.length} post(s) pendente(s)
              </Badge>
            )}
            {pendingComments.length > 0 && (
              <Badge className="bg-pink-500 text-white border-0 px-3 py-1">
                <MessageSquare className="w-3 h-3 mr-1" />
                {pendingComments.length} comentário(s) pendente(s)
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-white shadow-sm rounded-xl p-1 grid grid-cols-2 sm:grid-cols-4 gap-1 w-full">
            <TabsTrigger value="jobs" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Vagas</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-[#0056ff] data-[state=active]:text-white relative">
              <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Comunicação</span>
              {(pendingPosts.length + pendingComments.length) > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-purple-500 text-white border-0 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {pendingPosts.length + pendingComments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics-internal" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Análises</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-[#0056ff] data-[state=active]:text-white relative">
              <Shield className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Config</span>
              {pendingUsers.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-amber-500 text-white border-0 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Jobs List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Vagas Cadastradas ({jobs.length})</h3>
              {jobs.map((job) => (
                <Card key={job.id} className="rounded-xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-slate-800">{job.title || 'Não informado'}</h4>
                          {job.is_premium && (
                            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {job.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">Destaque</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {job.company || 'Não informado'}
                          <span className="mx-1">•</span>
                          <MapPin className="w-4 h-4" />
                          {job.city || 'Não informado'}
                        </p>
                      </div>
                      <div className="flex gap-2">

                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteJobMutation.mutate(job.id)}
                          className="rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Communication Tab - Contains Community, News, Chat */}
          <TabsContent value="communication" className="space-y-6">
            <Tabs defaultValue="community" className="space-y-4">
              <TabsList className="bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="community" className="rounded-lg">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comunidade
                  {(pendingPosts.length + pendingComments.length) > 0 && (
                    <Badge className="ml-2 bg-purple-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingPosts.length + pendingComments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="news" className="rounded-lg">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Notícias
                </TabsTrigger>
                <TabsTrigger value="chat" className="rounded-lg">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
              </TabsList>

              {/* Community Sub-Tab */}
              <TabsContent value="community" className="space-y-6">
            {/* Pending Posts */}
            {pendingPosts.length > 0 && (
              <Card className="rounded-xl border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                    <Clock className="w-5 h-5" />
                    Posts Pendentes ({pendingPosts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingPosts.map((post) => (
                    <div key={post.id} className="p-4 bg-white rounded-xl">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={post.author_photo} />
                          <AvatarFallback className="bg-purple-200 text-purple-700">
                            {post.author_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{post.author_name}</p>
                          <p className="text-sm text-slate-500">{post.author_email}</p>
                        </div>
                      </div>
                      <p className="text-slate-700 mb-4">{post.content}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => updatePostMutation.mutate({ id: post.id, data: { status: 'approved' } })}
                          className="bg-green-600 hover:bg-green-700 rounded-lg"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => updatePostMutation.mutate({ id: post.id, data: { status: 'rejected' } })}
                          className="rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          className="rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Pending Comments */}
            {pendingComments.length > 0 && (
              <Card className="rounded-xl border-pink-200 bg-pink-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-800">
                    <Clock className="w-5 h-5" />
                    Comentários Pendentes ({pendingComments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingComments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-white rounded-xl">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.author_photo} />
                          <AvatarFallback className="bg-pink-200 text-pink-700 text-xs">
                            {comment.author_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-800">{comment.author_name}</p>
                          <p className="text-slate-700">{comment.content}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => updateCommentMutation.mutate({ id: comment.id, data: { status: 'approved' } })}
                          className="bg-green-600 hover:bg-green-700 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* All Posts */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Posts Aprovados ({posts.filter(p => p.status === 'approved').length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {posts.filter(p => p.status === 'approved').map((post) => (
                      <div key={post.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={post.author_photo} />
                            <AvatarFallback className="bg-[#0056ff] text-white">
                              {post.author_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{post.author_name}</p>
                            <p className="text-slate-600 text-sm line-clamp-2">{post.content}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
              </TabsContent>

              {/* News Sub-Tab */}
              <TabsContent value="news" className="space-y-6">
            {!showNewsForm && (
              <Button 
                onClick={() => setShowNewsForm(true)}
                className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Notícia
              </Button>
            )}

            {showNewsForm && (
                <div className="animate-fade-in">
                  <Card className="shadow-lg rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Nova Notícia
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowNewsForm(false)} className="text-white hover:bg-white/20">
                          <X className="w-5 h-5" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6">
                        <form onSubmit={(e) => { e.preventDefault(); createNewsMutation.mutate(newsForm); }} className="space-y-6">
                          {/* Título */}
                          <div className="space-y-2">
                            <Label className="text-base font-semibold">Título da Notícia</Label>
                            <Input
                              value={newsForm.title}
                              onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                              placeholder="Digite o título da notícia..."
                              className="rounded-lg h-12 text-lg"
                              maxLength={500}
                            />
                            <p className="text-xs text-slate-400">{newsForm.title?.length || 0}/500 caracteres</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Categoria</Label>
                              <Select value={newsForm.category} onValueChange={(v) => setNewsForm({...newsForm, category: v})}>
                                <SelectTrigger className="rounded-lg h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Mercado de Trabalho">Mercado de Trabalho</SelectItem>
                                  <SelectItem value="Dicas de Emprego">Dicas de Emprego</SelectItem>
                                  <SelectItem value="Economia">Economia</SelectItem>
                                  <SelectItem value="Cursos">Cursos</SelectItem>
                                  <SelectItem value="Eventos">Eventos</SelectItem>
                                  <SelectItem value="Geral">Geral</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Autor (opcional)</Label>
                              <Input
                                value={newsForm.author_name}
                                onChange={(e) => setNewsForm({...newsForm, author_name: e.target.value})}
                                placeholder="Nome do autor"
                                className="rounded-lg h-11"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Subtítulo / Chamada (opcional)</Label>
                            <Input
                              value={newsForm.subtitle}
                              onChange={(e) => setNewsForm({...newsForm, subtitle: e.target.value})}
                              placeholder="Uma breve descrição que aparece abaixo do título..."
                              className="rounded-lg"
                              maxLength={1000}
                            />
                          </div>

                          {/* Imagem Principal */}
                          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Imagem Principal
                            </Label>

                            {newsForm.image_url && (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-3">
                                <img src={newsForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                  onClick={() => setNewsForm({...newsForm, image_url: ''})}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                              <label className="flex-1 cursor-pointer">
                                <input 
                                  type="file" 
                                  accept="image/*,video/*,.gif,.webp,.svg,.png,.jpg,.jpeg,.bmp,.ico"
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    e.target.value = '';
                                    setUploadingNewsImage(true);
                                    try {
                                      const result = await base44.integrations.Core.UploadFile({ file });
                                      if (result?.file_url) {
                                        setNewsForm(prev => ({...prev, image_url: result.file_url}));
                                        showToast('Imagem carregada!');
                                      }
                                    } catch (err) {
                                      showToast('Erro ao carregar imagem', 'error');
                                    } finally {
                                      setUploadingNewsImage(false);
                                    }
                                  }}
                                />
                                <div className={`flex items-center justify-center gap-2 h-12 px-4 rounded-lg border-2 border-dashed transition-colors ${uploadingNewsImage ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                                  {uploadingNewsImage ? (
                                    <><Loader2 className="w-5 h-5 animate-spin text-blue-600" /><span className="text-blue-600">Enviando...</span></>
                                  ) : (
                                    <><Upload className="w-5 h-5 text-slate-500" /><span className="text-slate-600">Escolher arquivo</span></>
                                  )}
                                </div>
                              </label>
                              <div className="flex-1">
                                <Input
                                  value={newsForm.image_url}
                                  onChange={(e) => setNewsForm({...newsForm, image_url: e.target.value})}
                                  placeholder="Ou cole a URL da imagem..."
                                  className="rounded-lg h-12"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-400">Aceita: JPG, PNG, GIF, WebP, SVG e outros formatos</p>
                          </div>

                          {/* Vídeo */}
                          <div className="space-y-2">
                            <Label>Vídeo do YouTube (opcional)</Label>
                            <Input
                              value={newsForm.video_url}
                              onChange={(e) => setNewsForm({...newsForm, video_url: e.target.value})}
                              placeholder="Cole o link do YouTube aqui..."
                              className="rounded-lg"
                            />
                          </div>

                          {/* Conteúdo */}
                          <div className="space-y-2">
                            <Label className="text-base font-semibold">Conteúdo da Notícia</Label>
                            <Textarea
                              value={newsForm.content}
                              onChange={(e) => setNewsForm({...newsForm, content: e.target.value.slice(0, 50000)})}
                              placeholder="Escreva o conteúdo completo da notícia aqui...

            Dica: Use parágrafos para organizar melhor o texto. Você pode escrever notícias longas com até 50.000 caracteres."
                              className="rounded-lg min-h-[300px] text-base leading-relaxed"
                              maxLength={50000}
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>Suporta texto longo, parágrafos e quebras de linha</span>
                              <span>{newsForm.content?.length || 0}/50.000 caracteres</span>
                            </div>
                          </div>

                          {/* Destaque */}
                          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Star className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">Notícia em Destaque</p>
                                <p className="text-xs text-slate-500">Aparece em primeiro lugar na página</p>
                              </div>
                            </div>
                            <Switch
                              checked={newsForm.is_featured}
                              onCheckedChange={(v) => setNewsForm({...newsForm, is_featured: v})}
                            />
                          </div>

                          <div className="flex gap-3 pt-4 border-t">
                            <Button 
                              type="submit" 
                              className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl h-12 text-base"
                              disabled={createNewsMutation.isPending || !newsForm.title}
                            >
                              {createNewsMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                              Publicar Notícia
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowNewsForm(false)} className="rounded-xl h-12">
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                )}

            {/* Notification Sender for News */}
            {showNewsNotification && lastCreatedNews && (
              <NotificationSender
                showToast={showToast}
                news={lastCreatedNews}
                notificationType="news"
                onClose={() => setShowNewsNotification(false)}
              />
            )}

            {/* News List */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Notícias Publicadas ({newsList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {newsList.map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-start gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-16 h-12 object-cover rounded-lg" />
                          )}
                          <div>
                            <p className="font-medium text-slate-800 line-clamp-1">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{item.category}</Badge>
                              {item.is_featured && <Badge className="bg-red-100 text-red-700 text-xs">Destaque</Badge>}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNewsMutation.mutate(item.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
              </TabsContent>

              {/* Chat Sub-Tab in Communication */}
              <TabsContent value="chat">
                <ChatManager showToast={showToast} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Analytics Internal Tab - Contains Cities, Analytics */}
          <TabsContent value="analytics-internal" className="space-y-6">
            <Tabs defaultValue="analytics" className="space-y-4">
              <TabsList className="bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="analytics" className="rounded-lg">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="cities" className="rounded-lg">
                  <MapPin className="w-4 h-4 mr-2" />
                  Cidades
                </TabsTrigger>
              </TabsList>

              {/* Analytics Sub-Tab */}
              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>

              {/* Cities Sub-Tab */}
              <TabsContent value="cities" className="space-y-6">
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Input
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Nome da cidade"
                    className="rounded-lg"
                  />
                  <Button 
                    onClick={() => newCity && createCityMutation.mutate(newCity)}
                    disabled={!newCity || createCityMutation.isPending}
                    className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Pesquisar cidade..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Cidades Cadastradas ({cities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredCities.map((city) => (
                      <div 
                        key={city.id} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-sm text-slate-700">{city.name}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={() => deleteCityMutation.mutate(city.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>



          {/* Settings Tab - Contains Users, Codes, Payments */}
          <TabsContent value="settings" className="space-y-6">
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className="bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="users" className="rounded-lg">
                  <Users className="w-4 h-4 mr-2" />
                  Usuários
                  {pendingUsers.length > 0 && (
                    <Badge className="ml-2 bg-amber-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingUsers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="requests" className="rounded-lg">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Solicitações
                </TabsTrigger>
                <TabsTrigger value="payments" className="rounded-lg">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagamentos
                </TabsTrigger>
              </TabsList>

              {/* Users Sub-Tab */}
              <TabsContent value="users" className="space-y-6">
                {/* Pending Users */}
                {pendingUsers.length > 0 && (
                  <Card className="rounded-xl border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                        <Clock className="w-5 h-5" />
                        Usuários Pendentes ({pendingUsers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pendingUsers.map((u) => (
                        <div key={u.id} className="p-4 bg-white rounded-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={u.profile_photo} />
                              <AvatarFallback className="bg-amber-200 text-amber-700">
                                {u.full_name?.[0] || u.email?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">{u.full_name || 'Sem nome'}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Select onValueChange={(type) => approveUser(u.id, type)}>
                              <SelectTrigger className="flex-1 min-w-[140px] h-9 rounded-lg text-sm">
                                <SelectValue placeholder="Aprovar como..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="visitor">Visitante</SelectItem>
                                <SelectItem value="basic">Membro Básico</SelectItem>
                                <SelectItem value="premium">Membro Premium</SelectItem>
                                <SelectItem value="recruiter">Recrutador</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => rejectUser(u.id)}
                              className="h-9 px-3 rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Rejeitar</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Search Users */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Pesquisar usuário..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>

                {/* All Users */}
                <Card className="rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Todos os Usuários ({users.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {filteredUsers.map((u) => (
                          <div key={u.id} className="p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                <AvatarImage src={u.profile_photo} />
                                <AvatarFallback className="bg-[#0056ff] text-white text-sm">
                                  {u.full_name?.[0] || u.email?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 text-sm truncate">{u.full_name || 'Sem nome'}</p>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge className={`text-xs ${
                                    u.subscription_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    u.subscription_type === 'recruiter' ? 'bg-purple-100 text-purple-600' :
                                    u.subscription_type === 'premium' ? 'bg-green-100 text-green-700' :
                                    u.subscription_type === 'basic' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {u.subscription_type === 'admin' ? 'Admin' :
                                     u.subscription_type === 'recruiter' ? 'Recrutador' :
                                     u.subscription_type === 'premium' ? 'Premium' :
                                     u.subscription_type === 'basic' ? 'Básico' :
                                     'Visitante'}
                                  </Badge>
                                  <Badge className={`text-xs ${
                                    u.access_status === 'approved' ? 'bg-green-100 text-green-700' :
                                    u.access_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    u.access_status === 'blocked' ? 'bg-orange-100 text-orange-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {u.access_status === 'approved' ? 'Aprovado' :
                                     u.access_status === 'rejected' ? 'Rejeitado' :
                                     u.access_status === 'blocked' ? 'Bloqueado' :
                                     'Pendente'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Select 
                                value={u.subscription_type || 'visitor'}
                                onValueChange={(type) => updateUserMutation.mutate({ 
                                  id: u.id, 
                                  data: { 
                                    subscription_type: type,
                                    access_status: 'approved'
                                  } 
                                })}
                              >
                                <SelectTrigger className="w-24 h-8 rounded-lg text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="visitor">Visitante</SelectItem>
                                  <SelectItem value="basic">Básico</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                  <SelectItem value="recruiter">Recrutador</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateUserMutation.mutate({ 
                                  id: u.id, 
                                  data: { access_status: u.access_status === 'blocked' ? 'approved' : 'blocked' } 
                                })}
                                className={`h-8 rounded-lg text-xs ${u.access_status === 'blocked' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                              >
                                <UserX className="w-3 h-3 mr-1" />
                                {u.access_status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Excluir usuário ${u.full_name || u.email}?`)) {
                                    base44.entities.User.delete(u.id).then(() => {
                                      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                                      showToast('Usuário excluído!');
                                    });
                                  }
                                }}
                                className="h-8 rounded-lg text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recruiter Requests Sub-Tab */}
              <TabsContent value="requests">
                <RecruiterRequestsPanel showToast={showToast} />
              </TabsContent>

              {/* Payments Sub-Tab */}
              <TabsContent value="payments">
                <PaymentsManager showToast={showToast} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}