import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, Copy, Loader2, AlertTriangle,
  Briefcase, MapPin, Clock, Star, Zap, Save, Send, Search, X, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const CIDADES_PB = [
  "João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux",
  "Sousa", "Cajazeiras", "Cabedelo", "Guarabira", "Sapé",
  "Mamanguape", "Queimadas", "Lagoa Seca", "Monteiro", "Pombal",
  "Esperança", "Itabaiana", "Solânea", "Bananeiras", "Alagoa Grande",
  "Picuí", "Cuité", "Ingá", "Mari", "Alagoinha",
  "Areia", "Remígio", "Massaranduba", "Pitimbu", "Conde",
  "Rio Tinto", "Pedras de Fogo", "Cruz do Espírito Santo", "Lucena",
  "Itaporanga", "São Bento", "Princesa Isabel", "Desterro",
  "Nova Floresta", "Pocinhos", "Taperoá", "São João do Cariri"
];

const emptyForm = {
  title: '',
  company: '',
  city: '',
  job_type: '',
  work_mode: 'Presencial',
  salary_range: '',
  description: '',
  requirements: '',
  benefits: '',
  contact_email: '',
  contact_phone: '',
  contact_whatsapp: '',
  application_link: '',
  category: '',
  job_function: '',
  expiration_date: '',
  is_featured: false,
  is_urgent: false,
  status: 'ativa',
  state: 'PB',
  origem: 'post_manual',
  contract_types: [],
};

