import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Search, Rocket, Trash2, Crown, Star,
  Loader2, MapPin, Building2, Calendar, MessageCircle,
  CheckSquare, Square, ChevronDown, Zap, Bot, Key,
  ToggleLeft, ToggleRight, Info, Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import TimeAgo from "@/components/common/TimeAgo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Chaves de AutoPost ────────────────────────────────────────────────────────
const AUTOPOST_KEYS = [
  {
    id: 'premium',
    label: 'Premium',
    icon: Crown,
    color: 'yellow',
    desc: 'Publica todas as pendentes como Premium automaticamente',
    classes: { active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-white text-yellow-700 border-yellow-300' }
  },
  {
    id: 'geral',
    label: 'Geral',
    icon: Rocket,
    color: 'blue',
    desc: 'Publica todas as pendentes como Geral automaticamente',
    classes: { active: 'bg-blue-500 text-white border-blue-500', inactive: 'bg-white text-blue-700 border-blue-300' }
  },
  {
    id: 'premium_destaque',
    label: 'Premium+Destaque',
    icon: Zap,
    color: 'purple',
    desc: 'Publica todas as pendentes como Premium+Destaque automaticamente',
    classes: { active: 'bg-purple-500 text-white border-purple-500', inactive: 'bg-white text-purple-700 border-purple-300' }
  },
  {
    id: 'geral_destaque',
    label: 'Geral+Destaque',
    icon: Star,
    color: 'amber',
    desc: 'Publica todas as pendentes como Geral+Destaque automaticamente',
    classes: { active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-white text-amber-700 border-amber-300' }
  },
  {
    id: 'auto_ia',
    label: 'Auto IA',
    icon: Bot,
    color: 'emerald',
    desc: 'IA classifica: salário>2500/cargo especializado/PJ → Premium+Destaque | Remoto/Híbrido → Premium | Demais → Geral',
    classes: { active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'bg-white text-emerald-700 border-emerald-300' }
  },
];

const BULK_OPTIONS = [
  { label: 'Publicar como Geral', mode: 'geral', icon: Rocket, color: 'text-blue-600' },
  { label: 'Publicar como Premium', mode: 'premium', icon: Crown, color: 'text-yellow-600' },
  { label: 'Publicar como Geral+Destaque', mode: 'geral_destaque', icon: Star, color: 'text-amber-600' },
  { label: 'Publicar como Premium+Destaque', mode: 'premium_destaque', icon: Zap, color: 'text-purple-600' },
  { label: 'Auto IA', mode: 'auto_ia', icon: Bot, color: 'text-emerald-600' },
];

const STORAGE_KEY = 'autopost_keys_active';

export default function VagasPendentesIA() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [autopostKeys, setAutopostKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  // autopostRunning removido - automação agora é serverless (24/7)
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(autopostKeys));
    // Sincronizar com backend para que a automação acesse
    base44.functions.invoke('saveAutopostKeys', { activeKeys: autopostKeys })
      .catch(e => console.warn('Erro ao sincronizar chaves:', e));
  }, [autopostKeys]);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const hasAccess = currentUser?.email === 'alexandreferreirajp01@gmail.com' ||
          currentUser?.role === 'admin' ||
          currentUser?.subscription_type === 'admin';
        if (!hasAccess) { window.location.href = createPageUrl('Home'); return; }
        setUser(currentUser);
      } catch { window.location.href = createPageUrl('Splash'); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, []);

  // Função para detectar e remover vagas duplicadas
  const removeJobDuplicates = async (jobs) => {
    const seen = {};
    const duplicates = [];

    for (const job of jobs) {
      // Criar chave única: título + empresa + cidade
      const key = `${job.title?.toLowerCase()}|${job.company?.toLowerCase()}|${job.city?.toLowerCase()}`;
      
      if (seen[key]) {
        // É duplicata — marcar para deletar
        duplicates.push(job.id);
      } else {
        // Primeira ocorrência
        seen[key] = true;
      }
    }

    // Deletar duplicatas
    if (duplicates.length > 0) {
      try {
        for (const jobId of duplicates) {
          await base44.entities.Job.delete(jobId);
        }
        queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
        toast.success(`🧹 Removidas ${duplicates.length} vaga(s) duplicada(s)!`);
      } catch (e) {
        console.error('Erro ao remover duplicatas:', e);
      }
    }

    return duplicates.length > 0;
  };

  // Fetch pending jobs via backend (service role para garantir acesso)
  const { data: pendingJobs = [], isLoading: loadingJobs, refetch } = useQuery({
    queryKey: ['pending-ai-jobs'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPendingJobs', {});
      const jobs = res.data?.jobs || [];
      
      // Verificar e remover duplicatas automaticamente
      await removeJobDuplicates(jobs);
      
      return jobs;
    },
    enabled: !!user,
    refetchInterval: 30000, // auto-refresh a cada 30s
  });

  const filteredJobs = pendingJobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Nota: O AutoPost agora roda em automação scheduled a cada 5 minutos (24/7)
  // não precisa mais da lógica React aqui

  // AutoPost agora é controlado por automação scheduled (não por React)

  const toggleAutopostKey = (keyId) => {
    setAutopostKeys(prev => {
      const newKeys = {};
      // Desativa todas as outras, ativa só a clicada (ou desativa se já estava ativa)
      if (prev[keyId]) {
        // Desativar
        return newKeys;
      }
      newKeys[keyId] = true;
      return newKeys;
    });
  };

  // Send notification after publishing — force=true garante que mesmo vagas
  // que já tinham notificação de admin (ao chegar via bot) sejam notificadas para usuários
  const sendNotification = async (job) => {
    try {
      await base44.functions.invoke('notifyNewJob', {
        jobId: job.id,
        jobTitle: job.title,
        jobCompany: job.company,
        jobCity: job.city,
        isHomeOffice: job.work_mode === 'Remoto' || job.is_remote === true,
        force: true, // ignora check anti-duplicata: esta é a aprovação definitiva
      });
    } catch (e) {
      console.warn('Erro ao enviar notificação:', e);
    }
  };

  // Publish single job
  const publishMutation = useMutation({
    mutationFn: async ({ job, isPremium, isFeatured }) => {
      await base44.entities.Job.update(job.id, {
        is_premium: isPremium,
        is_featured: isFeatured,
        published_at: new Date().toISOString(),
        status: 'ativa'
      });
      await sendNotification(job);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
      toast.success('✅ Vaga publicada e notificação enviada!');
    },
    onError: (error) => toast.error('❌ Erro ao publicar: ' + error.message)
  });

  // Delete single job
  const deleteMutation = useMutation({
    mutationFn: async (jobId) => base44.entities.Job.delete(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
      toast.success('✅ Vaga descartada!');
    },
    onError: (error) => toast.error('❌ Erro ao descartar: ' + error.message)
  });

  // Bulk publish via backend (com notificações)
  const handleBulkPublish = async (mode) => {
    if (selectedIds.size === 0) return toast.error('Selecione ao menos uma vaga');
    const opt = BULK_OPTIONS.find(o => o.mode === mode);
    if (!confirm(`Publicar ${selectedIds.size} vaga(s) como "${opt?.label}"?`)) return;

    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await base44.functions.invoke('autoPublishPending', { mode, jobIds: ids });
      const { published, errors } = res.data;
      toast.success(`✅ ${published} vaga(s) publicadas${errors > 0 ? `, ${errors} erro(s)` : ''}!`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return toast.error('Selecione ao menos uma vaga');
    if (!confirm(`Descartar ${selectedIds.size} vaga(s)?`)) return;

    setBulkLoading(true);
    let success = 0;
    for (const id of selectedIds) {
      try { await base44.entities.Job.delete(id); success++; } catch { }
    }
    setBulkLoading(false);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
    toast.success(`✅ ${success} vaga(s) descartadas!`);
  };

  const handlePublish = (job, isPremium = false, isFeatured = false) => {
    const label = isPremium && isFeatured ? 'Premium+Destaque' : isPremium ? 'Premium' : isFeatured ? 'Destaque' : 'Geral';
    if (confirm(`Publicar "${job.title}" como ${label}?`)) {
      publishMutation.mutate({ job, isPremium, isFeatured });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredJobs.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredJobs.map(j => j.id)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  const allSelected = filteredJobs.length > 0 && selectedIds.size === filteredJobs.length;
  const someSelected = selectedIds.size > 0;
  const activeKeyId = Object.keys(autopostKeys).find(k => autopostKeys[k]);

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Pendentes da IA</h1>
              <p className="text-white/80 text-sm">Vagas recebidas via WhatsApp aguardando revisão</p>
            </div>
            <div className="flex items-center gap-2">
               <Badge className="bg-emerald-500/90 text-white border-0 flex items-center gap-1 text-xs">
                 <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-1"></span>
                 AutoPost 24/7 Ativo
               </Badge>
               <Badge className="bg-white/20 text-white border-0 text-lg px-4 py-2">
                 {pendingJobs.length} {pendingJobs.length === 1 ? 'vaga' : 'vagas'}
               </Badge>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4 space-y-4">

        {/* ─── Chaves de AutoPost ─── */}
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chaves de AutoPost</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Quando ativada, publica automaticamente todas as vagas pendentes sem precisar aprovar manualmente. Só uma chave pode estar ativa por vez.
                </TooltipContent>
              </Tooltip>
              {activeKeyId && (
                <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-xs">
                  Ativa: {AUTOPOST_KEYS.find(k => k.id === activeKeyId)?.label}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {AUTOPOST_KEYS.map((key) => {
                const Icon = key.icon;
                const isActive = !!autopostKeys[key.id];
                return (
                  <Tooltip key={key.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleAutopostKey(key.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${isActive ? key.classes.active : key.classes.inactive}`}
                      >
                        {isActive
                          ? <ToggleRight className="w-4 h-4" />
                          : <ToggleLeft className="w-4 h-4 opacity-50" />}
                        <Icon className="w-4 h-4" />
                        {key.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {key.desc}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Search + Select All */}
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar vagas pendentes..."
                className="pl-10 h-11 rounded-xl"
              />
            </div>
            {filteredJobs.length > 0 && (
              <Button variant="outline" onClick={toggleSelectAll} className="rounded-xl whitespace-nowrap">
                {allSelected ? <CheckSquare className="w-4 h-4 mr-2 text-blue-600" /> : <Square className="w-4 h-4 mr-2" />}
                {allSelected ? 'Desmarcar tudo' : `Selecionar tudo (${filteredJobs.length})`}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Bulk actions bar */}
        {someSelected && (
          <Card className="shadow-lg rounded-2xl border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {selectedIds.size} vaga(s) selecionada(s)
                </span>
                <div className="flex flex-wrap gap-2 ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl" disabled={bulkLoading}>
                        {bulkLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                        Publicar selecionadas
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Tipo de publicação</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {BULK_OPTIONS.map((opt) => (
                        <DropdownMenuItem key={opt.mode} onClick={() => handleBulkPublish(opt.mode)} className="cursor-pointer">
                          <opt.icon className={`w-4 h-4 mr-2 ${opt.color}`} />
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkLoading}
                    className="rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />Descartar selecionadas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        {loadingJobs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className={`shadow hover:shadow-lg transition-all rounded-2xl overflow-hidden ${selectedIds.has(job.id) ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIds.has(job.id)}
                        onCheckedChange={() => toggleSelect(job.id)}
                        className="mt-1 h-5 w-5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{job.title}</h3>
                          {(job.work_mode === 'Remoto' || job.is_remote) && (
                            <Badge className="bg-teal-100 text-teal-700">🏠 Home Office</Badge>
                          )}
                          {job.salary_range && (
                            <Badge variant="outline" className="text-green-700 border-green-300">💰 {job.salary_range}</Badge>
                          )}
                          <Badge className="bg-yellow-100 text-yellow-700">⏳ Pendente</Badge>
                          {/* Badge de origem — visível apenas para admin/dono */}
                          {job.origem?.toLowerCase().includes('telegram') ? (
                            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <Send className="w-3 h-3" />Telegram
                            </Badge>
                          ) : job.origem?.toLowerCase().includes('whatsapp') || job.origem?.toLowerCase().includes('n8n') || job.origem?.toLowerCase().includes('zapi') || !job.origem || job.origem === '' ? (
                            <Badge className="bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />WhatsApp
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-xs">
                              📌 {job.origem}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {job.company && (
                            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.company}</span>
                          )}
                          {job.city && (
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.city}{job.state ? `, ${job.state}` : ''}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /><TimeAgo date={job.created_date} />
                          </span>
                        </div>

                        {job.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{job.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-slate-700">
                      <Button onClick={() => handlePublish(job, false, false)} disabled={publishMutation.isPending} className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl" size="sm">
                        <Rocket className="w-4 h-4 mr-2" />Geral
                      </Button>
                      <Button onClick={() => handlePublish(job, true, false)} disabled={publishMutation.isPending} variant="outline" size="sm" className="rounded-xl border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                        <Crown className="w-4 h-4 mr-2" />Premium
                      </Button>
                      <Button onClick={() => handlePublish(job, false, true)} disabled={publishMutation.isPending} variant="outline" size="sm" className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50">
                        <Star className="w-4 h-4 mr-2" />Geral+Destaque
                      </Button>
                      <Button onClick={() => handlePublish(job, true, true)} disabled={publishMutation.isPending} variant="outline" size="sm" className="rounded-xl border-purple-300 text-purple-700 hover:bg-purple-50">
                        <Zap className="w-4 h-4 mr-2" />Premium+Destaque
                      </Button>
                      <div className="ml-auto">
                        <Button onClick={() => { if (confirm(`Descartar "${job.title}"?`)) deleteMutation.mutate(job.id); }} disabled={deleteMutation.isPending} variant="outline" size="sm" className="rounded-xl text-red-600 hover:bg-red-50 border-red-200">
                          <Trash2 className="w-4 h-4 mr-2" />Descartar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredJobs.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma vaga pendente</p>
                <p className="text-sm">As vagas recebidas via WhatsApp aparecerão aqui</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}