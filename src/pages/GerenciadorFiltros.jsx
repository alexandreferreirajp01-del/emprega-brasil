import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ArrowLeft, Settings, Plus, Trash2, Edit, Loader2, CheckCircle, 
  Save, Briefcase, MapPin, Tag, Clock, AlertTriangle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const ADMIN_PASSWORD = "Vagas2026#";

const INITIAL_JOB_TYPES = ['CLT', 'PJ', 'Autônomo', 'Estágio', 'Jovem Aprendiz', 'Temporário', 'Freelancer', 'Trainee', 'Banco de Talentos'];
const INITIAL_CITIES = ['João Pessoa', 'Campina Grande', 'Bayeux', 'Cabedelo', 'Santa Rita', 'Patos', 'Guarabira', 'Cajazeiras', 'Sousa', 'Pombal', 'Conde'];
const INITIAL_WORK_MODELS = ['Presencial', 'Híbrido', 'Home Office', 'Remoto'];
const INITIAL_SENIORITY = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista'];

// Componente de Lista Memoizado
const FilterList = React.memo(({ type, items, icon, onAdd, onEdit, onDelete }) => {
  const Icon = icon;
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          {items.length} itens
        </CardTitle>
        <Button 
          onClick={() => onAdd(type)} 
          size="sm" 
          className="bg-indigo-600 hover:bg-indigo-700 rounded-lg h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
        >
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <ScrollArea className="h-[50vh] sm:h-[400px] pr-2 sm:pr-4">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div 
                key={`${type}-${item}-${index}`}
                className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors gap-2"
              >
                <span className="text-xs sm:text-sm font-medium text-slate-700 flex-1 break-words">{item}</span>
                <div className="flex gap-1 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEdit(type, item)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-indigo-600 hover:bg-indigo-100"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(type, item)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Icon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Nenhum item</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

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

  const { data: categories = [] } = useQuery({
    queryKey: ['professional-categories'],
    queryFn: () => base44.entities.ProfessionalCategory.list('category_order', 100),
    enabled: !!user,
  });

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
    const currentItems = filters[type];
    const newItems = currentItems.filter(item => item !== value);
    setFilters(prev => ({ ...prev, [type]: newItems }));
    setPendingChanges(true);
    showToast('Item removido');
  };

  const handleSaveItem = () => {
    if (!editingItem?.value?.trim()) {
      showToast('Campo vazio', 'error');
      return;
    }

    const value = editingItem.value.trim();
    const type = editingItem.type;
    const currentItems = [...filters[type]];

    if (editingItem.isNew) {
      if (currentItems.includes(value)) {
        showToast('Item já existe', 'error');
        return;
      }
      currentItems.push(value);
    } else {
      const index = currentItems.indexOf(editingItem.original);
      if (index !== -1) currentItems[index] = value;
    }
    
    setFilters(prev => ({ ...prev, [type]: currentItems.sort() }));
    setPendingChanges(true);
    setEditDialog(false);
    setEditingItem(null);
    showToast('Item atualizado');
  };

  const handleSaveAll = () => {
    setPasswordDialog(true);
  };

  const handleConfirmSave = async () => {
    if (password !== ADMIN_PASSWORD) {
      showToast('Senha incorreta', 'error');
      setPassword('');
      return;
    }

    setSaving(true);
    try {
      // Deletar todas as categorias antigas
      for (const cat of categories) {
        await base44.entities.ProfessionalCategory.delete(cat.id);
      }

      // Criar novas categorias
      if (filters.categories.length > 0) {
        for (let i = 0; i < filters.categories.length; i++) {
          await base44.entities.ProfessionalCategory.create({
            category_name: filters.categories[i],
            category_order: i + 1,
            job_titles: filters.jobFunctions,
            keywords: [filters.categories[i].toLowerCase()],
            is_active: true
          });
        }
      } else if (filters.jobFunctions.length > 0) {
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
      showToast('Salvo com sucesso!');
      setPasswordDialog(false);
      setPassword('');
    } catch (e) {
      showToast('Erro: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-32">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-lg max-w-[90vw] ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white text-xs sm:text-sm animate-slide-up`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="break-words">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 pt-4 sm:pt-6 pb-6 sm:pb-8 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2 h-8 sm:h-10 text-sm">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            Gerenciador de Filtros
          </h1>
          <p className="text-white/70 text-xs sm:text-sm">Gerencie os filtros do app</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 bg-white p-1.5 rounded-xl shadow-sm mb-6 h-auto">
            <TabsTrigger value="categories" className="rounded-lg text-xs sm:text-sm py-2">Categorias</TabsTrigger>
            <TabsTrigger value="jobFunctions" className="rounded-lg text-xs sm:text-sm py-2">Funções</TabsTrigger>
            <TabsTrigger value="jobTypes" className="rounded-lg text-xs sm:text-sm py-2">Tipos</TabsTrigger>
            <TabsTrigger value="cities" className="rounded-lg text-xs sm:text-sm py-2">Cidades</TabsTrigger>
            <TabsTrigger value="workModels" className="rounded-lg text-xs sm:text-sm py-2">Modelos</TabsTrigger>
            <TabsTrigger value="seniority" className="rounded-lg text-xs sm:text-sm py-2">Senioridade</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <FilterList type="categories" items={filters.categories} icon={Briefcase} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>
          <TabsContent value="jobFunctions">
            <FilterList type="jobFunctions" items={filters.jobFunctions} icon={Tag} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>
          <TabsContent value="jobTypes">
            <FilterList type="jobTypes" items={filters.jobTypes} icon={Clock} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>
          <TabsContent value="cities">
            <FilterList type="cities" items={filters.cities} icon={MapPin} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>
          <TabsContent value="workModels">
            <FilterList type="workModels" items={filters.workModels} icon={Briefcase} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>
          <TabsContent value="seniority">
            <FilterList type="seniority" items={filters.seniority} icon={Tag} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </div>

      {pendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 sm:p-4 z-40 pb-safe">
          <div className="max-w-5xl mx-auto">
            <Button 
              onClick={handleSaveAll} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 sm:h-12 text-sm sm:text-base font-semibold"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.isNew ? 'Adicionar' : 'Editar'}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Digite..."
            value={editingItem?.value || ''}
            onChange={(e) => setEditingItem(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}
            className="h-11"
            autoFocus
          />
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

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirme com senha
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Digite a senha de admin:</p>
          <Input
            type="password"
            placeholder="Senha..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
            className="h-11"
            autoFocus
          />
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}