export default function PostManual() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      const isAdmin = u?.role === 'admin' || u?.subscription_type === 'admin' || u?.email === 'alexandreferreirajp01@gmail.com';
      if (!isAdmin) { window.location.href = createPageUrl('Home'); return; }
      setUser(u);
    }).catch(() => {
      window.location.href = createPageUrl('Splash');
    }).finally(() => setAuthLoading(false));
  }, []);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['post-manual-jobs'],
    queryFn: () => base44.entities.Job.filter({ origem: 'post_manual' }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['filter-categories'],
    queryFn: () => base44.entities.FilterMaster.filter({ type: 'category', is_active: true }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-manual-jobs'] });
      toast.success('Vaga publicada com sucesso!');
      handleCloseForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-manual-jobs'] });
      toast.success('Vaga atualizada!');
      handleCloseForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-manual-jobs'] });
      toast.success('Vaga removida!');
    },
  });

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingJob(null);
    setFormData(emptyForm);
    setPreviewMode(false);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      company: job.company || '',
      city: job.city || '',
      job_type: job.job_type || '',
      work_mode: job.work_mode || 'Presencial',
      salary_range: job.salary_range || '',
      description: job.description || '',
      requirements: job.additional_info || '',
      benefits: job.benefits || '',
      contact_email: job.contact_email || '',
      contact_phone: job.contact_phone || '',
      contact_whatsapp: job.contact_whatsapp || '',
      application_link: job.application_link || '',
      category: job.category || '',
      job_function: job.job_function || '',
      expiration_date: job.expiration_date?.split('T')[0] || '',
      is_featured: job.is_featured || false,
      is_urgent: false,
      status: job.status || 'ativa',
      state: 'PB',
      origem: 'post_manual',
      contract_types: job.contract_types || [],
    });
    setShowForm(true);
  };

  const handleDuplicate = (job) => {
    setEditingJob(null);
    setFormData({
      title: job.title + ' (cópia)',
      company: job.company || '',
      city: job.city || '',
      job_type: job.job_type || '',
      work_mode: job.work_mode || 'Presencial',
      salary_range: job.salary_range || '',
      description: job.description || '',
      requirements: job.additional_info || '',
      benefits: job.benefits || '',
      contact_email: job.contact_email || '',
      contact_phone: job.contact_phone || '',
      contact_whatsapp: job.contact_whatsapp || '',
      application_link: job.application_link || '',
      category: job.category || '',
      job_function: job.job_function || '',
      expiration_date: '',
      is_featured: false,
      is_urgent: false,
      status: 'ativa',
      state: 'PB',
      origem: 'post_manual',
      contract_types: job.contract_types || [],
    });
    setShowForm(true);
    toast.info('Vaga duplicada! Edite e publique.');
  };

  const handleSave = async (targetStatus = 'ativa') => {
    if (!formData.title.trim()) { toast.error('Título é obrigatório'); return; }
    if (!formData.city) { toast.error('Cidade é obrigatória'); return; }
    if (!formData.job_type) { toast.error('Tipo de vaga é obrigatório'); return; }

    setSaving(true);
    const data = {
      title: formData.title,
      company: formData.company,
      city: formData.city,
      state: 'PB',
      job_type: formData.job_type,
      work_mode: formData.work_mode,
      salary_range: formData.salary_range,
      description: formData.description,
      additional_info: formData.requirements,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,
      contact_whatsapp: formData.contact_whatsapp,
      application_link: formData.application_link,
      category: formData.category,
      job_function: formData.job_function,
      is_featured: formData.is_featured,
      status: targetStatus,
      origem: 'post_manual',
      published_at: targetStatus === 'ativa' ? new Date().toISOString() : null,
      expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null,
      contract_types: formData.job_type ? [formData.job_type] : [],
      nivel_localizacao: 'cidade',
      geocode_status: 'manual',
    };

    try {
      if (editingJob) {
        await updateMutation.mutateAsync({ id: editingJob.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const filteredJobs = jobs.filter(j => {
    const matchSearch = !searchTerm || j.title?.toLowerCase().includes(searchTerm.toLowerCase()) || j.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-6 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-7 h-7" /> POST MANUAL
              </h1>
              <p className="text-white/70 text-sm mt-1">Publique vagas diretamente, sem integrações externas</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-white text-[#1D2226] hover:bg-white/90 font-semibold gap-2">
              <Plus className="w-5 h-5" /> Nova Vaga
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Aviso informativo */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Função POST MANUAL:</strong> Essa função não utiliza integrações automáticas. As postagens devem ser feitas manualmente. Algumas funcionalidades avançadas (Telegram, N8N, redes sociais) não estarão disponíveis nesta modalidade.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar vagas..."
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
              <SelectItem value="expirada">Expiradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de vagas */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhuma vaga publicada manualmente</p>
              <p className="text-slate-400 text-sm mt-1">Clique em "Nova Vaga" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                        {job.is_featured && <Badge className="bg-amber-100 text-amber-800 text-xs"><Star className="w-3 h-3 mr-1" />Destaque</Badge>}
                        <Badge className={job.status === 'ativa' ? 'bg-green-100 text-green-800' : job.status === 'draft' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}>
                          {job.status === 'ativa' ? 'Ativa' : job.status === 'draft' ? 'Rascunho' : 'Expirada'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {job.company && <span className="font-medium">{job.company}</span>}
                        {job.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.city}/PB</span>}
                        {job.job_type && <Badge variant="outline" className="text-xs">{job.job_type}</Badge>}
                        {job.work_mode && <Badge variant="outline" className="text-xs">{job.work_mode}</Badge>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(job.created_date), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8" title="Duplicar" onClick={() => handleDuplicate(job)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" title="Editar" onClick={() => handleEdit(job)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500" title="Excluir"
                        onClick={() => { if (confirm('Excluir esta vaga?')) deleteMutation.mutate(job.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Formulário */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#0A66C2]" />
                {previewMode ? 'Pré-visualização' : editingJob ? 'Editar Vaga' : 'Nova Vaga — POST MANUAL'}
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye className="w-4 h-4 mr-1" />
                  {previewMode ? 'Editar' : 'Visualizar'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {previewMode ? (
            /* Pré-visualização */
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-[#1D4371] to-[#2B5A8F] rounded-xl p-5 text-white">
                <h2 className="text-2xl font-bold mb-1">{formData.title || 'Título da Vaga'}</h2>
                {formData.company && <p className="text-white/80 text-lg">{formData.company}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {formData.city && <Badge className="bg-white/20 text-white"><MapPin className="w-3 h-3 mr-1" />{formData.city}/PB</Badge>}
                  {formData.job_type && <Badge className="bg-white/20 text-white">{formData.job_type}</Badge>}
                  {formData.work_mode && <Badge className="bg-white/20 text-white">{formData.work_mode}</Badge>}
                  {formData.is_featured && <Badge className="bg-amber-400 text-amber-900"><Star className="w-3 h-3 mr-1" />Destaque</Badge>}
                </div>
              </div>
              {formData.salary_range && <div className="p-4 bg-green-50 rounded-xl"><p className="font-semibold text-green-800">💰 Salário: {formData.salary_range}</p></div>}
              {formData.description && <div><h3 className="font-bold mb-2">Descrição</h3><p className="text-slate-600 whitespace-pre-line text-sm">{formData.description}</p></div>}
              {formData.requirements && <div><h3 className="font-bold mb-2">Requisitos</h3><p className="text-slate-600 whitespace-pre-line text-sm">{formData.requirements}</p></div>}
              {formData.benefits && <div><h3 className="font-bold mb-2">Benefícios</h3><p className="text-slate-600 whitespace-pre-line text-sm">{formData.benefits}</p></div>}
              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-bold mb-2 text-blue-800">Contato</h3>
                {formData.contact_email && <p className="text-sm">📧 {formData.contact_email}</p>}
                {formData.contact_whatsapp && <p className="text-sm">📱 {formData.contact_whatsapp}</p>}
                {formData.contact_phone && <p className="text-sm">📞 {formData.contact_phone}</p>}
                {formData.application_link && <p className="text-sm">🔗 {formData.application_link}</p>}
              </div>
            </div>
          ) : (
            /* Formulário */
            <div className="p-6 space-y-6">
              {/* Seção: Dados da Vaga */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <span className="w-6 h-6 bg-[#0A66C2] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Dados da Vaga
                </h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Título da Vaga *</Label>
                    <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Assistente Administrativo" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Empresa (opcional)</Label>
                      <Input value={formData.company} onChange={e => set('company', e.target.value)} placeholder="Nome da empresa" className="mt-1" />
                    </div>
                    <div>
                      <Label>Cidade (Paraíba) *</Label>
                      <Select value={formData.city} onValueChange={v => set('city', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {CIDADES_PB.sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Vaga *</Label>
                      <Select value={formData.job_type} onValueChange={v => set('job_type', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {['CLT','PJ','Estágio','Freelancer','Jovem Aprendiz','Temporário','Trainee','Banco de Talentos'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Modalidade</Label>
                      <Select value={formData.work_mode} onValueChange={v => set('work_mode', v)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                          <SelectItem value="Remoto">Remoto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Faixa Salarial (opcional)</Label>
                    <Input value={formData.salary_range} onChange={e => set('salary_range', e.target.value)} placeholder="Ex: R$ 1.500 - R$ 2.000 / A combinar" className="mt-1" />
                  </div>
                  <div>
                    <Label>Descrição da Vaga</Label>
                    <Textarea value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Descreva as responsabilidades e atividades da vaga..." className="mt-1 min-h-[100px]" />
                  </div>
                  <div>
                    <Label>Requisitos</Label>
                    <Textarea value={formData.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Liste os requisitos necessários..." className="mt-1 min-h-[80px]" />
                  </div>
                  <div>
                    <Label>Benefícios</Label>
                    <Textarea value={formData.benefits} onChange={e => set('benefits', e.target.value)} placeholder="Vale-transporte, plano de saúde, etc..." className="mt-1 min-h-[60px]" />
                  </div>
                </div>
              </div>

              {/* Seção: Contato */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <span className="w-6 h-6 bg-[#0A66C2] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Contato para Candidatura
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>E-mail</Label>
                    <Input value={formData.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="rh@empresa.com" className="mt-1" />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input value={formData.contact_whatsapp} onChange={e => set('contact_whatsapp', e.target.value)} placeholder="(83) 9 9999-9999" className="mt-1" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={formData.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="(83) 3333-3333" className="mt-1" />
                  </div>
                  <div>
                    <Label>Link para Candidatura</Label>
                    <Input value={formData.application_link} onChange={e => set('application_link', e.target.value)} placeholder="https://..." className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Seção: Configurações */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <span className="w-6 h-6 bg-[#0A66C2] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Configurações da Vaga
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={formData.category} onValueChange={v => set('category', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {categories.map(c => <SelectItem key={c.id} value={c.value}>{c.value}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nível</Label>
                      <Select value={formData.job_function} onValueChange={v => set('job_function', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Júnior">Júnior</SelectItem>
                          <SelectItem value="Pleno">Pleno</SelectItem>
                          <SelectItem value="Sênior">Sênior</SelectItem>
                          <SelectItem value="Não especificado">Não especificado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Data de Expiração (opcional)</Label>
                    <Input type="date" value={formData.expiration_date} onChange={e => set('expiration_date', e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl flex-1">
                      <Star className="w-5 h-5 text-amber-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Vaga em Destaque</p>
                        <p className="text-xs text-slate-500">Aparece no topo dos resultados</p>
                      </div>
                      <Switch checked={formData.is_featured} onCheckedChange={v => set('is_featured', v)} />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl flex-1">
                      <Zap className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Urgente</p>
                        <p className="text-xs text-slate-500">Badge de urgência na vaga</p>
                      </div>
                      <Switch checked={formData.is_urgent} onCheckedChange={v => set('is_urgent', v)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 pt-2 border-t">
                <Button variant="outline" onClick={handleCloseForm} className="flex-1">
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                  onClick={() => handleSave('draft')}
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
                </Button>
                <Button
                  className="flex-1 bg-[#0A66C2] hover:bg-[#004182]"
                  disabled={saving}
                  onClick={() => handleSave('ativa')}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Publicar Vaga
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}