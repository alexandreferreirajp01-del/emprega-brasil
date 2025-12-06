import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Briefcase, Plus, Save, Trash2, Loader2, CheckCircle, Edit, X, Search, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function BibliotecaProfissional() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    queryFn: () => base44.entities.ProfessionalCategory.list('category_order', 500),
    staleTime: 60000,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.ProfessionalCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-categories'] });
      showToast('Categoria criada!');
      setEditingCategory(null);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProfessionalCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-categories'] });
      showToast('Categoria atualizada!');
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.ProfessionalCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-categories'] });
      showToast('Categoria excluída!');
    },
  });

  const handleSave = () => {
    if (!editingCategory.category_name?.trim()) {
      showToast('Nome da categoria é obrigatório', 'error');
      return;
    }

    const categoryName = editingCategory.category_name.trim();
    
    // Verificar duplicação
    const isDuplicate = categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.category_name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (isDuplicate) {
      showToast('Categoria já existe', 'error');
      return;
    }

    const jobTitlesArray = editingCategory.job_titles?.split(',').map(t => t.trim()).filter(t => t) || [];
    const keywordsArray = editingCategory.keywords?.split(',').map(k => k.trim()).filter(k => k) || [];

    const data = {
      category_name: categoryName,
      category_order: editingCategory.category_order || categories.length + 1,
      job_titles: jobTitlesArray,
      keywords: keywordsArray,
      is_active: true,
    };

    if (editingCategory.id) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.job_titles?.some(job => job.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            Base de Dados Profissionais
          </h1>
          <p className="text-white/70 text-sm">{categories.length} categorias cadastradas</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Button 
            onClick={() => setEditingCategory({ category_name: '', job_titles: '', keywords: '', category_order: categories.length + 1 })}
            className="bg-purple-600 hover:bg-purple-700 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar categoria ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </div>

        {editingCategory && (
          <Card className="mb-6 rounded-2xl border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingCategory.id ? 'Editar Categoria' : 'Nova Categoria'}</span>
                <Button variant="ghost" size="sm" onClick={() => setEditingCategory(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da Categoria</label>
                <Input
                  value={editingCategory.category_name}
                  onChange={(e) => setEditingCategory({...editingCategory, category_name: e.target.value})}
                  placeholder="Ex: Administração e Escritório"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Cargos (separados por vírgula)
                  <span className="text-xs text-slate-400 ml-2">Opcional</span>
                </label>
                <Textarea
                  value={editingCategory.job_titles || ''}
                  onChange={(e) => setEditingCategory({...editingCategory, job_titles: e.target.value})}
                  placeholder="Administrador, Analista Administrativo, Auxiliar Administrativo..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Palavras-chave para IA (separadas por vírgula)</label>
                <Input
                  value={editingCategory.keywords || ''}
                  onChange={(e) => setEditingCategory({...editingCategory, keywords: e.target.value})}
                  placeholder="administração, escritório, gestão..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-sm text-slate-500">
              {searchTerm ? 'Tente outro termo de busca' : 'Adicione sua primeira categoria'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="grid gap-4">
                  {filteredCategories.map((category, index) => (
                    <Card key={category.id} className="rounded-xl hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-purple-100 text-purple-700">#{index + 1}</Badge>
                              <h3 className="font-semibold text-slate-800">{category.category_name}</h3>
                            </div>
                            {category.job_titles?.length > 0 ? (
                              <>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {category.job_titles?.slice(0, 10).map((job, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {job}
                                    </Badge>
                                  ))}
                                  {category.job_titles?.length > 10 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{category.job_titles.length - 10} mais
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  Total: {category.job_titles?.length || 0} cargos
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Sem funções cadastradas</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingCategory({
                                ...category,
                                job_titles: category.job_titles?.join(', ') || '',
                                keywords: category.keywords?.join(', ') || '',
                              })}
                              className="rounded-lg text-purple-600 hover:bg-purple-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (confirm(`Excluir "${category.category_name}"?`)) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                              className="rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Mobile View - Accordion */}
            <div className="md:hidden">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-3">
                  {filteredCategories.map((category, index) => (
                    <Collapsible 
                      key={category.id}
                      open={openCategories[category.id]}
                      onOpenChange={(open) => setOpenCategories(prev => ({...prev, [category.id]: open}))}
                    >
                      <Card className="rounded-xl overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="p-4 flex flex-row items-center justify-between bg-purple-50 hover:bg-purple-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-600 text-white">#{index + 1}</Badge>
                              <h3 className="font-semibold text-slate-800 text-left">{category.category_name}</h3>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform ${openCategories[category.id] ? 'rotate-180' : ''}`} />
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="p-4 pt-3 space-y-3">
                            {category.job_titles?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {category.job_titles.map((job, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {job}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Sem funções cadastradas</p>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingCategory({
                                  ...category,
                                  job_titles: category.job_titles?.join(', ') || '',
                                  keywords: category.keywords?.join(', ') || '',
                                })}
                                className="flex-1 rounded-lg text-purple-600 hover:bg-purple-50"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Excluir "${category.category_name}"?`)) {
                                    deleteCategoryMutation.mutate(category.id);
                                  }
                                }}
                                className="flex-1 rounded-lg text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </Button>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  );
}