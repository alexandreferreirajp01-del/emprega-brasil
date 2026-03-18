import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Upload, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, Sparkles, FileUp, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function GenerarNoticiasIA() {
  const [tab, setTab] = useState('url');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Geral');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editData, setEditData] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [images, setImages] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Tipo de arquivo não suportado. Use: PDF, DOCX, JPG, PNG, GIF, WEBP');
      return;
    }

    setFile(selectedFile);
  };

  const handleImageUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      setImages([...images, { url: file_url, name: selectedFile.name }]);
      toast.success('Imagem adicionada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    }
  };

  const handleGenerate = async () => {
    if (tab === 'url' && !url.trim()) {
      toast.error('Cole uma URL válida');
      return;
    }

    if (tab === 'file' && !file) {
      toast.error('Selecione um arquivo');
      return;
    }

    setLoading(true);
    setDraft(null);

    try {
      let source = '';
      let sourceType = '';

      if (tab === 'url') {
        source = url.trim();
        sourceType = 'url';
      } else {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        source = file_url;
        sourceType = 'file';
      }

      const response = await base44.functions.invoke('generateNewsFromContent', {
        source,
        sourceType,
        category
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao gerar notícia');
      }

      // Armazena draft para edição
      setDraft({
        ...response.data,
        category
      });
      setEditData({
        title: response.data.title,
        subtitle: response.data.subtitle,
        content: response.data.content || '',
        category
      });
      toast.success('✅ Notícia gerada! Revise antes de publicar.');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!editData?.title || !editData?.subtitle || !editData?.content) {
      toast.error('Preencha título, subtítulo e conteúdo');
      return;
    }

    setPublishing(true);
    try {
      // Formatar blocos de conteúdo
      const blocks = editData.content
        .split('\n\n')
        .filter(p => p.trim())
        .map((text, i) => ({
          id: Date.now() + i,
          type: 'content',
          content: text.trim(),
          order: i
        }));

      // Adicionar imagens aos blocos
      const allBlocks = [
        ...blocks,
        ...images.map((img, i) => ({
          id: Date.now() + blocks.length + i,
          type: 'image',
          image_url: img.url,
          order: blocks.length + i
        }))
      ];

      // Publicar
      const news = await base44.asServiceRole.entities.News.create({
        title: editData.title,
        subtitle: editData.subtitle,
        category: editData.category,
        author_name: 'NewsIA',
        blocks: allBlocks,
        status: 'published',
        is_featured: false,
        views_count: 0
      });

      toast.success('✅ Notícia publicada com sucesso!');
      setDraft(null);
      setEditData(null);
      setUrl('');
      setFile(null);
      setImages([]);

      setTimeout(() => {
        window.location.href = createPageUrl('GerenciarNoticias');
      }, 1500);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao publicar: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('GerenciarNoticias')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              Gerar Notícia com IA
            </h1>
            <p className="text-white/80 mt-2">Cole um link ou envie um arquivo. A IA gerará uma notícia otimizada para SEO</p>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {draft && editData && (
        <Dialog open={true} onOpenChange={() => { setDraft(null); setEditData(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                Revisar e Editar Notícia
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Título */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Título</Label>
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="rounded-lg h-11"
                  maxLength={70}
                />
                <p className="text-xs text-slate-500 mt-1">{editData.title.length}/70 caracteres</p>
              </div>

              {/* Subtítulo */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Subtítulo</Label>
                <textarea
                  value={editData.subtitle}
                  onChange={(e) => setEditData({...editData, subtitle: e.target.value})}
                  className="w-full rounded-lg p-3 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  rows={2}
                  maxLength={170}
                />
                <p className="text-xs text-slate-500 mt-1">{editData.subtitle.length}/170 caracteres</p>
              </div>

              {/* Conteúdo */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Conteúdo</Label>
                <textarea
                  value={editData.content}
                  onChange={(e) => setEditData({...editData, content: e.target.value})}
                  className="w-full rounded-lg p-3 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  rows={12}
                />
                <p className="text-xs text-slate-500 mt-1">{editData.content.length} caracteres</p>
              </div>

              {/* Imagens */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Adicionar Imagens</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer"
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">Clique ou arraste para enviar imagens</p>
                  <p className="text-xs text-slate-500">JPG, PNG, GIF (máx. 5MB)</p>
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Imagens Adicionadas */}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden border">
                        <img src={img.url} alt={img.name} className="w-full h-40 object-cover" />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Categoria */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Categoria</Label>
                <Select value={editData.category} onValueChange={(val) => setEditData({...editData, category: val})}>
                  <SelectTrigger className="rounded-lg">
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

              {/* Palavras-chave */}
              {draft.keywords && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Palavras-chave SEO</Label>
                  <div className="flex flex-wrap gap-2">
                    {draft.keywords.map((kw, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => { setDraft(null); setEditData(null); }}
                  disabled={publishing}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Publicar Notícia
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-8">
            {/* Abas */}
            <div className="flex gap-2 mb-8 border-b">
              <button
                onClick={() => setTab('url')}
                className={`pb-3 px-4 font-medium text-sm border-b-2 transition ${
                  tab === 'url'
                    ? 'border-[#0A66C2] text-[#0A66C2]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Cole uma URL
              </button>
              <button
                onClick={() => setTab('file')}
                className={`pb-3 px-4 font-medium text-sm border-b-2 transition ${
                  tab === 'file'
                    ? 'border-[#0A66C2] text-[#0A66C2]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Envie um Arquivo
              </button>
            </div>

            {/* Tab: URL */}
            {tab === 'url' && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-2 block">URL do Site</Label>
                  <Input
                    type="url"
                    placeholder="https://exemplo.com/artigo"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 rounded-xl"
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Cole o link completo de um artigo, notícia ou página web
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Arquivo */}
            {tab === 'file' && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#0A66C2] transition cursor-pointer"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 mb-1">Clique para enviar ou arraste um arquivo</p>
                  <p className="text-xs text-slate-500">
                    Suportados: PDF, DOCX, JPG, PNG, GIF (máx. 50MB)
                  </p>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                </div>

                {file && (
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileUp className="w-5 h-5 text-[#0A66C2]" />
                      <div>
                        <p className="font-medium text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700"
                      disabled={loading}
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Categoria */}
            <div className="mt-6 pt-6 border-t">
              <Label className="text-base font-semibold mb-2 block">Categoria</Label>
              <Select value={category} onValueChange={setCategory} disabled={loading}>
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

            {/* Botão Gerar */}
            <div className="mt-8 pt-6 border-t flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setUrl('');
                  setFile(null);
                }}
                disabled={loading}
                className="flex-1 h-11 rounded-xl"
              >
                Limpar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading || (!url.trim() && !file)}
                className="flex-1 h-11 rounded-xl bg-[#0A66C2] hover:bg-[#004182]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Notícia com IA
                  </>
                )}
              </Button>
            </div>

            {/* Dicas */}
            <div className="mt-8 pt-6 border-t bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Dicas para melhores resultados:
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-6">
                <li>• Use URLs de artigos bem estruturados e com bom conteúdo</li>
                <li>• Para PDFs e imagens, certifique-se que contêm texto legível</li>
                <li>• Escolha a categoria correta para otimização de SEO</li>
                <li>• A IA reescreverá o conteúdo mantendo o foco original</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}