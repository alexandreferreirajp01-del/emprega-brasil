import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Search, Edit, Trash2, Eye, Loader2, 
  Image as ImageIcon, Plus, CheckCircle, X, FileText, Film 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function GerenciarNoticias() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
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

  // Fetch news
  const { data: allNews = [], isLoading: loadingNews } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => base44.entities.News.list('-created_date', 500),
    enabled: !!user
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (newsId) => {
      await base44.entities.News.delete(newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('✅ Notícia excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('❌ Erro ao excluir: ' + error.message);
    }
  });

  const handleDelete = (news) => {
    if (confirm(`Deseja realmente excluir "${news.title}"?`)) {
      deleteMutation.mutate(news.id);
    }
  };

  const filteredNews = allNews.filter(news =>
    news.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Notícias</h1>
              <p className="text-white/80 text-sm">Criar e gerenciar notícias</p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-[#0A66C2] hover:bg-white/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />Nova Notícia
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {/* Search */}
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

        {/* News List */}
        {loadingNews ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((news) => (
              <Card key={news.id} className="shadow hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-800">{news.title}</h3>
                        <Badge className="bg-[#0A66C2] text-white">
                          {news.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </div>
                      {news.subtitle && (
                        <p className="text-sm text-slate-600 mb-2">{news.subtitle}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>📂 {news.category}</span>
                        <span>✍️ {news.author_name}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {news.views_count || 0} views
                        </span>
                        <span>📅 {new Date(news.created_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNews(news)}
                        className="rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
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
                </CardContent>
              </Card>
            ))}
            {filteredNews.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma notícia encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <NewsEditorModal
        news={showCreateModal ? null : editingNews}
        isOpen={showCreateModal || !!editingNews}
        onClose={() => {
          setShowCreateModal(false);
          setEditingNews(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-news'] });
          setShowCreateModal(false);
          setEditingNews(null);
        }}
        user={user}
      />
    </div>
  );
}

// News Editor Modal Component
function NewsEditorModal({ news, isOpen, onClose, onSuccess, user }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'Geral',
    author_name: '',
    external_link: '',
    blocks: [],
    status: 'published',
    is_featured: false
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load news data when editing
  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title || '',
        subtitle: news.subtitle || '',
        category: news.category || 'Geral',
        author_name: news.author_name || '',
        external_link: news.external_link || '',
        blocks: news.blocks || [],
        status: news.status || 'published',
        is_featured: news.is_featured || false
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        category: 'Geral',
        author_name: user?.full_name || '',
        external_link: '',
        blocks: [],
        status: 'published',
        is_featured: false
      });
    }
  }, [news, user, isOpen]);

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setFormData(prev => ({
        ...prev,
        blocks: [...prev.blocks, { 
          type: 'image', 
          image_url: file_url, 
          order: prev.blocks.length 
        }]
      }));
      
      toast.success('✅ Mídia enviada com sucesso!');
    } catch (error) {
      toast.error('❌ Erro ao enviar mídia');
      console.error(error);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleAddTextBlock = () => {
    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, { 
        type: 'content', 
        content: '', 
        order: prev.blocks.length 
      }]
    }));
  };

  const handleBlockChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) => 
        i === index ? { ...block, [field]: value } : block
      )
    }));
  };

  const handleRemoveBlock = (index) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (!formData.author_name?.trim()) {
      toast.error('O nome do autor é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const newsData = {
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || '',
        category: formData.category,
        author_name: formData.author_name.trim(),
        external_link: formData.external_link?.trim() || '',
        blocks: formData.blocks,
        status: formData.status,
        is_featured: formData.is_featured,
        views_count: news?.views_count || 0
      };

      if (news) {
        await base44.entities.News.update(news.id, newsData);
        toast.success('✅ Notícia atualizada!');
      } else {
        await base44.entities.News.create(newsData);
        toast.success('✅ Notícia publicada!');
      }

      onSuccess();
    } catch (error) {
      toast.error('❌ Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            {news ? 'Editar Notícia' : 'Nova Notícia'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6">
          <div className="space-y-5 py-4">
            {/* Título */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título da notícia"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Subtítulo */}
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Subtítulo (opcional)"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Categoria e Autor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
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

              <div className="space-y-2">
                <Label>Nome do Autor *</Label>
                <Input
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="Seu nome"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Link Externo */}
            <div className="space-y-2">
              <Label>Link Externo (opcional)</Label>
              <Input
                value={formData.external_link}
                onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                placeholder="https://exemplo.com"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Blocos de Conteúdo */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Blocos de Conteúdo</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddTextBlock}
                    className="rounded-xl h-9"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Texto
                  </Button>
                  <label className="cursor-pointer">
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={uploadingMedia}
                      className="rounded-xl h-9 pointer-events-none"
                      asChild
                    >
                      <span>
                        {uploadingMedia ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Film className="w-4 h-4 mr-2" />
                        )}
                        Mídia
                      </span>
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      className="hidden" 
                      onChange={handleMediaUpload}
                      disabled={uploadingMedia}
                      key={formData.blocks.length}
                    />
                  </label>
                </div>
              </div>

              {/* Blocos */}
              <div className="space-y-3">
                {formData.blocks.map((block, index) => (
                  <Card key={index} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {block.type === 'image' ? (
                            isVideo(block.image_url) ? (
                              <>🎥 Vídeo</>
                            ) : (
                              <>🖼️ Imagem</>
                            )
                          ) : (
                            <>📝 Texto</>
                          )}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBlock(index)}
                          className="text-red-600 hover:bg-red-50 h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {block.type === 'image' ? (
                        <div className="space-y-2">
                          {isVideo(block.image_url) ? (
                            <video 
                              src={block.image_url} 
                              controls 
                              className="w-full rounded-lg max-h-64"
                            />
                          ) : (
                            <img 
                              src={block.image_url} 
                              alt="" 
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      ) : (
                        <Textarea
                          value={block.content || ''}
                          onChange={(e) => handleBlockChange(index, 'content', e.target.value)}
                          placeholder="Digite o conteúdo..."
                          className="min-h-[120px] rounded-xl resize-none"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}

                {formData.blocks.length === 0 && (
                  <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl">
                    <p className="text-sm">Adicione blocos de texto ou mídia</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
              <><CheckCircle className="w-4 h-4 mr-2" />{news ? 'Atualizar' : 'Publicar'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}