import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Plus, Search, Edit2, Trash2, Eye, Globe, Copy, Loader2,
  CheckCircle2, AlertCircle, Zap, FileText, Calendar, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const CATEGORIES = ['Geral', 'Mercado de Trabalho', 'Dicas de Emprego', 'Economia', 'Cursos', 'Eventos'];

export default function GerenciarNoticias2() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [sourceType, setSourceType] = useState('url');
  const [sourceInput, setSourceInput] = useState('');
  const [category, setCategory] = useState('Geral');
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const hasAccess = currentUser?.role === 'admin' || currentUser?.subscription_type === 'admin';
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

  const { data: newsList = [], isLoading: loadingNews } = useQuery({
    queryKey: ['news-management'],
    queryFn: async () => {
      const res = await base44.entities.News.list('-created_date', 100);
      return res || [];
    },
    enabled: !!user,
  });

  const filteredNews = newsList.filter(news => {
    const matchesSearch = news.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || news.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!sourceInput.trim()) {
        throw new Error('Preencha a URL ou arquivo');
      }
      
      const res = await base44.functions.invoke('newsAIProcessor', {
        source: sourceInput,
        sourceType,
        category,
        publishImmediately: false
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Erro ao processar');
      }
      
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`✨ Notícia criada: "${data.title}"`);
      setSourceInput('');
      setShowNewModal(false);
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['news-management'] });
    },
    onError: (error) => {
      setLoading(false);
      toast.error('❌ ' + (error.message || 'Erro ao processar'));
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (newsId) => {
      const news = newsList.find(n => n.id === newsId);
      await base44.entities.News.update(newsId, {
        ...news,
        status: 'published'
      });
    },
    onSuccess: () => {
      toast.success('✅ Notícia publicada!');
      queryClient.invalidateQueries({ queryKey: ['news-management'] });
    },
    onError: (error) => toast.error('Erro: ' + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (newsId) => {
      if (!confirm('Descartar notícia?')) return;
      await base44.entities.News.delete(newsId);
    },
    onSuccess: () => {
      toast.success('✅ Notícia removida');
      queryClient.invalidateQueries({ queryKey: ['news-management'] });
    },
    onError: (error) => toast.error('Erro: ' + error.message)
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Notícias</h1>
              <p className="text-blue-100">Com Inteligência Artificial e Otimização SEO</p>
            </div>
            <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
              <DialogTrigger asChild>
                <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold">
                  <Plus className="w-5 h-5 mr-2" />Nova Notícia com IA
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Notícia com IA</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Source Type Selection */}
                  <div className="flex gap-3">
                    {[
                      { id: 'url', label: 'URL Web', icon: Globe },
                      { id: 'file', label: 'Arquivo', icon: FileText }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => { setSourceType(type.id); setSourceInput(''); }}
                        className={`flex-1 p-3 rounded-lg border-2 transition ${
                          sourceType === type.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <type.icon className="w-5 h-5 mx-auto mb-1" />
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {/* Source Input */}
                  {sourceType === 'url' ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">URL do Site</label>
                      <Input
                        placeholder="https://exemplo.com/noticia"
                        value={sourceInput}
                        onChange={(e) => setSourceInput(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">Arquivo (PDF, DOCX, Imagem)</label>
                      <input
                        type="file"
                        accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const uploadRes = await base44.integrations.Core.UploadFile({ file });
                              setSourceInput(uploadRes.file_url);
                              toast.success('Arquivo carregado');
                            } catch (err) {
                              toast.error('Erro ao carregar arquivo');
                            }
                          }
                        }}
                        disabled={loading}
                      />
                    </div>
                  )}

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border rounded-lg p-2"
                      disabled={loading}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={() => {
                      setLoading(true);
                      processMutation.mutate();
                    }}
                    disabled={loading || !sourceInput || processMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading || processMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando (pode levar 30s)...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Gerar Notícia com IA
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Search & Filter */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar notícias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg p-2"
            >
              <option value="all">Todos</option>
              <option value="draft">Rascunhos</option>
              <option value="published">Publicadas</option>
            </select>
          </CardContent>
        </Card>

        {/* News List */}
        <div className="grid gap-4">
          {loadingNews ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredNews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Nenhuma notícia encontrada. Crie uma nova!
              </CardContent>
            </Card>
          ) : (
            filteredNews.map(news => (
              <Card key={news.id} className="hover:shadow-lg transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{news.title}</h3>
                        <Badge variant={news.status === 'published' ? 'default' : 'outline'}>
                          {news.status === 'published' ? '📢 Publicada' : '📝 Rascunho'}
                        </Badge>
                        {news.is_featured && <Badge className="bg-yellow-500">⭐ Destaque</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{news.subtitle}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(news.created_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {news.author_name}
                        </span>
                        {news.category && (
                          <Badge variant="outline">{news.category}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {news.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => publishMutation.mutate(news.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(news.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}