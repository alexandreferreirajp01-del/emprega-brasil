import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, Newspaper, Trash2, Loader2, CheckCircle, Plus, X, 
  Save, Star, Link2, Eye, Edit, Info, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import NotificationSender from "@/components/admin/NotificationSender";
import NewsBlockEditor from "@/components/admin/NewsBlockEditor";

const CATEGORIES = [
  'Mercado de Trabalho',
  'Dicas de Emprego', 
  'Economia',
  'Cursos',
  'Eventos',
  'Geral'
];

// Limites de caracteres (Base44 suporta até 100.000 para campos de texto)
const CHAR_LIMITS = {
  title: 500,
  subtitle: 2000,
  author_name: 200,
  external_link: 2000,
  content_block: 100000 // Rich text por bloco
};

// Componente de input com contador
const InputWithCounter = ({ value, onChange, maxLength, label, placeholder, className = '', required = false }) => {
  const charCount = (value || '').length;
  const percent = (charCount / maxLength) * 100;
  const isOver = charCount > maxLength;
  const isWarning = percent >= 80 && !isOver;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
          {label}
        </Label>
      </div>
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} ${isOver ? 'border-red-500 bg-red-50' : isWarning ? 'border-amber-400' : ''}`}
      />
      <div className={`flex items-center justify-between text-xs ${
        isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-400'
      }`}>
        <span>
          {isOver ? (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Limite excedido
            </span>
          ) : isWarning ? 'Aproximando do limite' : ''}
        </span>
        <span className="font-mono">
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default function GerenciarNoticias() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [lastCreatedNews, setLastCreatedNews] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    category: 'Geral',
    author_name: '',
    external_link: '',
    blocks: [],
    is_featured: false,
    status: 'published'
  });
  
  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setForm({
      title: '',
      subtitle: '',
      category: 'Geral',
      author_name: '',
      external_link: '',
      blocks: [],
      is_featured: false,
      status: 'published'
    });
    setEditingNews(null);
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

  const { data: newsList = [] } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => base44.entities.News.list('-created_date', 100),
    staleTime: 60000,
  });

  const createNewsMutation = useMutation({
    mutationFn: (data) => base44.entities.News.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      setLastCreatedNews({ id: created?.id, title: form.title });
      resetForm();
      setShowForm(false);
      setShowNotification(true);
      showToast('Notícia publicada!');
    },
    onError: () => showToast('Erro ao publicar', 'error')
  });

  const updateNewsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.News.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      resetForm();
      setShowForm(false);
      showToast('Notícia atualizada!');
    },
    onError: () => showToast('Erro ao atualizar', 'error')
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      showToast('Notícia excluída!');
    },
  });

  // Verificar se há campos acima do limite
  const getPlainTextLength = (html) => {
    if (!html) return 0;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || '').length;
  };

  const validationErrors = useMemo(() => {
    const errors = [];
    if ((form.title || '').length > CHAR_LIMITS.title) errors.push('Título');
    if ((form.subtitle || '').length > CHAR_LIMITS.subtitle) errors.push('Subtítulo');
    if ((form.author_name || '').length > CHAR_LIMITS.author_name) errors.push('Autor');
    if ((form.external_link || '').length > CHAR_LIMITS.external_link) errors.push('Link externo');
    
    form.blocks.forEach((block, i) => {
      if (block.type === 'content' && getPlainTextLength(block.content) > CHAR_LIMITS.content_block) {
        errors.push(`Bloco de texto ${i + 1}`);
      }
    });
    
    return errors;
  }, [form]);

  const canSave = validationErrors.length === 0 && form.title && form.category && form.author_name;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.title || !form.category || !form.author_name) {
      showToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    if (validationErrors.length > 0) {
      showToast(`Campos acima do limite: ${validationErrors.join(', ')}`, 'error');
      return;
    }

    const newsData = {
      ...form,
      blocks: form.blocks.map((b, i) => ({ ...b, order: i }))
    };

    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id, data: newsData });
    } else {
      createNewsMutation.mutate(newsData);
    }
  };

  const handleEdit = (news) => {
    setForm({
      title: news.title || '',
      subtitle: news.subtitle || '',
      category: news.category || 'Geral',
      author_name: news.author_name || '',
      external_link: news.external_link || '',
      blocks: news.blocks || [],
      is_featured: news.is_featured || false,
      status: news.status || 'published'
    });
    setEditingNews(news);
    setShowForm(true);
  };

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

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6" />
            Gerenciar Notícias
          </h1>
          <p className="text-white/70 text-sm">{newsList.length} notícias publicadas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Painel informativo de limites */}
        {showForm && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Limites de caracteres (Base44):</strong>{' '}
              Título: {CHAR_LIMITS.title.toLocaleString()} • 
              Subtítulo: {CHAR_LIMITS.subtitle.toLocaleString()} • 
              Autor: {CHAR_LIMITS.author_name.toLocaleString()} • 
              Link: {CHAR_LIMITS.external_link.toLocaleString()} • 
              Conteúdo por bloco: {CHAR_LIMITS.content_block.toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de validação */}
        {showForm && validationErrors.length > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Campos acima do limite:</strong> {validationErrors.join(', ')}. 
              Reduza o texto para poder salvar.
            </AlertDescription>
          </Alert>
        )}

        {/* Botão Nova Notícia */}
        {!showForm ? (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-red-600 hover:bg-red-700 rounded-xl">
            <Plus className="w-5 h-5 mr-2" />Nova Notícia
          </Button>
        ) : (
          /* Formulário de Notícia */
          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                {editingNews ? 'Editar Notícia' : 'Nova Notícia'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { resetForm(); setShowForm(false); }} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título */}
                <InputWithCounter
                  label="Título"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Digite o título da notícia..."
                  maxLength={CHAR_LIMITS.title}
                  className="rounded-xl h-12 text-lg"
                  required
                />

                {/* Subtítulo */}
                <InputWithCounter
                  label="Subtítulo (opcional)"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Uma breve descrição que aparece abaixo do título..."
                  maxLength={CHAR_LIMITS.subtitle}
                  className="rounded-xl"
                />

                {/* Categoria e Autor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <InputWithCounter
                    label="Autor"
                    value={form.author_name}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    placeholder="Nome do autor"
                    maxLength={CHAR_LIMITS.author_name}
                    className="rounded-xl h-11"
                    required
                  />
                </div>

                {/* Link Externo */}
                <InputWithCounter
                  label="Link Externo (opcional)"
                  value={form.external_link}
                  onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                  placeholder="https://..."
                  maxLength={CHAR_LIMITS.external_link}
                  className="rounded-xl"
                />

                {/* Blocos de Conteúdo */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Blocos de Conteúdo</Label>
                  <p className="text-sm text-slate-500">
                    Adicione imagens e textos na ordem desejada. Use o editor rico para formatar texto e inserir links destacados.
                  </p>
                  <NewsBlockEditor
                    blocks={form.blocks}
                    onChange={(blocks) => setForm({ ...form, blocks })}
                  />
                </div>

                {/* Destaque */}
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Notícia em Destaque</p>
                      <p className="text-xs text-slate-500">Aparece em primeiro lugar na página</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    type="submit" 
                    className={`flex-1 rounded-xl h-12 text-base ${canSave ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-300 cursor-not-allowed'}`}
                    disabled={!canSave || createNewsMutation.isPending || updateNewsMutation.isPending}
                  >
                    {(createNewsMutation.isPending || updateNewsMutation.isPending) ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    {editingNews ? 'Salvar Alterações' : 'Publicar Notícia'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { resetForm(); setShowForm(false); }} 
                    className="rounded-xl h-12"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Notification Sender */}
        {showNotification && lastCreatedNews && (
          <NotificationSender 
            showToast={showToast} 
            news={lastCreatedNews} 
            notificationType="news" 
            onClose={() => setShowNotification(false)} 
          />
        )}

        {/* Lista de Notícias */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Notícias Publicadas ({newsList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {newsList.map((item) => {
                  const firstImage = item.blocks?.find(b => b.type === 'image')?.image_url;
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      {firstImage && (
                        <img src={firstImage} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 line-clamp-1">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-sm text-slate-500 line-clamp-1">{item.subtitle}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          {item.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                              <Star className="w-3 h-3 mr-1" />Destaque
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">por {item.author_name}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(item)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteNewsMutation.mutate(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {newsList.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma notícia publicada</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}