import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, Eye, User, Share2, 
  Clock, ChevronRight, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function NewsDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const newsId = urlParams.get('id');

  const { data: news, isLoading } = useQuery({
    queryKey: ['news-detail', newsId],
    queryFn: async () => {
      const items = await base44.entities.News.filter({ id: newsId });
      return items[0];
    },
    enabled: !!newsId,
    staleTime: 5000,
  });

  const { data: allNews = [] } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      try {
        return await base44.entities.News.filter({ status: 'published' }, '-created_date', 10) || [];
      } catch {
        return [];
      }
    },
  });

  const updateViewsMutation = useMutation({
    mutationFn: (id) => base44.entities.News.update(id, { views_count: (news?.views_count || 0) + 1 }),
  });

  useEffect(() => {
    if (news && newsId) {
      updateViewsMutation.mutate(newsId);
    }
  }, [newsId, news?.id]);

  const relatedNews = allNews.filter(n => n.id !== newsId && n.category === news?.category).slice(0, 3);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news?.title,
        text: news?.subtitle || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <div className="h-64 bg-slate-200 rounded-xl" />
            <div className="h-6 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Notícia não encontrada</h2>
          <Link to={createPageUrl('News')}>
            <Button className="mt-4">Voltar para notícias</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Renderizar blocos de conteúdo
  const renderBlocks = () => {
    if (!news.blocks || news.blocks.length === 0) {
      // Fallback para conteúdo antigo (sem blocos)
      if (news.content) {
        return (
          <div className="prose prose-lg prose-slate max-w-none">
            <div 
              className="text-slate-800 text-lg leading-[1.8]"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>
        );
      }
      return null;
    }

    const sortedBlocks = [...news.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
      <div className="space-y-6">
        {sortedBlocks.map((block, index) => {
          if (block.type === 'image' && block.image_url) {
            return (
              <div key={index} className="my-6">
                <img 
                  src={block.image_url} 
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            );
          }
          
          if (block.type === 'content' && block.content) {
            return (
              <div 
                key={index}
                className="prose prose-lg prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={createPageUrl('News')} className="inline-flex items-center text-white hover:text-white/80 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para notícias
          </Link>
          <div className="flex items-center gap-4 text-white/90 text-xs">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {news.views_count || 0}
            </span>
            <span>{formatDate(news.created_date)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white"
            >
              {/* Category Badge */}
              <div className="px-4 pt-6">
                <Badge className="bg-[#0056ff] text-white border-0 rounded-sm px-3 py-1 text-xs uppercase font-bold tracking-wide">
                  {news.category || 'Geral'}
                </Badge>
              </div>

              {/* Title */}
              <div className="px-4 pt-4 pb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
                  {news.title}
                </h1>

                {news.subtitle && (
                  <p className="text-lg sm:text-xl text-slate-600 leading-relaxed border-l-4 border-[#0056ff] pl-4">
                    {news.subtitle}
                  </p>
                )}
              </div>

              {/* Author & Date Bar */}
              <div className="px-4 py-3 border-y border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {news.author_name && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#0056ff] rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Por {news.author_name}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(news.created_date)}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleShare}
                    className="h-8 text-slate-500 hover:text-[#0056ff]"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Compartilhar
                  </Button>
                </div>
              </div>

              {/* Blocos de Conteúdo */}
              <div className="px-4 sm:px-6 md:px-8 py-8">
                {renderBlocks()}
              </div>

              {/* Link Externo */}
              {news.external_link && (
                <div className="px-4 sm:px-6 md:px-8 pb-6">
                  <a 
                    href={news.external_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Acessar link externo
                  </a>
                </div>
              )}

              {/* Share Footer */}
              <div className="px-4 sm:px-6 md:px-8 py-6 border-t bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-slate-500">Gostou? Compartilhe esta notícia!</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(news.title + ' - ' + window.location.href)}`, '_blank');
                      }}
                      className="rounded-lg bg-green-500 text-white border-0 hover:bg-green-600"
                    >
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleShare}
                      className="rounded-lg"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Copiar Link
                    </Button>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6 px-4 lg:px-0 pt-6">
            {/* Related News */}
            {relatedNews.length > 0 && (
              <Card className="rounded-lg border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] px-4 py-3">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">Notícias Relacionadas</h3>
                  </div>
                  <div className="divide-y">
                    {relatedNews.map((item) => {
                      const firstImage = item.blocks?.find(b => b.type === 'image')?.image_url || item.image_url;
                      return (
                        <Link 
                          key={item.id} 
                          to={createPageUrl('NewsDetail') + `?id=${item.id}`}
                          className="block group p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex gap-3">
                            {firstImage && (
                              <img 
                                src={firstImage} 
                                alt={item.title}
                                className="w-24 h-16 object-cover rounded flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 group-hover:text-[#0056ff] transition-colors line-clamp-3">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(item.created_date)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Card className="rounded-lg bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white border-0">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Procurando emprego?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Veja todas as vagas disponíveis na Paraíba
                </p>
                <Link to={createPageUrl('Jobs')}>
                  <Button className="bg-white text-[#0056ff] hover:bg-white/90 rounded-lg w-full">
                    Ver Vagas
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Back to News */}
            <Link to={createPageUrl('News')}>
              <Button variant="outline" className="w-full rounded-lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Todas as Notícias
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Estilos para o conteúdo HTML */}
      <style>{`
        .prose a {
          color: #0056ff;
          text-decoration: underline;
          font-weight: 500;
        }
        .prose a:hover {
          color: #0044cc;
        }
        .prose blockquote {
          border-left: 4px solid #0056ff;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #4B5563;
          font-style: italic;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .prose h1, .prose h2, .prose h3 {
          color: #1e293b;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose ul, .prose ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .prose li {
          margin: 0.5rem 0;
        }
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.8;
        }
      `}</style>
    </div>
  );
}