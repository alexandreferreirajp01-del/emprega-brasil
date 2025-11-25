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
  Plus, Briefcase, MapPin, Trash2, Edit, Save, X, Loader2, CheckCircle, 
  Shield, Search, Building2, Users, MessageSquare, Image, Upload, 
  Check, XCircle, Eye, Clock, Crown, UserCheck, UserX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";

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
  const [editingJob, setEditingJob] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [functionSearch, setFunctionSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [extractingData, setExtractingData] = useState(false);
  const queryClient = useQueryClient();

  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    city: '',
    salary_range: '',
    job_type: 'CLT',
    job_function: '',
    category: '',
    description: '',
    requirements: '',
    additional_info: '',
    application_link: '',
    is_premium: false,
    is_featured: false
  });

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

  // Job Mutations
  const createJobMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      resetJobForm();
      showToast('Vaga criada com sucesso!');
    },
    onError: () => showToast('Erro ao criar vaga', 'error')
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      resetJobForm();
      showToast('Vaga atualizada com sucesso!');
    },
    onError: () => showToast('Erro ao atualizar vaga', 'error')
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

  const resetJobForm = () => {
    setJobForm({
      title: '',
      company: '',
      city: '',
      salary_range: '',
      job_type: 'CLT',
      job_function: '',
      category: '',
      description: '',
      requirements: '',
      additional_info: '',
      application_link: '',
      is_premium: false,
      is_featured: false
    });
    setEditingJob(null);
    setShowJobForm(false);
  };

  const handleEditJob = (job) => {
    setJobForm({
      title: job.title || '',
      company: job.company || '',
      city: job.city || '',
      salary_range: job.salary_range || '',
      job_type: job.job_type || 'CLT',
      job_function: job.job_function || '',
      category: job.category || '',
      description: job.description || '',
      requirements: job.requirements || '',
      additional_info: job.additional_info || '',
      application_link: job.application_link || '',
      is_premium: job.is_premium || false,
      is_featured: job.is_featured || false
    });
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleSubmitJob = (e) => {
    e.preventDefault();
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, data: jobForm });
    } else {
      createJobMutation.mutate(jobForm);
    }
  };

  // Upload e extração de dados da imagem
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input para permitir upload do mesmo arquivo novamente
    e.target.value = '';

    setUploadingImage(true);
    setExtractingData(true);

    try {
      // Upload da imagem
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult?.file_url;

      if (!fileUrl) {
        throw new Error('Falha no upload da imagem');
      }

      // Extrair dados da imagem usando LLM
      const extractedData = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem de vaga de emprego e extraia as seguintes informações em português:
        - Título/Cargo da vaga
        - Nome da empresa
        - Cidade/Localização
        - Faixa salarial (se mencionado)
        - Tipo de contrato (CLT, Estágio, Home Office, etc)
        - Descrição da vaga
        - Requisitos
        - Contato (email ou telefone)
        - Informações adicionais
        
        Se alguma informação não estiver disponível, deixe em branco.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            company: { type: "string" },
            city: { type: "string" },
            salary_range: { type: "string" },
            job_type: { type: "string" },
            description: { type: "string" },
            requirements: { type: "string" },
            contact: { type: "string" },
            additional_info: { type: "string" }
          }
        }
      });

      // Preencher o formulário com os dados extraídos
      if (extractedData) {
        setJobForm(prev => ({
          ...prev,
          title: extractedData.title || prev.title,
          company: extractedData.company || prev.company,
          city: extractedData.city || prev.city,
          salary_range: extractedData.salary_range || prev.salary_range,
          job_type: extractedData.job_type || prev.job_type,
          description: extractedData.description || prev.description,
          requirements: extractedData.requirements || prev.requirements,
          additional_info: extractedData.contact ? 
            `Contato: ${extractedData.contact}\n${extractedData.additional_info || ''}` : 
            extractedData.additional_info || prev.additional_info
        }));
        showToast('Dados extraídos da imagem com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      showToast('Erro ao processar imagem. Tente novamente.', 'error');
    } finally {
      setUploadingImage(false);
      setExtractingData(false);
    }
  };

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

  const filteredCities = cities.filter(city =>
    city.name?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredFunctions = JOB_FUNCTIONS.filter(func =>
    func.toLowerCase().includes(functionSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
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
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${
              toast.type === 'error' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                : 'bg-gradient-to-r from-[#0056ff] to-[#0044cc] text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Usuários
              {pendingUsers.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="community" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comunidade
              {(pendingPosts.length + pendingComments.length) > 0 && (
                <Badge className="ml-2 bg-purple-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingPosts.length + pendingComments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cities" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Cidades
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {!showJobForm && (
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowJobForm(true)}
                  className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Vaga
                </Button>
              </div>
            )}

            <AnimatePresence>
              {showJobForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{editingJob ? 'Editar Vaga' : 'Nova Vaga'}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={resetJobForm}>
                        <X className="w-5 h-5" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {/* Image Upload for Data Extraction */}
                      <div className="mb-6 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <div className="text-center">
                          <Image className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 mb-3">
                            Carregue uma imagem de vaga para extrair dados automaticamente
                          </p>
                          <label className="cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="rounded-xl"
                              disabled={uploadingImage}
                            >
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {extractingData ? 'Extraindo dados...' : 'Carregando...'}
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Carregar Imagem
                                </>
                              )}
                            </Button>
                          </label>
                        </div>
                      </div>

                      <form onSubmit={handleSubmitJob} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Título da Vaga</Label>
                            <Input
                              value={jobForm.title}
                              onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                              placeholder="Ex: Vendedor"
                              className="rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Empresa</Label>
                            <Input
                              value={jobForm.company}
                              onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                              placeholder="Nome da empresa (opcional)"
                              className="rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Select value={jobForm.city} onValueChange={(v) => setJobForm({...jobForm, city: v})}>
                              <SelectTrigger className="rounded-lg">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                <div className="p-2 sticky top-0 bg-white">
                                  <Input
                                    placeholder="Pesquisar..."
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <ScrollArea className="h-64">
                                  {filteredCities.map(city => (
                                    <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Faixa Salarial</Label>
                            <Input
                              value={jobForm.salary_range}
                              onChange={(e) => setJobForm({...jobForm, salary_range: e.target.value})}
                              placeholder="Ex: R$ 1.500 - R$ 2.000"
                              className="rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo de Contrato</Label>
                            <Select value={jobForm.job_type} onValueChange={(v) => setJobForm({...jobForm, job_type: v})}>
                              <SelectTrigger className="rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CLT">CLT</SelectItem>
                                <SelectItem value="Home Office">Home Office</SelectItem>
                                <SelectItem value="Estágio">Estágio</SelectItem>
                                <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
                                <SelectItem value="Temporário">Temporário</SelectItem>
                                <SelectItem value="Freelancer">Freelancer</SelectItem>
                                <SelectItem value="PJ">PJ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Função</Label>
                            <Select value={jobForm.job_function} onValueChange={(v) => setJobForm({...jobForm, job_function: v})}>
                              <SelectTrigger className="rounded-lg">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                <div className="p-2 sticky top-0 bg-white">
                                  <Input
                                    placeholder="Pesquisar..."
                                    value={functionSearch}
                                    onChange={(e) => setFunctionSearch(e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <ScrollArea className="h-64">
                                  {filteredFunctions.map(func => (
                                    <SelectItem key={func} value={func}>{func}</SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={jobForm.description}
                            onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                            placeholder="Descreva a vaga..."
                            className="rounded-lg min-h-[120px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Requisitos</Label>
                          <Textarea
                            value={jobForm.requirements}
                            onChange={(e) => setJobForm({...jobForm, requirements: e.target.value})}
                            placeholder="Liste os requisitos..."
                            className="rounded-lg min-h-[100px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Informações Adicionais (Contato, Benefícios, etc)</Label>
                          <Textarea
                            value={jobForm.additional_info}
                            onChange={(e) => setJobForm({...jobForm, additional_info: e.target.value})}
                            placeholder="Contato, benefícios, horários, etc..."
                            className="rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Link/Instrução para Candidatura</Label>
                          <Input
                            value={jobForm.application_link}
                            onChange={(e) => setJobForm({...jobForm, application_link: e.target.value})}
                            placeholder="https://... ou instruções"
                            className="rounded-lg"
                          />
                        </div>

                        <div className="flex flex-wrap gap-6 pt-4 border-t">
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={jobForm.is_premium}
                              onCheckedChange={(v) => setJobForm({...jobForm, is_premium: v})}
                            />
                            <Label className="cursor-pointer">
                              <Crown className="w-4 h-4 inline mr-1 text-purple-600" />
                              Apenas para Membros Premium
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={jobForm.is_featured}
                              onCheckedChange={(v) => setJobForm({...jobForm, is_featured: v})}
                            />
                            <Label className="cursor-pointer">
                              Vaga em Destaque
                            </Label>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button 
                            type="submit" 
                            className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                            disabled={createJobMutation.isPending || updateJobMutation.isPending}
                          >
                            {(createJobMutation.isPending || updateJobMutation.isPending) ? (
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                              <Save className="w-5 h-5 mr-2" />
                            )}
                            {editingJob ? 'Atualizar' : 'Publicar Vaga'}
                          </Button>
                          <Button type="button" variant="outline" onClick={resetJobForm} className="rounded-xl">
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

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
                          onClick={() => handleEditJob(job)}
                          className="rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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

          {/* Users Tab */}
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

          {/* Community Tab */}
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

          {/* Cities Tab */}
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
      </div>
    </div>
  );
}