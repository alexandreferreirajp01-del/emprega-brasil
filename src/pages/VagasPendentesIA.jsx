import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Search, Rocket, Trash2, Crown, Star,
  Loader2, MapPin, Building2, Calendar, MessageCircle, CheckCircle,
  CheckSquare, Square, ChevronDown, Zap, Users, Shield
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

const BULK_OPTIONS = [
  { label: 'Publicar como Geral', icon: Rocket, isPremium: false, isFeatured: false, color: 'text-blue-600' },
  { label: 'Publicar como Premium', icon: Crown, isPremium: true, isFeatured: false, color: 'text-yellow-600' },
  { label: 'Publicar como Destaque', icon: Star, isPremium: false, isFeatured: true, color: 'text-amber-600' },
  { label: 'Publicar como Premium + Destaque', icon: Zap, isPremium: true, isFeatured: true, color: 'text-purple-600' },
];

export default function VagasPendentesIA() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const queryClient = useQueryClient();

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const hasAccess = currentUser?.email === 'alexandreferreirajp01@gmail.com' ||
          currentUser?.role === 'admin' ||
          currentUser?.subscription_type === 'admin';
        if (!hasAccess) {
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

  // Fetch pending jobs
  const { data: pendingJobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['pending-ai-jobs'],
    queryFn: async () => {
      const allJobs = await base44.entities.Job.list('-created_date', 1000);
      return allJobs.filter(job =>
        (job.status === 'pending_review' || job.status === 'pending_ai') &&
        job.origem === 'whatsapp_agent'
      );
    },
    enabled: !!user
  });

  const filteredJobs = pendingJobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Send notification after publishing
  const sendNotification = async (job) => {
    try {
      await base44.functions.invoke('notifyNewJob', {
        jobId: job.id,
        jobTitle: job.title,
        jobCompany: job.company,
        jobCity: job.city,
        isHomeOffice: job.work_mode === 'Remoto' || job.is_remote === true,
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
    onError: (error) => {
      toast.error('❌ Erro ao publicar: ' + error.message);
    }
  });

  // Delete single job
  const deleteMutation = useMutation({
    mutationFn: async (jobId) => {
      await base44.entities.Job.delete(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
      toast.success('✅ Vaga descartada!');
    },
    onError: (error) => {
      toast.error('❌ Erro ao descartar: ' + error.message);
    }
  });

  // Bulk publish
  const [bulkLoading, setBulkLoading] = useState(false);
  const handleBulkPublish = async (isPremium, isFeatured) => {
    if (selectedIds.size === 0) return toast.error('Selecione ao menos uma vaga');
    const label = isPremium && isFeatured ? 'Premium + Destaque' : isPremium ? 'Premium' : isFeatured ? 'Destaque' : 'Geral';
    if (!confirm(`Publicar ${selectedIds.size} vaga(s) como "${label}"?`)) return;

    setBulkLoading(true);
    let success = 0, errors = 0;
    const jobsToPublish = filteredJobs.filter(j => selectedIds.has(j.id));

    for (const job of jobsToPublish) {
      try {
        await base44.entities.Job.update(job.id, {
          is_premium: isPremium,
          is_featured: isFeatured,
          published_at: new Date().toISOString(),
          status: 'ativa'
        });
        await sendNotification(job);
        success++;
      } catch {
        errors++;
      }
    }

    setBulkLoading(false);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['pending-ai-jobs'] });
    toast.success(`✅ ${success} vaga(s) publicadas${errors > 0 ? `, ${errors} erro(s)` : ''}!`);
  };

  // Bulk delete
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

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJobs.map(j => j.id)));
    }
  };

  const handlePublish = (job, isPremium = false, isFeatured = false) => {
    const label = isPremium && isFeatured ? 'Premium + Destaque' : isPremium ? 'Premium' : isFeatured ? 'Destaque' : '';
    if (confirm(`Publicar "${job.title}"${label ? ` como ${label}` : ''}?`)) {
      publishMutation.mutate({ job, isPremium, isFeatured });
    }
  };

  const handleDelete = (job) => {
    if (confirm(`Descartar vaga "${job.title}"?`)) {
      deleteMutation.mutate(job.id);
    }
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

  return (
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
            <Badge className="bg-white/20 text-white border-0 text-lg px-4 py-2">
              {pendingJobs.length} {pendingJobs.length === 1 ? 'vaga' : 'vagas'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4 space-y-4">

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
              <Button
                variant="outline"
                onClick={toggleSelectAll}
                className="rounded-xl whitespace-nowrap"
              >
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
                  {/* Dropdown de publicação em massa */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
                        disabled={bulkLoading}
                      >
                        {bulkLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                        Publicar selecionadas
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Tipo de publicação</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {BULK_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.label}
                          onClick={() => handleBulkPublish(opt.isPremium, opt.isFeatured)}
                          className="cursor-pointer"
                        >
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
                    <Trash2 className="w-4 h-4 mr-2" />
                    Descartar selecionadas
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
                    {/* Header with checkbox */}
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
                          <Badge className="bg-yellow-100 text-yellow-700">⏳ Pendente</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {job.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />{job.company}
                            </span>
                          )}
                          {job.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />{job.city}{job.state ? `, ${job.state}` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <TimeAgo date={job.created_date} />
                          </span>
                          {job.salary_range && (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              💰 {job.salary_range}
                            </Badge>
                          )}
                        </div>

                        {job.origin_group_name && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg mb-2">
                            <MessageCircle className="w-3 h-3" />
                            <span>Origem: {job.origin_group_name}</span>
                            {job.origin_channel && <span>• {job.origin_channel}</span>}
                          </div>
                        )}

                        {job.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                            {job.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-slate-700">
                      <Button
                        onClick={() => handlePublish(job, false, false)}
                        disabled={publishMutation.isPending}
                        className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
                        size="sm"
                      >
                        <Rocket className="w-4 h-4 mr-2" />Publicar
                      </Button>
                      <Button
                        onClick={() => handlePublish(job, true, false)}
                        disabled={publishMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      >
                        <Crown className="w-4 h-4 mr-2" />Premium
                      </Button>
                      <Button
                        onClick={() => handlePublish(job, false, true)}
                        disabled={publishMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Star className="w-4 h-4 mr-2" />Destaque
                      </Button>
                      <Button
                        onClick={() => handlePublish(job, true, true)}
                        disabled={publishMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Zap className="w-4 h-4 mr-2" />Premium + Destaque
                      </Button>

                      <div className="ml-auto">
                        <Button
                          onClick={() => handleDelete(job)}
                          disabled={deleteMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-red-600 hover:bg-red-50 border-red-200"
                        >
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
  );
}