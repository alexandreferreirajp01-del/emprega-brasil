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
import { 
  Plus, Briefcase, MapPin, Trash2, Edit, Save, 
  X, Loader2, CheckCircle, Shield, Search, Building2
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
        if (currentUser.role !== 'admin' && currentUser.subscription_type !== 'admin') {
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
    queryFn: () => base44.entities.Job.list('-created_date', 500),
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list('name', 500),
  });

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

  const filteredCities = cities.filter(city =>
    city.name?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredFunctions = JOB_FUNCTIONS.filter(func =>
    func.toLowerCase().includes(functionSearch.toLowerCase())
  );

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
          <p className="text-white/70">Gerencie vagas e cidades</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-white shadow-sm rounded-xl p-1">
            <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />
              Vagas
            </TabsTrigger>
            <TabsTrigger value="cities" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Cidades
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Add Job Button */}
            {!showJobForm && (
              <Button 
                onClick={() => setShowJobForm(true)}
                className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Vaga
              </Button>
            )}

            {/* Job Form */}
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
                          <Label>Informações Adicionais</Label>
                          <Textarea
                            value={jobForm.additional_info}
                            onChange={(e) => setJobForm({...jobForm, additional_info: e.target.value})}
                            placeholder="Benefícios, horários, etc..."
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
                              Apenas para Membros
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
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800">{job.title || 'Não informado'}</h4>
                          {job.is_premium && (
                            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">Premium</Badge>
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
              {jobs.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhuma vaga cadastrada</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cities Tab */}
          <TabsContent value="cities" className="space-y-6">
            {/* Add City */}
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

            {/* Search Cities */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Pesquisar cidade..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Cities List */}
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