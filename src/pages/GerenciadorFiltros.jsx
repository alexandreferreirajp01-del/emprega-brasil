import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  ArrowLeft, Settings, Plus, Trash2, Edit, Loader2, CheckCircle,
  Save, Briefcase, MapPin, Tag, Clock, AlertTriangle, Database,
  RefreshCw, Search, X, List, History, Eye
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

// Mapeamento tipo → label
const TYPE_LABELS = {
  category: 'Categorias',
  jobFunction: 'Funções',
  jobType: 'Tipos de Vaga',
  city: 'Cidades',
  workModel: 'Modelos de Trabalho',
  seniority: 'Senioridade',
};

const TYPE_ICONS = {
  category: Briefcase,
  jobFunction: Tag,
  jobType: Clock,
  city: MapPin,
  workModel: Briefcase,
  seniority: Tag,
};

const TYPE_COLORS = {
  category: 'bg-blue-100 text-blue-700',
  jobFunction: 'bg-purple-100 text-purple-700',
  jobType: 'bg-green-100 text-green-700',
  city: 'bg-orange-100 text-orange-700',
  workModel: 'bg-teal-100 text-teal-700',
  seniority: 'bg-rose-100 text-rose-700',
};

// Componente de Toast
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-xl shadow-lg max-w-sm text-white text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
      {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
      {toast.message}
    </div>
  );
}

