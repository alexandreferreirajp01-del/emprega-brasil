import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Newspaper, Image as ImageIcon, Plus, X, Save, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = [
  'Mercado de Trabalho', 
  'Dicas de Emprego', 
  'Economia', 
  'Cursos', 
  'Eventos', 
  'Geral'
];

export default function PostarNoticias() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'Geral',
    author_name: '',
    external_link: '',
    is_featured: false,
    status: 'published',
    blocks: []
  });

  const [uploadingBlock, setUploadingBlock] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
        setFormData(prev => ({ ...prev, author_name: currentUser.full_name }));
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      order: formData.blocks.length,
      ...(type === 'image' ? { image_url: '' } : { content: '' })
    };
    setFormData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const removeBlock = (id) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i }))
    }));
  };

  const updateBlock = (id, data) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...data } : b)
    }));
  };

  const uploadImage = async (blockId, file) => {
    setUploadingBlock(blockId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateBlock(blockId, { image_url: file_url });
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploadingBlock(null);
    }
  };

  const handleSave = async (publishNow = true) => {
    if (!formData.title || !formData.author_name) {
      alert('Título e autor são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const newsData = {
        ...formData,
        status: publishNow ? 'published' : 'draft',
        blocks: formData.blocks.sort((a, b) => a.order - b.order)
      };

      await base44.entities.News.create(newsData);
      alert(publishNow ? 'Notícia publicada!' : 'Rascunho salvo!');
      
      setFormData({
        title: '',
        subtitle: '',
        category: 'Geral',
        author_name: user?.full_name || '',
        external_link: '',
        is_featured: false,
        status: 'published',
        blocks: []
      });
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Postar Notícia</h1>
              <p className="text-white/70 text-sm">Criar nova notícia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título da notícia"
                className="h-11"
              />
            </div>

            <div>
              <Label>Subtítulo</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Subtítulo (opcional)"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Autor *</Label>
                <Input
                  value={formData.author_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Nome do autor"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <Label>Link Externo (opcional)</Label>
              <Input
                value={formData.external_link}
                onChange={(e) => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                placeholder="https://..."
                className="h-11"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <Label>Notícia em Destaque</Label>
              <Switch 
                checked={formData.is_featured} 
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_featured: v }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.blocks.map((block) => (
              <div key={block.id} className="border-2 border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">
                    {block.type === 'image' ? '📷 Imagem' : '📝 Texto'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock(block.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {block.type === 'image' && (
                  <div>
                    {block.image_url ? (
                      <div className="relative">
                        <img src={block.image_url} alt="" className="w-full rounded-lg" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => updateBlock(block.id, { image_url: '' })}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id={`image-${block.id}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadImage(block.id, file);
                          }}
                        />
                        <label htmlFor={`image-${block.id}`}>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full pointer-events-none"
                            disabled={uploadingBlock === block.id}
                          >
                            {uploadingBlock === block.id ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Carregando...</>
                            ) : (
                              <><ImageIcon className="w-4 h-4 mr-2" />Selecionar Imagem</>
                            )}
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'content' && (
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Escreva o conteúdo..."
                    className="min-h-[120px]"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => addBlock('content')}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Texto
              </Button>
              <Button
                variant="outline"
                onClick={() => addBlock('image')}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Imagem
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 h-12 rounded-xl"
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 rounded-xl"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Publicando...</>
            ) : (
              <><Send className="w-5 h-5 mr-2" />Publicar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}