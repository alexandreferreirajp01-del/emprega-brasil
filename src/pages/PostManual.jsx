import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, Copy, Loader2, AlertTriangle,
  Briefcase, MapPin, Clock, Star, Zap, Save, Send, Search, X
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const CIDADES_PB = [
  "Alagoinha","Alagoa Grande","Areia","Bananeiras","Bayeux","Cabedelo",
  "Cajazeiras","Campina Grande","Conde","Cruz do Espírito Santo","Cuité",
  "Desterro","Esperança","Guarabira","Ingá","Itabaiana","Itaporanga",
  "João Pessoa","Lagoa Seca","Lucena","Mamanguape","Mari","Massaranduba",
  "Monteiro","Nova Floresta","Patos","Pedras de Fogo","Picuí","Pitimbu",
  "Pocinhos","Pombal","Princesa Isabel","Queimadas","Remígio","Rio Tinto",
  "Santa Rita","São Bento","São João do Cariri","Sapé","Solânea","Sousa","Taperoá"
];

const emptyForm = {
  title: '', company: '', city: '', job_type: '', work_mode: 'Presencial',
  salary_range: '', description: '', requirements: '', benefits: '',
  contact_email: '', contact_phone: '', contact_whatsapp: '', application_link: '',
  category: '', job_function: '', expiration_date: '',
  is_featured: false, status: 'ativa',
};

const SectionTitle = ({ num, label }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
    <span className="w-7 h-7 bg-[#0A66C2] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{num}</span>
    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">{label}</h3>
  </div>
);

