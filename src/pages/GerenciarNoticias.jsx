import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Plus, Edit2, Trash2, Search, Loader2, 
  Image, Eye, X, Save
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function GerenciarNoticias() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
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
    checkAuth();
  }, []);

  const { data: newsList = [], isLoading: loadingNews } = useQuery({
    queryKey: ['news-list'],
    queryFn: () => base44.entities.News.list('-created_date', 500),
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['news-list']);
      toast.success('Notícia excluída!');
    }
  });

  const handleEdit = (news) => {
    setEditingNews(news);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingNews(null);
    setShowModal(true);
  };

  const handleDelete = (news) => {
    if (confirm(`Excluir "${news.title}"?`)) {
      deleteMutation.mutate(news.id);
    }
  };

  const filteredNews = newsList.filter(n =>
    n.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Notícias</h1>
              <p className="text-white/80 text-sm">Criar e gerenciar notícias</p>
            </div>
            <Button 
              onClick={handleNew}
              className="bg-white text-[#0A66C2] hover:bg-white/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />Nova Notícia
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg mb-6 rounded-2xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar notícias..."
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {loadingNews ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNews.map((news) => (
              <Card key={news.id} className="rounded-2xl shadow hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {news.image_url && (
                      <img 
                        src={news.image_url} 
                        alt={news.title}
                        className="w-full sm:w-32 h-32 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-800 mb-1">{news.title}</h3>
                          {news.subtitle && (
                            <p className="text-sm text-slate-600 mb-2">{news.subtitle}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(news)}
                            className="rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(news)}
                            className="rounded-lg text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>📂 {news.category}</span>
                        <span>✍️ {news.author_name}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {news.views_count || 0}
                        </span>
                        <span>📅 {new Date(news.created_date).toLocaleDateString('pt-BR')}</span>
                        {news.is_featured && <span className="text-yellow-600 font-medium">⭐ Destaque</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredNews.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>Nenhuma notícia encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <NewsModal
          news={editingNews}
          onClose={() => {
            setShowModal(false);
            setEditingNews(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['news-list']);
            setShowModal(false);
            setEditingNews(null);
          }}
          user={user}
        />
      )}
    </div>
  );
}

function NewsModal({ news, onClose, onSuccess, user }) {
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    category: 'Geral',
    author_name: user?.full_name || '',
    image_url: '',
    content: '',
    is_featured: false
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (news) {
      setForm({
        title: news.title || '',
        subtitle: news.subtitle || '',
        category: news.category || 'Geral',
        author_name: news.author_name || '',
        image_url: news.image_url || '',
        content: news.content || '',
        is_featured: news.is_featured || false
      });
    }
  }, [news]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 10MB');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, image_url: file_url }));
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error('Título obrigatório');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || '',
        category: form.category,
        author_name: form.author_name.trim(),
        image_url: form.image_url?.trim() || '',
        content: form.content?.trim() || '',
        is_featured: form.is_featured,
        status: 'published',
        views_count: news?.views_count || 0
      };

      if (news) {
        await base44.entities.News.update(news.id, data);
        toast.success('Notícia atualizada!');
      } else {
        await base44.entities.News.create(data);
        toast.success('Notícia publicada!');
      }

      onSuccess();
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{news ? 'Editar Notícia' : 'Nova Notícia'}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Título da notícia"
              className="mt-1 h-11 rounded-xl"
            />
          </div>

          <div>
            <Label>Subtítulo</Label>
            <Input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Subtítulo (opcional)"
              className="mt-1 h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1 h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mercado de Trabalho">Mercado de Trabalho</SelectItem>
                  <SelectItem value="Dicas de Emprego">Dicas de Emprego</SelectItem>
                  <SelectItem value="Economia">Economia</SelectItem>
                  <SelectItem value="Cursos">Cursos</SelectItem>
                  <SelectItem value="Eventos">Eventos</SelectItem>
                  <SelectItem value="Geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Autor *</Label>
              <Input
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                placeholder="Nome do autor"
                className="mt-1 h-11 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label>Imagem de Capa</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="mt-1 h-11 rounded-xl"
            />
            {uploading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </div>
            )}
            {form.image_url && (
              <div className="mt-3 relative">
                <img 
                  src={form.image_url} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-xl"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm({ ...form, image_url: '' })}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label>Conteúdo</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Escreva o conteúdo da notícia..."
              className="mt-1 min-h-[300px] rounded-xl resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <Label className="font-medium">Destaque</Label>
              <p className="text-xs text-slate-500">Aparece no topo</p>
            </div>
            <Switch
              checked={form.is_featured}
              onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl h-11"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#0A66C2] hover:bg-[#004182] rounded-xl h-11"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />{news ? 'Atualizar' : 'Publicar'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}