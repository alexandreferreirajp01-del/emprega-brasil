import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Edit, Trash2, Eye, Loader2, Image as ImageIcon, Plus, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function GerenciarNoticias() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' ou 'create'
  const [editingNews, setEditingNews] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'Geral',
    author_name: '',
    external_link: '',
    blocks: []
  });
  const queryClient = useQueryClient();

  const { data: allNews = [], isLoading } = useQuery({
    queryKey: ['all-news'],
    queryFn: () => base44.entities.News.list('-created_date', 500)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.News.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
      setEditingNews(null);
    }
  });

  const handleImageUpload = async (e, blockIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const updatedBlocks = [...(editingNews.blocks || [])];
      if (blockIndex !== undefined) {
        updatedBlocks[blockIndex] = { ...updatedBlocks[blockIndex], image_url: file_url };
      } else {
        updatedBlocks.push({ type: 'image', image_url: file_url, order: updatedBlocks.length });
      }
      
      setEditingNews({ ...editingNews, blocks: updatedBlocks });
    } catch (error) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUploadCreate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        blocks: [...prev.blocks, { type: 'image', image_url: file_url, order: prev.blocks.length }]
      }));
    } catch {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTextBlock = () => {
    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, { type: 'content', content: '', order: prev.blocks.length }]
    }));
  };

  const handleBlockChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) => i === index ? { ...block, content: value } : block)
    }));
  };

  const handleRemoveBlock = (index) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author_name) {
      alert('Preencha título e nome do autor');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.News.create({
        ...formData,
        status: 'published',
        is_featured: false,
        views_count: 0
      });
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('list');
        setFormData({
          title: '',
          subtitle: '',
          category: 'Geral',
          author_name: '',
          external_link: '',
          blocks: []
        });
      }, 2000);
    } catch {
      alert('Erro ao publicar notícia');
    } finally {
      setSaving(false);
    }
  };

  const filteredNews = allNews.filter(news =>
    news.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-4 sm:pt-6 pb-6 sm:pb-8 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 sm:mb-4 -ml-2 h-8 sm:h-10 text-sm">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Notícias</h1>
              <p className="text-white/80 text-sm">Criar e gerenciar notícias</p>
            </div>
            <Button 
              onClick={() => setActiveTab(activeTab === 'create' ? 'list' : 'create')}
              className="bg-white text-[#0A66C2] hover:bg-white/90 rounded-xl h-9 sm:h-10 px-3 sm:px-4 text-sm"
            >
              {activeTab === 'create' ? (
                <>Ver Lista</>
              ) : (
                <><Plus className="w-4 h-4 mr-1 sm:mr-2" />Nova Notícia</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-4">
        {activeTab === 'list' ? (
          <>
            <Card className="shadow-lg mb-4 sm:mb-6 rounded-2xl">
              <CardContent className="p-3 sm:p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar notícias..."
                    className="pl-9 sm:pl-10 h-10 sm:h-11 rounded-xl text-sm sm:text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#0A66C2]" />
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredNews.map((news) => (
                  <Card key={news.id} className="shadow hover:shadow-lg transition-shadow rounded-2xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 break-words">{news.title}</h3>
                            <Badge variant={news.status === 'published' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                              {news.status === 'published' ? 'Publicada' : 'Rascunho'}
                            </Badge>
                          </div>
                          {news.subtitle && (
                            <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">{news.subtitle}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500">
                            <span className="truncate">📂 {news.category}</span>
                            <span className="truncate">✍️ {news.author_name}</span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Eye className="w-3 h-3" />
                              {news.views_count || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 sm:gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingNews(news)}
                            className="rounded-lg h-8 w-8 sm:h-9 sm:w-9 p-0"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Deseja excluir esta notícia?')) {
                                deleteMutation.mutate(news.id);
                              }
                            }}
                            className="rounded-lg text-[#C30000] hover:text-[#C30000]/80 h-8 w-8 sm:h-9 sm:w-9 p-0"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredNews.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-sm sm:text-base">Nenhuma notícia encontrada</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              {success ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Notícia Publicada!</h2>
                  <p className="text-sm sm:text-base text-slate-600">Voltando para a lista...</p>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Título *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título da notícia"
                      className="h-10 sm:h-11 rounded-xl text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Subtítulo</Label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Subtítulo (opcional)"
                      className="h-10 sm:h-11 rounded-xl text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Categoria</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger className="h-10 sm:h-11 rounded-xl text-sm sm:text-base">
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
                      <Label className="text-sm sm:text-base">Nome do Autor *</Label>
                      <Input
                        value={formData.author_name}
                        onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                        placeholder="Seu nome"
                        className="h-10 sm:h-11 rounded-xl text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Link Externo (opcional)</Label>
                    <Input
                      value={formData.external_link}
                      onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                      placeholder="https://exemplo.com"
                      className="h-10 sm:h-11 rounded-xl text-sm sm:text-base"
                    />
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <Label className="text-sm sm:text-base">Blocos de Conteúdo</Label>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button type="button" variant="outline" onClick={handleAddTextBlock} className="rounded-xl flex-1 sm:flex-initial text-xs sm:text-sm h-9">
                          📝 Texto
                        </Button>
                        <label className="flex-1 sm:flex-initial">
                          <Button type="button" variant="outline" disabled={uploadingImage} className="rounded-xl w-full text-xs sm:text-sm h-9">
                            {uploadingImage ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : '🖼️ Mídia'}
                          </Button>
                          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUploadCreate} />
                        </label>
                      </div>
                    </div>

                    {formData.blocks.map((block, index) => (
                      <div key={index} className="border rounded-xl p-3 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between">
                         <span className="text-xs sm:text-sm font-medium text-slate-600">
                           {block.type === 'image' ? (
                             block.image_url?.includes('.mp4') || block.image_url?.includes('.webm') || 
                             block.image_url?.includes('.mov') || block.image_url?.includes('.avi') 
                             ? '🎥 Vídeo' : '🖼️ Imagem'
                           ) : '📝 Texto'}
                         </span>
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => handleRemoveBlock(index)}
                           className="text-red-600 h-8 text-xs sm:text-sm"
                         >
                           Remover
                         </Button>
                        </div>
                        {block.type === 'image' ? (
                         block.image_url?.includes('.mp4') || block.image_url?.includes('.webm') || 
                         block.image_url?.includes('.mov') || block.image_url?.includes('.avi') ? (
                           <video src={block.image_url} controls className="w-full h-32 sm:h-48 rounded-lg" />
                         ) : (
                           <img src={block.image_url} alt="" className="w-full h-32 sm:h-48 object-cover rounded-lg" />
                         )
                        ) : (
                          <Textarea
                            value={block.content}
                            onChange={(e) => handleBlockChange(index, e.target.value)}
                            placeholder="Digite o conteúdo..."
                            className="min-h-[100px] sm:min-h-[120px] rounded-xl text-sm sm:text-base"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full h-11 sm:h-12 bg-[#0A66C2] hover:bg-[#004182] rounded-xl text-sm sm:text-base"
                  >
                    {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Publicar Notícia'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Notícia</DialogTitle>
          </DialogHeader>
          {editingNews && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Título</Label>
                <Input
                  value={editingNews.title}
                  onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                  className="rounded-xl h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Subtítulo</Label>
                <Input
                  value={editingNews.subtitle || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, subtitle: e.target.value })}
                  className="rounded-xl h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Categoria</Label>
                <Select
                  value={editingNews.category}
                  onValueChange={(v) => setEditingNews({ ...editingNews, category: v })}
                >
                  <SelectTrigger className="rounded-xl h-10 sm:h-11 text-sm sm:text-base">
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
                <div className="flex items-center justify-between">
                  <Label className="text-sm sm:text-base">Blocos de Conteúdo</Label>
                  <label>
                    <Button type="button" size="sm" variant="outline" disabled={uploadingImage} className="h-8 sm:h-9 text-xs sm:text-sm">
                      {uploadingImage ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </Button>
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                  </label>
                </div>
                {(editingNews.blocks || []).map((block, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    {block.type === 'image' ? (
                      <div>
                        {block.image_url?.includes('.mp4') || block.image_url?.includes('.webm') || 
                         block.image_url?.includes('.mov') || block.image_url?.includes('.avi') ? (
                          <video src={block.image_url} controls className="w-full h-32 rounded mb-2" />
                        ) : (
                          <img src={block.image_url} alt="" className="w-full h-32 object-cover rounded mb-2" />
                        )}
                        <label>
                          <Button type="button" size="sm" variant="outline" className="w-full text-xs sm:text-sm h-8 sm:h-9">
                            Alterar Mídia
                          </Button>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, index)}
                          />
                        </label>
                      </div>
                    ) : (
                      <Textarea
                        value={block.content}
                        onChange={(e) => {
                          const updated = [...editingNews.blocks];
                          updated[index] = { ...updated[index], content: e.target.value };
                          setEditingNews({ ...editingNews, blocks: updated });
                        }}
                        className="min-h-[80px] text-sm sm:text-base"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => updateMutation.mutate({ id: editingNews.id, data: editingNews })}
                disabled={updateMutation.isPending}
                className="w-full rounded-xl bg-[#0A66C2] hover:bg-[#004182] h-10 sm:h-11 text-sm sm:text-base"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}