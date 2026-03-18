import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Upload, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, Sparkles, FileUp
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
    setResult(null);

    try {
      let source = '';
      let sourceType = '';

      if (tab === 'url') {
        source = url.trim();
        sourceType = 'url';
      } else {
        // Upload do arquivo
        console.log('Enviando arquivo...');
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        source = file_url;
        sourceType = 'file';
        console.log('Arquivo enviado:', file_url);
      }

      console.log('Gerando notícia com', { source, sourceType, category });

      // Chamar função backend
      const response = await base44.functions.invoke('generateNewsFromContent', {
        source,
        sourceType,
        category
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao gerar notícia');
      }

      setResult(response.data);
      toast.success('✅ Notícia gerada e publicada com sucesso!');

      // Limpar
      setUrl('');
      setFile(null);
      setTimeout(() => {
        window.location.href = createPageUrl('GerenciarNoticias');
      }, 1500);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
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

      {/* Resultado */}
      {result && (
        <Dialog open={true} onOpenChange={() => setResult(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
                Notícia Gerada com Sucesso!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Título</Label>
                <p className="text-lg font-bold mt-1">{result.title}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Subtítulo</Label>
                <p className="text-sm text-slate-600 mt-1">{result.subtitle}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Palavras-chave SEO</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.keywords?.map((kw, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              {result.internalLinks?.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Tópicos Relacionados</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.internalLinks.map((link, i) => (
                      <span key={i} className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full">
                        {link}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Button 
                onClick={() => window.location.href = createPageUrl('GerenciarNoticias')}
                className="w-full bg-[#0A66C2] hover:bg-[#004182]"
              >
                Ver em Gerenciar Notícias
              </Button>
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