export default function GerenciadorFiltros() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeType, setActiveType] = useState('category');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'audit'

  // Dados
  const [filters, setFilters] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Dialogs
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Verificar auth admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' ||
          currentUser.role === 'admin' ||
          currentUser.subscription_type === 'admin';
        if (!isAdmin) {
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
    checkAdmin();
  }, []);

  // Carregar filtros do banco
  const loadFilters = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const data = await base44.entities.FilterMaster.list('order', 5000);
      setFilters(data);
    } catch (e) {
      showToast('Erro ao carregar filtros: ' + e.message, 'error');
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  // Carregar log de auditoria
  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const data = await base44.entities.FilterAuditLog.list('-created_date', 100);
      setAuditLogs(data);
    } catch (e) {
      showToast('Erro ao carregar auditoria', 'error');
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFilters();
    }
  }, [user, loadFilters]);

  useEffect(() => {
    if (user && view === 'audit') {
      loadAudit();
    }
  }, [user, view, loadAudit]);

  // Itens do tipo ativo com busca
  const activeItems = filters
    .filter(f => f.type === activeType)
    .filter(f => !searchTerm || f.value?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.value?.localeCompare(b.value));

  const countByType = (type) => filters.filter(f => f.type === type).length;

  // Abrir dialog de adicionar
  const handleAdd = () => {
    setEditingItem({ type: activeType, value: '', isNew: true });
    setEditDialog(true);
  };

  // Abrir dialog de editar
  const handleEdit = (item) => {
    setEditingItem({ ...item, isNew: false, originalValue: item.value });
    setEditDialog(true);
  };

  // Abrir dialog de deletar
  const handleDeleteConfirm = (item) => {
    setDeletingItem(item);
    setDeleteDialog(true);
  };

  // Salvar (criar ou atualizar) diretamente no banco
  const handleSave = async () => {
    if (!editingItem?.value?.trim()) {
      showToast('O campo não pode estar vazio', 'error');
      return;
    }

    const value = editingItem.value.trim();

    // Checar duplicata
    const duplicate = filters.find(
      f => f.type === editingItem.type &&
        f.value?.toLowerCase() === value.toLowerCase() &&
        f.id !== editingItem.id
    );
    if (duplicate) {
      showToast('Já existe um filtro com esse valor', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingItem.isNew) {
        // Criar no banco
        const maxOrder = filters.filter(f => f.type === editingItem.type).length;
        const created = await base44.asServiceRole.entities.FilterMaster.create({
          type: editingItem.type,
          value,
          slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          order: maxOrder,
          is_active: true,
        });

        // Sync ProfessionalCategory se for category
        if (editingItem.type === 'category') {
          await syncCategoryToPC(value, 'create');
        }

        setFilters(prev => [...prev, created]);
        showToast(`"${value}" adicionado com sucesso`);
      } else {
        // Atualizar no banco
        await base44.asServiceRole.entities.FilterMaster.update(editingItem.id, {
          value,
          slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        });

        // Sync ProfessionalCategory se for category
        if (editingItem.type === 'category') {
          await syncCategoryToPC(value, 'update', editingItem.originalValue);
        }

        setFilters(prev => prev.map(f => f.id === editingItem.id ? { ...f, value, slug: value.toLowerCase().replace(/\s+/g, '-') } : f));
        showToast(`Atualizado para "${value}"`);
      }

      // Log auditoria
      await base44.asServiceRole.entities.FilterAuditLog.create({
        action: editingItem.isNew ? 'create' : 'update',
        filter_type: editingItem.type,
        filter_value: value,
        old_value: editingItem.isNew ? '' : editingItem.originalValue,
        user_email: user.email,
        user_name: user.full_name || user.email,
        changes_summary: editingItem.isNew
          ? `Criado: ${value}`
          : `Editado: ${editingItem.originalValue} → ${value}`,
      });

      // Notificar front
      window.dispatchEvent(new CustomEvent('filters-updated', { detail: { timestamp: Date.now() } }));
      setEditDialog(false);
      setEditingItem(null);
    } catch (e) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Deletar diretamente no banco
  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await base44.asServiceRole.entities.FilterMaster.delete(deletingItem.id);

      // Sync ProfessionalCategory se for category
      if (deletingItem.type === 'category') {
        await syncCategoryToPC(deletingItem.value, 'delete');
      }

      setFilters(prev => prev.filter(f => f.id !== deletingItem.id));

      // Log auditoria
      await base44.asServiceRole.entities.FilterAuditLog.create({
        action: 'delete',
        filter_type: deletingItem.type,
        filter_value: deletingItem.value,
        user_email: user.email,
        user_name: user.full_name || user.email,
        changes_summary: `Deletado: ${deletingItem.value}`,
      });

      window.dispatchEvent(new CustomEvent('filters-updated', { detail: { timestamp: Date.now() } }));
      showToast(`"${deletingItem.value}" removido`);
      setDeleteDialog(false);
      setDeletingItem(null);
    } catch (e) {
      showToast('Erro ao deletar: ' + e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Sincronizar categorias com ProfessionalCategory
  const syncCategoryToPC = async (value, action, oldValue = '') => {
    try {
      if (action === 'create') {
        const existingPCs = await base44.asServiceRole.entities.ProfessionalCategory.filter({ category_name: value });
        if (existingPCs.length === 0) {
          const maxOrder = (await base44.asServiceRole.entities.ProfessionalCategory.list('category_order', 500)).length;
          await base44.asServiceRole.entities.ProfessionalCategory.create({
            category_name: value,
            category_order: maxOrder + 1,
            job_titles: [],
            keywords: [value.toLowerCase()],
            is_active: true,
          });
        }
      } else if (action === 'update' && oldValue) {
        const existingPCs = await base44.asServiceRole.entities.ProfessionalCategory.filter({ category_name: oldValue });
        for (const pc of existingPCs) {
          await base44.asServiceRole.entities.ProfessionalCategory.update(pc.id, {
            category_name: value,
            keywords: [value.toLowerCase()],
          });
        }
      } else if (action === 'delete') {
        const existingPCs = await base44.asServiceRole.entities.ProfessionalCategory.filter({ category_name: value });
        for (const pc of existingPCs) {
          await base44.asServiceRole.entities.ProfessionalCategory.update(pc.id, { is_active: false });
        }
      }
    } catch (e) {
      console.warn('Sync PC error (não crítico):', e.message);
    }
  };

  // Ativar/Desativar filtro
  const handleToggleActive = async (item) => {
    try {
      const newActive = !item.is_active;
      await base44.asServiceRole.entities.FilterMaster.update(item.id, { is_active: newActive });
      setFilters(prev => prev.map(f => f.id === item.id ? { ...f, is_active: newActive } : f));
      showToast(`"${item.value}" ${newActive ? 'ativado' : 'desativado'}`);
      window.dispatchEvent(new CustomEvent('filters-updated', { detail: { timestamp: Date.now() } }));
    } catch (e) {
      showToast('Erro: ' + e.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const Icon = TYPE_ICONS[activeType] || Tag;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toast toast={toast} />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 pt-4 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link to={createPageUrl('Configuracoes')}>
              <Button variant="ghost" className="text-white hover:bg-white/20 h-9 text-sm px-3">
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(v => v === 'list' ? 'audit' : 'list')}
                className="text-white hover:bg-white/20"
                title={view === 'list' ? 'Ver auditoria' : 'Ver filtros'}
              >
                {view === 'list' ? <History className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadFilters}
                disabled={loadingFilters}
                className="text-white hover:bg-white/20"
                title="Recarregar"
              >
                <RefreshCw className={`w-4 h-4 ${loadingFilters ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gerenciador de Filtros</h1>
              <p className="text-white/70 text-xs flex items-center gap-1">
                <Database className="w-3 h-3" />
                {filters.length} filtros ativos no banco · salvamento direto
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View: Filtros */}
      {view === 'list' && (
        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* Cards de tipos */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
            {Object.keys(TYPE_LABELS).map(type => {
              const TypeIcon = TYPE_ICONS[type];
              const count = countByType(type);
              const isActive = activeType === type;
              return (
                <button
                  key={type}
                  onClick={() => { setActiveType(type); setSearchTerm(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${isActive
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                >
                  <TypeIcon className={`w-4 h-4 mb-1 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div className={`text-xs font-semibold leading-tight ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {TYPE_LABELS[type]}
                  </div>
                  <div className={`text-lg font-bold mt-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {count}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Painel do tipo ativo */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-base">{TYPE_LABELS[activeType]}</CardTitle>
                  <Badge className={`text-xs ${TYPE_COLORS[activeType]}`}>{activeItems.length} exibidos</Badge>
                </div>
                <Button
                  onClick={handleAdd}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-9"
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
              {/* Busca */}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={`Buscar em ${TYPE_LABELS[activeType]}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-3">
              {loadingFilters ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-1.5">
                    {activeItems.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${item.is_active !== false
                          ? 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                          : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-slate-400 w-6 text-right shrink-0">#{item.order ?? '—'}</span>
                          <span className="text-sm font-medium text-slate-800 truncate">{item.value}</span>
                          {item.is_active === false && (
                            <Badge variant="outline" className="text-xs text-slate-400 border-slate-300 shrink-0">inativo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(item)}
                            className={`h-7 w-7 p-0 ${item.is_active !== false ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:text-green-500 hover:bg-green-50'}`}
                            title={item.is_active !== false ? 'Desativar' : 'Ativar'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-7 w-7 p-0 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConfirm(item)}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Deletar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {activeItems.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <Icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{searchTerm ? 'Nenhum resultado' : 'Nenhum item cadastrado'}</p>
                        {!searchTerm && (
                          <Button onClick={handleAdd} variant="outline" size="sm" className="mt-3">
                            <Plus className="w-4 h-4 mr-1" /> Adicionar primeiro item
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* View: Auditoria */}
      {view === 'audit' && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Log de Auditoria
                <Badge className="bg-slate-100 text-slate-600 text-xs">{auditLogs.length} registros</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAudit ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-2">
                  <div className="space-y-2">
                    {auditLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                        <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${
                          log.action === 'create' ? 'bg-green-100 text-green-700' :
                          log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'delete' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.action === 'create' ? 'CRIADO' :
                           log.action === 'update' ? 'EDITADO' :
                           log.action === 'delete' ? 'DELETADO' : 'BULK'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 font-medium">{log.changes_summary}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {log.user_email} · {log.created_date ? new Date(log.created_date).toLocaleString('pt-BR') : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum registro de auditoria</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog: Adicionar / Editar */}
      <Dialog open={editDialog} onOpenChange={(v) => { if (!saving) { setEditDialog(v); if (!v) setEditingItem(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingItem?.isNew ? <Plus className="w-5 h-5 text-indigo-600" /> : <Edit className="w-5 h-5 text-indigo-600" />}
              {editingItem?.isNew ? 'Adicionar' : 'Editar'} — {TYPE_LABELS[editingItem?.type]}
            </DialogTitle>
          </DialogHeader>

          {!editingItem?.isNew && (
            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
              Valor atual: <strong>{editingItem?.originalValue}</strong>
            </div>
          )}

          <Input
            placeholder="Digite o valor..."
            value={editingItem?.value || ''}
            onChange={e => setEditingItem(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && !saving && handleSave()}
            className="h-11"
            autoFocus
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditDialog(false); setEditingItem(null); }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !editingItem?.value?.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : <><Save className="w-4 h-4 mr-2" />Salvar no banco</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão */}
      <Dialog open={deleteDialog} onOpenChange={(v) => { if (!deleting) { setDeleteDialog(v); if (!v) setDeletingItem(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-600 mb-3">Tem certeza que deseja excluir permanentemente:</p>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="font-semibold text-red-700">"{deletingItem?.value}"</p>
              <p className="text-xs text-red-500 mt-0.5">Tipo: {TYPE_LABELS[deletingItem?.type]}</p>
            </div>
            <p className="text-xs text-slate-400 mt-3">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteDialog(false); setDeletingItem(null); }} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deletando...</> : <><Trash2 className="w-4 h-4 mr-2" />Excluir permanentemente</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}