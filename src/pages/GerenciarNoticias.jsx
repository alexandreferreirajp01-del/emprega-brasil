import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Edit, Trash2, Eye, Loader2, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function GerenciarNoticias() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNews, setEditingNews] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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

  const filteredNews = allNews.filter(news =>
    news.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Gerenciar Notícias</h1>
          <p className="text-white/80">Edite e exclua notícias publicadas</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg mb-6">
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((news) => (
              <Card key={news.id} className="shadow hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">{news.title}</h3>
                        <Badge variant={news.status === 'published' ? 'default' : 'secondary'}>
                          {news.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{news.subtitle}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Categoria: {news.category}</span>
                        <span>Autor: {news.author_name}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {news.views_count || 0} views
                        </span>
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
                        onClick={() => {
                          if (confirm('Deseja excluir esta notícia?')) {
                            deleteMutation.mutate(news.id);
                          }
                        }}
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Notícia</DialogTitle>
          </DialogHeader>
          {editingNews && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingNews.title}
                  onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input
                  value={editingNews.subtitle || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, subtitle: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editingNews.category}
                  onValueChange={(v) => setEditingNews({ ...editingNews, category: v })}
                >
                  <SelectTrigger className="rounded-xl">
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
                  <Label>Blocos de Conteúdo</Label>
                  <label>
                    <Button type="button" size="sm" variant="outline" disabled={uploadingImage}>
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                  </label>
                </div>
                {(editingNews.blocks || []).map((block, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    {block.type === 'image' ? (
                      <div>
                        <img src={block.image_url} alt="" className="w-full h-32 object-cover rounded mb-2" />
                        <label>
                          <Button type="button" size="sm" variant="outline" className="w-full">
                            Alterar Imagem
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
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
                        className="min-h-[80px]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => updateMutation.mutate({ id: editingNews.id, data: editingNews })}
                disabled={updateMutation.isPending}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}