import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Briefcase, Loader2, Search, Filter, MapPin, AlertCircle, 
  CheckCircle2, Eye, EyeOff, Edit, Trash2, RefreshCw, Copy,
  Settings, ChevronDown, ChevronUp, Download, ArrowLeft
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditJobModal from "@/components/admin/EditJobModal";

export default function GerenciarVagas() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    contactStatus: 'all',
    mapStatus: 'all',
    workMode: 'all',
    city: '',
    state: '',
    period: 'all',
    periodType: 'days',
    locationStatus: 'all',
    missingContact: 'all',
    missingDescription: 'all',
    missingCity: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [editingJob, setEditingJob] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.role === 'admin' || user.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setIsAuthorized(true);
        await loadData();
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    init();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allJobs = await base44.entities.Job.list('-created_date', 10000);
      setJobs(allJobs);
      calculateStats(allJobs);
    } catch (err) {
      console.error('Erro ao carregar vagas:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (jobList) => {
    const now = new Date();
    const stats = {
      total: jobList.length,
      active: jobList.filter(j => j.status === 'ativa').length,
      expired: jobList.filter(j => j.status === 'expirada').length,
      hidden: jobList.filter(j => j.status === 'hidden').length,
      needsReview: jobList.filter(j => j.needs_review).length,
      noContact: jobList.filter(j => j.contact_status === 'missing').length,
      withContact: jobList.filter(j => j.contact_status === 'ok').length,
      mapReady: jobList.filter(j => j.geocode_status === 'ok' && j.exibir_no_mapa).length,
      mapFailed: jobList.filter(j => j.geocode_status === 'failed').length,
      remote: jobList.filter(j => j.is_remote || j.work_mode === 'Remoto').length,
      noCity: jobList.filter(j => !j.city || j.city.trim() === '').length,
      noState: jobList.filter(j => !j.state || j.state.trim() === '').length
    };
    setStats(stats);
  };

  const getFilteredJobs = () => {
    let filtered = jobs;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(j => 
        j.title?.toLowerCase().includes(term) ||
        j.company?.toLowerCase().includes(term) ||
        j.city?.toLowerCase().includes(term)
      );
    }

    // Filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(j => j.status === filters.status);
    }
    if (filters.contactStatus !== 'all') {
      filtered = filtered.filter(j => j.contact_status === filters.contactStatus);
    }
    if (filters.mapStatus !== 'all') {
      if (filters.mapStatus === 'ready') {
        filtered = filtered.filter(j => j.geocode_status === 'ok');
      } else if (filters.mapStatus === 'failed') {
        filtered = filtered.filter(j => j.geocode_status === 'failed');
      } else if (filters.mapStatus === 'pending') {
        filtered = filtered.filter(j => j.geocode_status === 'pending');
      }
    }
    if (filters.workMode !== 'all') {
      filtered = filtered.filter(j => j.work_mode === filters.workMode);
    }
    if (filters.city) {
      filtered = filtered.filter(j => j.city?.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.state) {
      filtered = filtered.filter(j => j.state?.toLowerCase().includes(filters.state.toLowerCase()));
    }
    if (filters.period !== 'all' && filters.periodType === 'days') {
      const days = parseInt(filters.period);
      if (!isNaN(days)) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        filtered = filtered.filter(j => new Date(j.created_date) >= cutoff);
      }
    }
    if (filters.locationStatus === 'no_city') {
      filtered = filtered.filter(j => !j.city || j.city.trim() === '');
    } else if (filters.locationStatus === 'no_state') {
      filtered = filtered.filter(j => !j.state || j.state.trim() === '');
    } else if (filters.locationStatus === 'incomplete') {
      filtered = filtered.filter(j => !j.city || !j.state || j.city.trim() === '' || j.state.trim() === '');
    } else if (filters.locationStatus === 'complete') {
      filtered = filtered.filter(j => j.city && j.state && j.city.trim() !== '' && j.state.trim() !== '');
    }

    return filtered;
  };

  const handleBulkAction = async (action) => {
    if (selectedJobs.length === 0) {
      alert('Selecione ao menos uma vaga');
      return;
    }

    if (!confirm(`Aplicar "${action}" em ${selectedJobs.length} vaga(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('bulkJobActions', {
        jobIds: selectedJobs,
        action: action
      });
      
      await loadData();
      setSelectedJobs([]);
      alert(`Ação "${action}" aplicada com sucesso!`);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocessLocation = async () => {
    if (!confirm('Reprocessar localização de todas as vagas? Pode levar alguns minutos.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('geocodeJobs', {});
      await loadData();
      alert(response.data.message || 'Localização reprocessada com sucesso!');
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeocodeSelected = async () => {
    if (selectedJobs.length === 0) {
      alert('Selecione ao menos uma vaga');
      return;
    }

    if (!confirm(`Geocodificar ${selectedJobs.length} vaga(s) selecionada(s)? Isso pode levar alguns minutos.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('geocodeJobs', {
        jobIds: selectedJobs
      });
      console.log('Resposta geocode:', response);
      await loadData();
      setSelectedJobs([]);
      alert(response.data?.message || 'Geocodificação concluída!');
    } catch (err) {
      console.error('Erro geocode:', err);
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOld = async (days) => {
    if (!confirm(`Excluir vagas publicadas há mais de ${days} dias?`)) {
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('deleteOldJobs', { days });
      await loadData();
      alert('Vagas antigas excluídas!');
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = getFilteredJobs();
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-6 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciador de Vagas</h1>
              <p className="text-white/70 text-sm">Central única de controle e manutenção</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-3 text-center">
                <p className="text-white/70 text-xs">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/20 backdrop-blur-sm border-green-300/30">
              <CardContent className="p-3 text-center">
                <p className="text-white/70 text-xs">Ativas</p>
                <p className="text-2xl font-bold text-white">{stats.active || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/20 backdrop-blur-sm border-red-300/30">
              <CardContent className="p-3 text-center">
                <p className="text-white/70 text-xs">Expiradas</p>
                <p className="text-2xl font-bold text-white">{stats.expired || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/20 backdrop-blur-sm border-orange-300/30">
              <CardContent className="p-3 text-center">
                <p className="text-white/70 text-xs">Sem Contato</p>
                <p className="text-2xl font-bold text-white">{stats.noContact || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/20 backdrop-blur-sm border-purple-300/30">
              <CardContent className="p-3 text-center">
                <p className="text-white/70 text-xs">Mapa OK</p>
                <p className="text-2xl font-bold text-white">{stats.mapReady || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/20 backdrop-blur-sm border-yellow-300/30">
              <CardContent className="p-3 text-center">
                <p className="text-white/70 text-xs">Revisão</p>
                <p className="text-2xl font-bold text-white">{stats.needsReview || 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Lista de Vagas</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
            <TabsTrigger value="health">Saúde do Sistema</TabsTrigger>
          </TabsList>

          {/* Lista de Vagas */}
          <TabsContent value="list" className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por título, empresa ou cidade..."
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {showFilters && (
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t">
                     <div>
                       <Label className="text-xs">Status</Label>
                       <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                         <SelectTrigger className="h-9">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos</SelectItem>
                           <SelectItem value="ativa">Ativas</SelectItem>
                           <SelectItem value="expirada">Expiradas</SelectItem>
                           <SelectItem value="hidden">Ocultas</SelectItem>
                           <SelectItem value="pending_review">Pendentes</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <Label className="text-xs">Contato</Label>
                       <Select value={filters.contactStatus} onValueChange={(v) => setFilters(prev => ({ ...prev, contactStatus: v }))}>
                         <SelectTrigger className="h-9">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos</SelectItem>
                           <SelectItem value="ok">✅ Com Contato</SelectItem>
                           <SelectItem value="missing">❌ Sem Contato</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <Label className="text-xs">Mapa</Label>
                       <Select value={filters.mapStatus} onValueChange={(v) => setFilters(prev => ({ ...prev, mapStatus: v }))}>
                         <SelectTrigger className="h-9">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos</SelectItem>
                           <SelectItem value="ready">✅ Mapa OK</SelectItem>
                           <SelectItem value="failed">❌ Falha</SelectItem>
                           <SelectItem value="pending">⏳ Pendente</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <Label className="text-xs">Período</Label>
                       <Select value={filters.period} onValueChange={(v) => setFilters(prev => ({ ...prev, period: v }))}>
                         <SelectTrigger className="h-9">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos</SelectItem>
                           <SelectItem value="1">Hoje</SelectItem>
                           <SelectItem value="3">Últimos 3 dias</SelectItem>
                           <SelectItem value="7">Últimos 7 dias</SelectItem>
                           <SelectItem value="15">Últimos 15 dias</SelectItem>
                           <SelectItem value="30">Últimos 30 dias</SelectItem>
                           <SelectItem value="60">Últimos 60 dias</SelectItem>
                           <SelectItem value="90">Últimos 90 dias</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <Label className="text-xs">Localização</Label>
                       <Select value={filters.locationStatus || 'all'} onValueChange={(v) => setFilters(prev => ({ ...prev, locationStatus: v }))}>
                         <SelectTrigger className="h-9">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todas</SelectItem>
                           <SelectItem value="no_city">🔴 Sem Cidade</SelectItem>
                           <SelectItem value="no_state">🔴 Sem Estado</SelectItem>
                           <SelectItem value="incomplete">🟡 Incompleto</SelectItem>
                           <SelectItem value="complete">✅ Completo</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     </div>
                     )}
                    </CardContent>
                    </Card>

            {/* Bulk Actions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {selectedJobs.length > 0 ? `${selectedJobs.length} vaga(s) selecionada(s)` : 'Selecione vagas para ações em massa'}
                    </p>
                    {selectedJobs.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setSelectedJobs([])}
                        className="text-slate-600"
                      >
                        Limpar seleção
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedJobs.length > 0 ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('hide')}>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Ocultar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                          <Eye className="w-4 h-4 mr-1" />
                          Ativar
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleGeocodeSelected}>
                          <MapPin className="w-4 h-4 mr-1" />
                          Geocodificar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedJobs(filteredJobs.map(j => j.id))}
                        >
                          Selecionar Todas ({filteredJobs.length})
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm(`ATENÇÃO: Apagar TODAS as ${filteredJobs.length} vagas exibidas? Esta ação não pode ser desfeita!`)) {
                              return;
                            }
                            if (!confirm(`Tem certeza ABSOLUTA? Isso irá deletar ${filteredJobs.length} vagas permanentemente!`)) {
                              return;
                            }
                            setLoading(true);
                            try {
                              await base44.functions.invoke('bulkJobActions', {
                                jobIds: filteredJobs.map(j => j.id),
                                action: 'delete'
                              });
                              await loadData();
                              alert('Todas as vagas foram deletadas com sucesso!');
                            } catch (err) {
                              alert('Erro: ' + err.message);
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Apagar TODAS ({filteredJobs.length})
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-3 text-left">
                          <Checkbox
                            checked={selectedJobs.length === paginatedJobs.length && paginatedJobs.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedJobs(paginatedJobs.map(j => j.id));
                              } else {
                                setSelectedJobs([]);
                              }
                            }}
                          />
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-slate-600">Vaga</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-600">Localização</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-600">Status</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-600">Contato</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-600">Mapa</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedJobs.map(job => (
                        <tr key={job.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedJobs.includes(job.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedJobs([...selectedJobs, job.id]);
                                } else {
                                  setSelectedJobs(selectedJobs.filter(id => id !== job.id));
                                }
                              }}
                            />
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-sm">{job.title}</p>
                            <p className="text-xs text-slate-500">{job.company}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-xs">{job.city || '-'}, {job.state || '-'}</p>
                            {job.neighborhood && <p className="text-xs text-slate-500">{job.neighborhood}</p>}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              job.status === 'ativa' ? 'bg-green-100 text-green-700' :
                              job.status === 'expirada' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {job.contact_status === 'ok' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={async () => {
                                  try {
                                    const newValue = !job.exibir_no_mapa;
                                    await base44.entities.Job.update(job.id, {
                                      exibir_no_mapa: newValue
                                    });
                                    await loadData();
                                  } catch (err) {
                                    alert('Erro ao atualizar: ' + err.message);
                                  }
                                }}
                                title={job.exibir_no_mapa ? "Ocultar do mapa" : "Exibir no mapa"}
                              >
                                {job.exibir_no_mapa ? (
                                  <Eye className="w-4 h-4 text-green-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                )}
                              </Button>
                              {job.latitude && job.longitude ? (
                                <span className="text-xs text-green-600" title={`Lat: ${job.latitude}, Lng: ${job.longitude}`}>
                                  ✓
                                </span>
                              ) : (
                                <span className="text-xs text-red-600" title="Sem coordenadas">
                                  ✗
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingJob(job);
                                  setShowEditModal(true);
                                }}
                                title="Editar vaga"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={async () => {
                                  if (!confirm(`Excluir a vaga "${job.title}"?`)) return;
                                  try {
                                    await base44.entities.Job.delete(job.id);
                                    await loadData();
                                    alert('Vaga excluída com sucesso!');
                                  } catch (err) {
                                    alert('Erro ao excluir: ' + err.message);
                                  }
                                }}
                                title="Excluir vaga"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-slate-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredJobs.length)} de {filteredJobs.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manutenção */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Ferramentas de Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleReprocessLocation}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Geocodificar Todas as Vagas (Obter Coordenadas)
                </Button>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-2">ℹ️ Como funciona o Mapa</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Vagas precisam ter cidade e estado preenchidos</li>
                    <li>• Use "Geocodificar" para obter coordenadas automaticamente</li>
                    <li>• Clique no ícone da coluna "Mapa" para habilitar/desabilitar vaga no mapa</li>
                    <li>• Vagas remotas não aparecem no mapa</li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleDeleteOld(30)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Vagas com Mais de 30 Dias
                </Button>

                <Button
                  onClick={() => handleDeleteOld(60)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Vagas com Mais de 60 Dias
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saúde do Sistema */}
          <TabsContent value="health" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alertas de Qualidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm">Vagas sem contato</span>
                    <span className="font-bold text-orange-600">{stats.noContact || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">Vagas sem cidade</span>
                    <span className="font-bold text-red-600">{stats.noCity || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Falhas no mapa</span>
                    <span className="font-bold text-yellow-600">{stats.mapFailed || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Positivos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Com contato válido</span>
                    <span className="font-bold text-green-600">{stats.withContact || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">Prontas para mapa</span>
                    <span className="font-bold text-blue-600">{stats.mapReady || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm">Vagas remotas</span>
                    <span className="font-bold text-purple-600">{stats.remote || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Job Modal */}
      <EditJobModal
        job={editingJob}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingJob(null);
        }}
        onUpdateSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}