import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import {
  Copy, Trash2, ChevronDown, ChevronUp, Search,
  AlertTriangle, CheckCheck, X, Loader2
} from "lucide-react";

function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDuplicateGroups(jobs) {
  const map = {};
  jobs.forEach(job => {
    const key = normalize(job.title) + '||' + normalize(job.company);
    if (!map[key]) map[key] = [];
    map[key].push(job);
  });

  return Object.values(map)
    .filter(group => group.length >= 2)
    .map(group => ({
      key: group[0].title + ' — ' + (group[0].company || 'Sem empresa'),
      jobs: [...group].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    }))
    .sort((a, b) => b.jobs.length - a.jobs.length);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function DuplicateJobsDetector({ jobs, onRefresh }) {
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  const allGroups = useMemo(() => buildDuplicateGroups(jobs), [jobs]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return allGroups;
    const term = search.toLowerCase();
    return allGroups.filter(g => g.key.toLowerCase().includes(term));
  }, [allGroups, search]);

  const totalDuplicates = allGroups.reduce((acc, g) => acc + g.jobs.length - 1, 0);
  const totalGroups = allGroups.length;

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleJob = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInGroup = (group) => {
    // Select all except the most recent (index 0)
    const toSelect = group.jobs.slice(1).map(j => j.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      toSelect.forEach(id => next.add(id));
      return next;
    });
  };

  const deselectAllInGroup = (group) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      group.jobs.forEach(j => next.delete(j.id));
      return next;
    });
  };

  const selectAllDuplicates = () => {
    const ids = new Set();
    allGroups.forEach(g => {
      g.jobs.slice(1).forEach(j => ids.add(j.id)); // keep newest, select all others
    });
    setSelectedIds(ids);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const deleteJob = async (jobId) => {
    setDeletingIds(prev => new Set(prev).add(jobId));
    try {
      await base44.entities.Job.delete(jobId);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(jobId); return n; });
      await onRefresh();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(jobId); return n; });
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir ${selectedIds.size} vaga(s) duplicada(s) selecionada(s)? Esta ação é irreversível.`)) return;
    setDeletingAll(true);
    try {
      await base44.functions.invoke('bulkJobActions', {
        jobIds: Array.from(selectedIds),
        action: 'delete'
      });
      setSelectedIds(new Set());
      await onRefresh();
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setDeletingAll(false);
    }
  };

  const deleteAllOldDuplicates = async () => {
    const toDelete = [];
    allGroups.forEach(g => g.jobs.slice(1).forEach(j => toDelete.push(j.id)));
    if (toDelete.length === 0) return;
    if (!confirm(`Excluir TODAS as ${toDelete.length} cópias duplicadas (mantendo a mais nova de cada grupo)? Ação irreversível.`)) return;
    if (!confirm(`Tem certeza ABSOLUTA? Isso irá deletar ${toDelete.length} vagas permanentemente.`)) return;
    setDeletingAll(true);
    try {
      await base44.functions.invoke('bulkJobActions', {
        jobIds: toDelete,
        action: 'delete'
      });
      setSelectedIds(new Set());
      await onRefresh();
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setDeletingAll(false);
    }
  };

  if (totalGroups === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800 mb-1">Nenhuma duplicata encontrada!</h3>
          <p className="text-green-600 text-sm">Todas as vagas são únicas no sistema.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-orange-600">Grupos Duplicados</p>
            <p className="text-3xl font-bold text-orange-700">{totalGroups}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-red-600">Cópias para Remover</p>
            <p className="text-3xl font-bold text-red-700">{totalDuplicates}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-blue-600">Selecionadas</p>
            <p className="text-3xl font-bold text-blue-700">{selectedIds.size}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filtrar por título ou empresa..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={selectAllDuplicates}>
                <CheckCheck className="w-4 h-4 mr-1" />
                Selec. Cópias
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteSelected}
                    disabled={deletingAll}
                  >
                    {deletingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                    Excluir Selecionadas ({selectedIds.size})
                  </Button>
                </>
              )}
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={deleteAllOldDuplicates}
                disabled={deletingAll}
              >
                {deletingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Excluir Todas Cópias
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      <div className="space-y-3">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups[group.key] !== false; // expanded by default
          const groupSelectedCount = group.jobs.filter(j => selectedIds.has(j.id)).length;

          return (
            <Card key={group.key} className="border-orange-200 overflow-hidden">
              {/* Group Header */}
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                onClick={() => toggleGroup(group.key)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Copy className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{group.key}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                        {group.jobs.length}x duplicada
                      </Badge>
                      {groupSelectedCount > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                          {groupSelectedCount} selecionada(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    className="text-xs text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50"
                    onClick={e => { e.stopPropagation(); selectAllInGroup(group); }}
                  >
                    Sel. cópias
                  </button>
                  <button
                    className="text-xs text-slate-500 hover:underline px-2 py-1 rounded hover:bg-slate-100"
                    onClick={e => { e.stopPropagation(); deselectAllInGroup(group); }}
                  >
                    Limpar
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Group Jobs */}
              {isExpanded && (
                <div className="border-t divide-y">
                  {group.jobs.map((job, index) => {
                    const isNewest = index === 0;
                    const isDeleting = deletingIds.has(job.id);
                    const isSelected = selectedIds.has(job.id);

                    return (
                      <div
                        key={job.id}
                        className={`flex items-start gap-3 p-3 ${isNewest ? 'bg-green-50' : 'bg-white hover:bg-slate-50'} ${isSelected ? 'ring-1 ring-inset ring-blue-400' : ''}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleJob(job.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-slate-800 truncate">{job.title}</p>
                            {isNewest && (
                              <Badge className="bg-green-100 text-green-700 border-0 text-xs flex-shrink-0">
                                ✓ Mais nova (manter)
                              </Badge>
                            )}
                            {!isNewest && (
                              <Badge className="bg-red-100 text-red-700 border-0 text-xs flex-shrink-0">
                                Cópia {index}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                            <p className="text-xs text-slate-500">{job.company || 'Sem empresa'}</p>
                            <p className="text-xs text-slate-500">{job.city || '-'}, {job.state || '-'}</p>
                            <p className="text-xs text-slate-400">Criada: {formatDate(job.created_date)}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              job.status === 'ativa' ? 'bg-green-100 text-green-700' :
                              job.status === 'expirada' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>{job.status}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={() => {
                            if (confirm(`Excluir "${job.title}"?`)) deleteJob(job.id);
                          }}
                          disabled={isDeleting}
                          title="Excluir esta vaga"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && search && (
        <div className="text-center py-8 text-slate-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum resultado para "{search}"</p>
        </div>
      )}
    </div>
  );
}