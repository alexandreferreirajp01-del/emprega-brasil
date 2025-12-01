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
  Key, CreditCard, Globe
} from "lucide-react";

import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import ViewsMap from "@/components/admin/ViewsMap";
import PremiumCodesManager from "@/components/admin/PremiumCodesManager";
import PaymentsManager from "@/components/admin/PaymentsManager";
import ChatManager from "@/components/admin/ChatManager";
import SocialAdminPanel from "@/components/admin/SocialAdminPanel";


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
      try {
        return await base44.entities.Job.list('-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar vagas:', e);
        return [];
      }
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      try {
        return await base44.entities.City.list('name', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar cidades:', e);
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
        console.error('Erro ao carregar usuários:', e);
        return [];
      }
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      try {
        return await base44.entities.Post.list('-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar posts:', e);
        return [];
      }
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: async () => {
      try {
        return await base44.entities.Comment.list('-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar comentários:', e);
        return [];
      }
    },
  });

  const { data: newsList = [] } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      try {
        return await base44.entities.News.list('-created_date', 100) || [];
      } catch (e) {
        console.error('Erro ao carregar notícias:', e);
        return [];
      }
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      setNewsForm({ title: '', subtitle: '', content: '', image_url: '', video_url: '', category: 'Geral', author_name: '', is_featured: false });
      setShowNewsForm(false);
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
          <TabsList className="bg-white shadow-sm rounded-xl p-1 flex-wrap">
            <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />
              Vagas
            </TabsTrigger>
            <TabsTrigger value="communication" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comunicação
              {(pendingPosts.length + pendingComments.length) > 0 && (
                <Badge className="ml-2 bg-purple-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingPosts.length + pendingComments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics-internal" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Análises Internas
            </TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
                <Shield className="w-4 h-4 mr-2" />
                Configurações
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
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Nova Notícia</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setShowNewsForm(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={(e) => { e.preventDefault(); createNewsMutation.mutate(newsForm); }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                              value={newsForm.title}
                              onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                              placeholder="Título da notícia"
                              className="rounded-lg"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={newsForm.category} onValueChange={(v) => setNewsForm({...newsForm, category: v})}>
                              <SelectTrigger className="rounded-lg">
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
                        </div>

                        <div className="space-y-2">
                          <Label>Subtítulo</Label>
                          <Input
                            value={newsForm.subtitle}
                            onChange={(e) => setNewsForm({...newsForm, subtitle: e.target.value})}
                            placeholder="Subtítulo (opcional)"
                            className="rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Conteúdo</Label>
                          <Textarea
                            value={newsForm.content}
                            onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                            placeholder="Escreva o conteúdo da notícia..."
                            className="rounded-lg min-h-[200px]"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Imagem</Label>
                            <div className="flex gap-2">
                              <Input
                                value={newsForm.image_url}
                                onChange={(e) => setNewsForm({...newsForm, image_url: e.target.value})}
                                placeholder="URL da imagem ou faça upload"
                                className="rounded-lg flex-1"
                              />
                              <label className="cursor-pointer inline-block">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  capture="environment"
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
                                      } else {
                                        throw new Error('URL não retornada');
                                      }
                                    } catch (err) {
                                      console.error('Erro upload:', err);
                                      showToast('Erro ao carregar imagem', 'error');
                                    } finally {
                                      setUploadingNewsImage(false);
                                    }
                                  }}
                                />
                                <Button type="button" variant="outline" disabled={uploadingNewsImage} className="rounded-lg pointer-events-none">
                                  {uploadingNewsImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                </Button>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Vídeo (YouTube)</Label>
                            <Input
                              value={newsForm.video_url}
                              onChange={(e) => setNewsForm({...newsForm, video_url: e.target.value})}
                              placeholder="URL do vídeo do YouTube"
                              className="rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Autor</Label>
                            <Input
                              value={newsForm.author_name}
                              onChange={(e) => setNewsForm({...newsForm, author_name: e.target.value})}
                              placeholder="Nome do autor"
                              className="rounded-lg"
                            />
                          </div>
                          <div className="flex items-center space-x-3 pt-6">
                            <Switch
                              checked={newsForm.is_featured}
                              onCheckedChange={(v) => setNewsForm({...newsForm, is_featured: v})}
                            />
                            <Label>Notícia em Destaque</Label>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button 
                            type="submit" 
                            className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                            disabled={createNewsMutation.isPending}
                          >
                            {createNewsMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            Publicar
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowNewsForm(false)} className="rounded-xl">
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
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

          {/* Analytics Internal Tab - Contains Cities, Analytics, Map */}
          <TabsContent value="analytics-internal" className="space-y-6">
            <Tabs defaultValue="analytics" className="space-y-4">
              <TabsList className="bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="analytics" className="rounded-lg">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="map" className="rounded-lg">
                  <Globe className="w-4 h-4 mr-2" />
                  Mapa
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

              {/* Map Sub-Tab */}
              <TabsContent value="map">
                <ViewsMap />
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

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <SocialAdminPanel showToast={showToast} />
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
                <TabsTrigger value="codes" className="rounded-lg">
                  <Key className="w-4 h-4 mr-2" />
                  Códigos
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
                        <div key={u.id} className="flex items-center justify-between p-4 bg-white rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={u.profile_photo} />
                              <AvatarFallback className="bg-amber-200 text-amber-700">
                                {u.full_name?.[0] || u.email?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-800">{u.full_name || 'Sem nome'}</p>
                              <p className="text-sm text-slate-500">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Select onValueChange={(type) => approveUser(u.id, type)}>
                              <SelectTrigger className="w-40 rounded-lg">
                                <SelectValue placeholder="Aprovar como..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="visitor">Visitante</SelectItem>
                                <SelectItem value="basic">Membro Básico</SelectItem>
                                <SelectItem value="premium">Membro Premium</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => rejectUser(u.id)}
                              className="rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4" />
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
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {filteredUsers.map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={u.profile_photo} />
                                <AvatarFallback className="bg-[#0056ff] text-white">
                                  {u.full_name?.[0] || u.email?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-800">{u.full_name || 'Sem nome'}</p>
                                <p className="text-sm text-slate-500">{u.email}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge className={
                                    u.subscription_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    u.subscription_type === 'premium' ? 'bg-green-100 text-green-700' :
                                    u.subscription_type === 'basic' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                  }>
                                    {u.subscription_type === 'admin' ? 'Admin' :
                                     u.subscription_type === 'premium' ? 'Premium' :
                                     u.subscription_type === 'basic' ? 'Básico' :
                                     'Visitante'}
                                  </Badge>
                                  <Badge className={
                                    u.access_status === 'approved' ? 'bg-green-100 text-green-700' :
                                    u.access_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }>
                                    {u.access_status === 'approved' ? 'Aprovado' :
                                     u.access_status === 'rejected' ? 'Rejeitado' :
                                     'Pendente'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
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
                              <SelectTrigger className="w-36 rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="visitor">Visitante</SelectItem>
                                <SelectItem value="basic">Básico</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Codes Sub-Tab */}
              <TabsContent value="codes">
                <PremiumCodesManager showToast={showToast} />
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