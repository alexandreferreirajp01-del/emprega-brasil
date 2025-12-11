import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, CheckCircle, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function PostarNoticia() {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'Geral',
    author_name: '',
    external_link: '',
    blocks: []
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setFormData(prev => ({
        ...prev,
        blocks: [
          ...prev.blocks,
          { type: 'image', image_url: file_url, order: prev.blocks.length }
        ]
      }));
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleAddTextBlock = () => {
    setFormData(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        { type: 'content', content: '', order: prev.blocks.length }
      ]
    }));
  };

  const handleBlockChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) => 
        i === index ? { ...block, content: value } : block
      )
    }));
  };

  const handleRemoveBlock = (index) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
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
      setTimeout(() => {
        window.location.href = createPageUrl('GerenciarNoticias');
      }, 2000);
    } catch (error) {
      console.error('Erro ao publicar notícia:', error);
      alert('Erro ao publicar notícia');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Notícia Publicada!</h2>
            <p className="text-slate-600">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Postar Notícia</h1>
          <p className="text-white/80">Crie uma nova notícia para o feed</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Informações da Notícia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da notícia"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Subtítulo (opcional)"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
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

              <div className="space-y-2">
                <Label>Link Externo (opcional)</Label>
                <Input
                  value={formData.external_link}
                  onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                  placeholder="https://exemplo.com"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Blocos de Conteúdo</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleAddTextBlock} className="rounded-xl">
                      Adicionar Texto
                    </Button>
                    <label>
                      <Button type="button" variant="outline" disabled={uploading} className="rounded-xl">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        Adicionar Imagem
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                {formData.blocks.map((block, index) => (
                  <div key={index} className="border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        {block.type === 'image' ? '🖼️ Imagem' : '📝 Texto'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlock(index)}
                        className="text-red-600"
                      >
                        Remover
                      </Button>
                    </div>
                    {block.type === 'image' ? (
                      <img src={block.image_url} alt="" className="w-full h-48 object-cover rounded-lg" />
                    ) : (
                      <Textarea
                        value={block.content}
                        onChange={(e) => handleBlockChange(index, e.target.value)}
                        placeholder="Digite o conteúdo..."
                        className="min-h-[120px] rounded-xl"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar Notícia'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}