export default function PostManual() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'form' | 'preview'
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
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
      handleBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-manual-jobs'] });
      toast.success('Vaga atualizada!');
      handleBack();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-manual-jobs'] });
      toast.success('Vaga removida!');
    },
  });

  const handleBack = () => {
    setView('list');
    setEditingJob(null);
    setFormData(emptyForm);
  };

  const handleNew = () => {
    setEditingJob(null);
    setFormData(emptyForm);
    setView('form');
    window.scrollTo(0, 0);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '', company: job.company || '', city: job.city || '',
      job_type: job.job_type || '', work_mode: job.work_mode || 'Presencial',
      salary_range: job.salary_range || '', description: job.description || '',
      requirements: job.additional_info || '', benefits: job.benefits || '',
      contact_email: job.contact_email || '', contact_phone: job.contact_phone || '',
      contact_whatsapp: job.contact_whatsapp || '', application_link: job.application_link || '',
      category: job.category || '', job_function: job.job_function || '',
      expiration_date: job.expiration_date?.split('T')[0] || '',
      is_featured: job.is_featured || false, status: job.status || 'ativa',
    });
    setView('form');
    window.scrollTo(0, 0);
  };

  const handleDuplicate = (job) => {
    setEditingJob(null);
    setFormData({
      title: job.title + ' (cópia)', company: job.company || '', city: job.city || '',
      job_type: job.job_type || '', work_mode: job.work_mode || 'Presencial',
      salary_range: job.salary_range || '', description: job.description || '',
      requirements: job.additional_info || '', benefits: job.benefits || '',
      contact_email: job.contact_email || '', contact_phone: job.contact_phone || '',
      contact_whatsapp: job.contact_whatsapp || '', application_link: job.application_link || '',
      category: job.category || '', job_function: '', expiration_date: '',
      is_featured: false, status: 'ativa',
    });
    setView('form');
    toast.info('Vaga duplicada — edite e publique!');
    window.scrollTo(0, 0);
  };

  const handleSave = async (targetStatus = 'ativa') => {
    if (!formData.title.trim()) { toast.error('Título é obrigatório'); return; }
    if (!formData.city) { toast.error('Cidade é obrigatória'); return; }
    if (!formData.job_type) { toast.error('Tipo de vaga é obrigatório'); return; }

    setSaving(true);
    const data = {
      title: formData.title, company: formData.company, city: formData.city,
      state: 'PB', job_type: formData.job_type, work_mode: formData.work_mode,
      salary_range: formData.salary_range, description: formData.description,
      additional_info: formData.requirements,
      contact_email: formData.contact_email, contact_phone: formData.contact_phone,
      contact_whatsapp: formData.contact_whatsapp, application_link: formData.application_link,
      category: formData.category, job_function: formData.job_function,
      is_featured: formData.is_featured, status: targetStatus, origem: 'post_manual',
      published_at: targetStatus === 'ativa' ? new Date().toISOString() : null,
      expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null,
      contract_types: formData.job_type ? [formData.job_type] : [],
      nivel_localizacao: 'cidade', geocode_status: 'manual',
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

  // ─── HEADER comum ───────────────────────────────────────────────────────────
  const Header = ({ onBack, backLabel, extra }) => (
    <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-4 pb-6 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> POST MANUAL
            </h1>
            <p className="text-white/60 text-xs mt-0.5">Publicação sem integrações externas</p>
          </div>
          {extra}
        </div>
      </div>
    </div>
  );

  // ─── LISTA ───────────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header
          onBack={() => window.location.href = createPageUrl('Configuracoes')}
          backLabel="Configurações"
          extra={
            <Button onClick={handleNew} size="sm" className="bg-white text-[#1D2226] hover:bg-white/90 font-semibold gap-1 flex-shrink-0">
              <Plus className="w-4 h-4" /> Nova Vaga
            </Button>
          }
        />
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>POST MANUAL:</strong> Sem integrações automáticas (Telegram, N8N, redes sociais). Postagens feitas manualmente, sem consumir créditos.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-9 h-10 rounded-xl" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
                <SelectItem value="expirada">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-slate-400" /></div>
          ) : filteredJobs.length === 0 ? (
            <Card><CardContent className="py-10 text-center">
              <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhuma vaga ainda</p>
              <Button onClick={handleNew} size="sm" className="mt-3 bg-[#0A66C2]"><Plus className="w-4 h-4 mr-1" />Criar vaga</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map(job => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{job.title}</span>
                          {job.is_featured && <Badge className="bg-amber-100 text-amber-800 text-xs px-1.5"><Star className="w-3 h-3 mr-0.5 inline" />Destaque</Badge>}
                          <Badge className={`text-xs px-1.5 ${job.status === 'ativa' ? 'bg-green-100 text-green-800' : job.status === 'draft' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>
                            {job.status === 'ativa' ? 'Ativa' : job.status === 'draft' ? 'Rascunho' : 'Expirada'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          {job.company && <span>{job.company}</span>}
                          {job.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{job.city}/PB</span>}
                          {job.job_type && <span className="bg-slate-100 rounded px-1.5 py-0.5">{job.job_type}</span>}
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{format(new Date(job.created_date), 'dd/MM/yy')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(job)} title="Duplicar"><Copy className="w-3.5 h-3.5" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(job)} title="Editar"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-500" onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(job.id); }} title="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PRÉ-VISUALIZAÇÃO ────────────────────────────────────────────────────────
  if (view === 'preview') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header onBack={() => setView('form')} backLabel="Voltar ao formulário" extra={
          <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] gap-1 flex-shrink-0" disabled={saving} onClick={() => handleSave('ativa')}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publicar
          </Button>
        } />
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <div className="bg-gradient-to-r from-[#1D4371] to-[#2B5A8F] rounded-xl p-5 text-white">
            <h2 className="text-xl font-bold mb-1">{formData.title || 'Título da Vaga'}</h2>
            {formData.company && <p className="text-white/80">{formData.company}</p>}
            <div className="flex gap-2 mt-3 flex-wrap">
              {formData.city && <Badge className="bg-white/20 text-white text-xs"><MapPin className="w-3 h-3 mr-1" />{formData.city}/PB</Badge>}
              {formData.job_type && <Badge className="bg-white/20 text-white text-xs">{formData.job_type}</Badge>}
              {formData.work_mode && <Badge className="bg-white/20 text-white text-xs">{formData.work_mode}</Badge>}
              {formData.is_featured && <Badge className="bg-amber-400 text-amber-900 text-xs"><Star className="w-3 h-3 mr-1" />Destaque</Badge>}
            </div>
          </div>
          {formData.salary_range && <div className="p-3 bg-green-50 rounded-xl"><p className="font-semibold text-green-800 text-sm">💰 Salário: {formData.salary_range}</p></div>}
          {formData.description && <div><h3 className="font-bold text-sm mb-1">Descrição</h3><p className="text-slate-600 text-sm whitespace-pre-line">{formData.description}</p></div>}
          {formData.requirements && <div><h3 className="font-bold text-sm mb-1">Requisitos</h3><p className="text-slate-600 text-sm whitespace-pre-line">{formData.requirements}</p></div>}
          {formData.benefits && <div><h3 className="font-bold text-sm mb-1">Benefícios</h3><p className="text-slate-600 text-sm whitespace-pre-line">{formData.benefits}</p></div>}
          {(formData.contact_email || formData.contact_whatsapp || formData.contact_phone || formData.application_link) && (
            <div className="p-3 bg-blue-50 rounded-xl">
              <h3 className="font-bold text-sm text-blue-800 mb-2">Contato</h3>
              {formData.contact_email && <p className="text-sm">📧 {formData.contact_email}</p>}
              {formData.contact_whatsapp && <p className="text-sm">📱 {formData.contact_whatsapp}</p>}
              {formData.contact_phone && <p className="text-sm">📞 {formData.contact_phone}</p>}
              {formData.application_link && <p className="text-sm">🔗 {formData.application_link}</p>}
            </div>
          )}
          <div className="flex gap-2 pb-4">
            <Button variant="outline" className="flex-1" onClick={() => setView('form')}>Editar</Button>
            <Button variant="outline" className="flex-1" disabled={saving} onClick={() => handleSave('draft')}><Save className="w-4 h-4 mr-1" />Rascunho</Button>
            <Button className="flex-1 bg-[#0A66C2] hover:bg-[#004182]" disabled={saving} onClick={() => handleSave('ativa')}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Publicar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORMULÁRIO ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header
        onBack={handleBack}
        backLabel="Minhas vagas"
        extra={
          <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1 flex-shrink-0" onClick={() => setView('preview')}>
            <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Visualizar</span>
          </Button>
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5 pb-8">
        {/* Seção 1: Dados da Vaga */}
        <Card><CardContent className="p-4">
          <SectionTitle num="1" label="Dados da Vaga" />
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Título da Vaga *</Label>
              <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Assistente Administrativo" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Empresa (opcional)</Label>
              <Input value={formData.company} onChange={e => set('company', e.target.value)} placeholder="Nome da empresa" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Cidade (Paraíba) *</Label>
              <Select value={formData.city} onValueChange={v => set('city', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                <SelectContent className="max-h-56">
                  {CIDADES_PB.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Tipo de Vaga *</Label>
              <Select value={formData.job_type} onValueChange={v => set('job_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['CLT','PJ','Estágio','Freelancer','Jovem Aprendiz','Temporário','Trainee','Banco de Talentos'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Modalidade</Label>
              <Select value={formData.work_mode} onValueChange={v => set('work_mode', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
                  <SelectItem value="Remoto">Remoto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Faixa Salarial (opcional)</Label>
              <Input value={formData.salary_range} onChange={e => set('salary_range', e.target.value)} placeholder="Ex: R$ 1.500 - R$ 2.000 / A combinar" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Descrição da Vaga</Label>
              <Textarea value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Responsabilidades e atividades..." className="mt-1 min-h-[90px]" />
            </div>
            <div>
              <Label className="text-sm">Requisitos</Label>
              <Textarea value={formData.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Formação, experiência, habilidades..." className="mt-1 min-h-[70px]" />
            </div>
            <div>
              <Label className="text-sm">Benefícios</Label>
              <Textarea value={formData.benefits} onChange={e => set('benefits', e.target.value)} placeholder="Vale-transporte, plano de saúde..." className="mt-1 min-h-[60px]" />
            </div>
          </div>
        </CardContent></Card>

        {/* Seção 2: Contato */}
        <Card><CardContent className="p-4">
          <SectionTitle num="2" label="Contato para Candidatura" />
          <div className="space-y-3">
            <div>
              <Label className="text-sm">E-mail de Contato</Label>
              <Input type="email" value={formData.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="rh@empresa.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">WhatsApp</Label>
              <Input value={formData.contact_whatsapp} onChange={e => set('contact_whatsapp', e.target.value)} placeholder="(83) 9 9999-9999" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Telefone</Label>
              <Input value={formData.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="(83) 3333-3333" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Link para Candidatura</Label>
              <Input value={formData.application_link} onChange={e => set('application_link', e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
          </div>
        </CardContent></Card>

        {/* Seção 3: Configurações */}
        <Card><CardContent className="p-4">
          <SectionTitle num="3" label="Configurações" />
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Categoria</Label>
              <Select value={formData.category} onValueChange={v => set('category', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent className="max-h-56">
                  {categories.map(c => <SelectItem key={c.id} value={c.value}>{c.value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Nível</Label>
              <Select value={formData.job_function} onValueChange={v => set('job_function', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Júnior">Júnior</SelectItem>
                  <SelectItem value="Pleno">Pleno</SelectItem>
                  <SelectItem value="Sênior">Sênior</SelectItem>
                  <SelectItem value="Não especificado">Não especificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Data de Expiração (opcional)</Label>
              <Input type="date" value={formData.expiration_date} onChange={e => set('expiration_date', e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Vaga em Destaque</p>
                  <p className="text-xs text-slate-500">Aparece no topo dos resultados</p>
                </div>
              </div>
              <Switch checked={formData.is_featured} onCheckedChange={v => set('is_featured', v)} />
            </div>
          </div>
        </CardContent></Card>

        {/* Ações */}
        <div className="space-y-2">
          <Button className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-base font-semibold gap-2" disabled={saving} onClick={() => handleSave('ativa')}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Publicar Vaga Agora
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1" disabled={saving} onClick={() => handleSave('draft')}>
              <Save className="w-4 h-4" /> Salvar Rascunho
            </Button>
            <Button variant="outline" className="flex-1 gap-1" onClick={() => setView('preview')}>
              <Eye className="w-4 h-4" /> Visualizar
            </Button>
            <Button variant="outline" className="flex-1 gap-1" onClick={handleBack}>
              <X className="w-4 h-4" /> Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}