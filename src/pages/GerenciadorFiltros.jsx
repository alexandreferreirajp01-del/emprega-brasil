import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ArrowLeft, Settings, Plus, Trash2, Edit, Loader2, CheckCircle, 
  Save, Briefcase, MapPin, Tag, Clock, AlertTriangle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const ADMIN_PASSWORD = "Vagas2026#";

const INITIAL_JOB_TYPES = ['CLT', 'PJ', 'Autônomo', 'Estágio', 'Jovem Aprendiz', 'Temporário', 'Freelancer', 'Trainee', 'Banco de Talentos'];
const INITIAL_CITIES = ['João Pessoa', 'Campina Grande', 'Bayeux', 'Cabedelo', 'Santa Rita', 'Patos', 'Guarabira', 'Cajazeiras', 'Sousa', 'Pombal', 'Conde'];
const INITIAL_WORK_MODELS = ['Presencial', 'Híbrido', 'Home Office', 'Remoto'];
const INITIAL_SENIORITY = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista'];

export default function GerenciadorFiltros() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('categories');
  const [editingItem, setEditingItem] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  
  const [filters, setFilters] = useState({
    categories: [],
    jobFunctions: [],
    jobTypes: INITIAL_JOB_TYPES,
    cities: INITIAL_CITIES,
    workModels: INITIAL_WORK_MODELS,
    seniority: INITIAL_SENIORITY
  });
  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Carregar categorias existentes
  const { data: categories = [] } = useQuery({
    queryKey: ['professional-categories'],
    queryFn: () => base44.entities.ProfessionalCategory.list('category_order', 100),
    enabled: !!user,
  });

  // Sincronizar dados ao carregar
  useEffect(() => {
    if (categories.length > 0) {
      const cats = categories.map(c => c.category_name).filter(Boolean).sort();
      const funcs = [...new Set(categories.flatMap(c => c.job_titles || []))].filter(Boolean).sort();
      setFilters(prev => ({ 
        ...prev, 
        categories: cats.length > 0 ? cats : prev.categories,
        jobFunctions: funcs.length > 0 ? funcs : prev.jobFunctions
      }));
    }
  }, [categories]);

  const handleAdd = (type) => {
    setEditingItem({ type, value: '', isNew: true });
    setEditDialog(true);
  };

  const handleEdit = (type, value) => {
    setEditingItem({ type, value, isNew: false, original: value });
    setEditDialog(true);
  };

  const handleDelete = (type, value) => {
    if (confirm(`Excluir "${value}"?`)) {
      setFilters(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item !== value)
      }));
      setPendingChanges(true);
      showToast('Item removido. Clique em Salvar para confirmar.');
    }
  };

  const handleSaveItem = () => {
    if (!editingItem?.value?.trim()) {
      showToast('Campo vazio', 'error');
      return;
    }

    const value = editingItem.value.trim();
    const type = editingItem.type;

    setFilters(prev => {
      const updated = [...prev[type]];
      if (editingItem.isNew) {
        if (updated.includes(value)) {
          showToast('Item já existe', 'error');
          return prev;
        }
        updated.push(value);
      } else {
        const index = updated.indexOf(editingItem.original);
        if (index !== -1) updated[index] = value;
      }
      return { ...prev, [type]: updated.sort() };
    });

    setPendingChanges(true);
    setEditDialog(false);
    setEditingItem(null);
    showToast('Item atualizado. Clique em Salvar para confirmar.');
  };

  const handleSaveAll = () => {
    setPasswordDialog(true);
  };

  const handleConfirmSave = async () => {
    if (password !== ADMIN_PASSWORD) {
      showToast('Senha incorreta! Acesso negado.', 'error');
      return;
    }

    setSaving(true);
    try {
      // Deletar categorias antigas
      if (categories.length > 0) {
        await Promise.all(categories.map(cat => 
          base44.entities.ProfessionalCategory.delete(cat.id)
        ));
      }

      // Criar novas categorias com todas as funções
      if (filters.categories.length > 0) {
        await Promise.all(filters.categories.map((cat, index) => 
          base44.entities.ProfessionalCategory.create({
            category_name: cat,
            category_order: index + 1,
            job_titles: filters.jobFunctions,
            keywords: [cat.toLowerCase()],
            is_active: true
          })
        ));
      }

      // Se não houver categorias, criar uma categoria genérica
      if (filters.categories.length === 0 && filters.jobFunctions.length > 0) {
        await base44.entities.ProfessionalCategory.create({
          category_name: 'Geral',
          category_order: 1,
          job_titles: filters.jobFunctions,
          keywords: ['geral'],
          is_active: true
        });
      }

      queryClient.invalidateQueries({ queryKey: ['professional-categories'] });
      setPendingChanges(false);
      showToast('Filtros atualizados! Banco sincronizado.');
      setPasswordDialog(false);
      setPassword('');
    } catch (e) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderList = (type, items, icon) => {
    const Icon = icon;
    return (
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-600" />
            {items.length} itens
          </CardTitle>
          <Button onClick={() => handleAdd(type)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-9">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(type, item)}
                      className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(type, item)}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum item cadastrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white text-sm animate-slide-up`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 pt-6 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Gerenciador de Filtros
          </h1>
          <p className="text-white/70 text-sm">Gerencie todas as opções de filtros do aplicativo</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-white p-2 rounded-xl shadow-sm mb-6">
            <TabsTrigger value="categories" className="rounded-lg">Categorias</TabsTrigger>
            <TabsTrigger value="jobFunctions" className="rounded-lg">Funções</TabsTrigger>
            <TabsTrigger value="jobTypes" className="rounded-lg">Tipos</TabsTrigger>
            <TabsTrigger value="cities" className="rounded-lg">Cidades</TabsTrigger>
            <TabsTrigger value="workModels" className="rounded-lg">Modelos</TabsTrigger>
            <TabsTrigger value="seniority" className="rounded-lg">Senioridade</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            {renderList('categories', filters.categories, Briefcase)}
          </TabsContent>
          <TabsContent value="jobFunctions">
            {renderList('jobFunctions', filters.jobFunctions, Tag)}
          </TabsContent>
          <TabsContent value="jobTypes">
            {renderList('jobTypes', filters.jobTypes, Clock)}
          </TabsContent>
          <TabsContent value="cities">
            {renderList('cities', filters.cities, MapPin)}
          </TabsContent>
          <TabsContent value="workModels">
            {renderList('workModels', filters.workModels, Briefcase)}
          </TabsContent>
          <TabsContent value="seniority">
            {renderList('seniority', filters.seniority, Tag)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Button Fixed */}
      {pendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="max-w-5xl mx-auto">
            <Button 
              onClick={handleSaveAll} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 text-base font-semibold"
            >
              <Save className="w-5 h-5 mr-2" />
              Salvar e Atualizar
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.isNew ? 'Adicionar Item' : 'Editar Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Digite o valor..."
              value={editingItem?.value || ''}
              onChange={(e) => setEditingItem(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}
              className="h-11"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem} className="bg-indigo-600 hover:bg-indigo-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmação Obrigatória
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Para salvar as alterações nos filtros, digite a senha de administrador:
            </p>
            <Input
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
              className="h-11"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialog(false);
                setPassword('');
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saving || !password}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}