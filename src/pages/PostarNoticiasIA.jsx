import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PostarNoticiasIA() {
  const [source, setSource] = useState('');
  const [type, setType] = useState('url');
  const [category, setCategory] = useState('Geral');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const categories = ['Geral', 'Mercado de Trabalho', 'Dicas de Emprego', 'Economia', 'Cursos', 'Eventos'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source.trim()) {
      toast.error('Preencha a URL ou selecione um arquivo');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        source: source.trim(),
        type,
        category,
        ...(imageUrl && { imageUrl })
      };

      const response = await base44.functions.invoke('postNews', payload);

      if (response.data?.success) {
        setResult({
          success: true,
          title: response.data.title,
          subtitle: response.data.subtitle,
          newsId: response.data.newsId
        });
        toast.success('Notícia publicada com sucesso!');
        setSource('');
        setImageUrl('');
      } else {
        throw new Error(response.data?.error || 'Erro desconhecido');
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao postar notícia');
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await base44.functions.invoke('uploadFile', { file });
      if (response.data?.file_url) {
        setSource(response.data.file_url);
        setType('file');
      }
    } catch (err) {
      toast.error('Erro ao upload do arquivo');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">Postar Notícia com IA</h1>
        <p className="text-blue-100">Cole uma URL ou faça upload de um arquivo para gerar notícia automática</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de fonte */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setType('url'); setSource(''); }}
            className={`flex-1 p-3 rounded-lg border-2 transition ${
              type === 'url' 
                ? 'border-blue-600 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <LinkIcon className="w-5 h-5 mx-auto mb-1" />
            URL
          </button>
          <button
            type="button"
            onClick={() => { setType('file'); setSource(''); }}
            className={`flex-1 p-3 rounded-lg border-2 transition ${
              type === 'file' 
                ? 'border-blue-600 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className="w-5 h-5 mx-auto mb-1" />
            Arquivo
          </button>
        </div>

        {/* Input dinamicamente baseado no tipo */}
        {type === 'url' ? (
          <div>
            <label className="block text-sm font-medium mb-2">URL do Site</label>
            <Input
              type="url"
              placeholder="https://exemplo.com/noticia"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={loading}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">Arquivo (PDF, DOCX, Imagem)</label>
            <input
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png,.gif"
              onChange={handleFileUpload}
              disabled={loading}
              className="w-full"
            />
            {source && <p className="text-sm text-green-600 mt-1">✓ Arquivo carregado</p>}
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium mb-2">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
            disabled={loading}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* URL da imagem (opcional) */}
        <div>
          <label className="block text-sm font-medium mb-2">URL da Imagem (opcional)</label>
          <Input
            type="url"
            placeholder="https://exemplo.com/imagem.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Botão submit */}
        <Button
          type="submit"
          disabled={loading || !source}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Gerar e Postar Notícia'
          )}
        </Button>
      </form>

      {/* Resultado */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <>
              <div className="flex gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-700">Sucesso!</h3>
              </div>
              <p className="text-sm text-green-700 mb-2"><strong>Título:</strong> {result.title}</p>
              <p className="text-sm text-green-700"><strong>Subtítulo:</strong> {result.subtitle}</p>
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-700">Erro</h3>
              </div>
              <p className="text-sm text-red-700">{result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}