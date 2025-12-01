import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, Eye, User, Share2, 
  Clock, ChevronRight, PlayCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function NewsDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const newsId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: news, isLoading } = useQuery({
    queryKey: ['news-detail', newsId],
    queryFn: async () => {
      const items = await base44.entities.News.filter({ id: newsId });
      return items[0];
    },
    enabled: !!newsId,
  });

  const { data: allNews = [] } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      try {
        return await base44.entities.News.filter({ status: 'published' }, '-created_date', 10) || [];
      } catch (e) {
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

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
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

  const embedUrl = getYouTubeEmbedUrl(news.video_url);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Top Bar - Estilo G1 */}
      <div className="bg-red-600 py-2 px-4">
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
          {/* Main Content - Estilo G1 */}
          <div className="lg:col-span-8">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white"
            >
              {/* Category Badge */}
              <div className="px-4 pt-6">
                <Badge className="bg-red-600 text-white border-0 rounded-sm px-3 py-1 text-xs uppercase font-bold tracking-wide">
                  {news.category || 'Geral'}
                </Badge>
              </div>

              {/* Title - Estilo G1 */}
              <div className="px-4 pt-4 pb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
                  {news.title}
                </h1>

                {news.subtitle && (
                  <p className="text-lg sm:text-xl text-slate-600 leading-relaxed border-l-4 border-red-600 pl-4">
                    {news.subtitle}
                  </p>
                )}
              </div>

              {/* Author & Date Bar */}
              <div className="px-4 py-3 border-y border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {news.author_name && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
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
                    className="h-8 text-slate-500 hover:text-red-600"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Compartilhar
                  </Button>
                </div>
              </div>

              {/* Image/Video - Full Width */}
              {embedUrl ? (
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={embedUrl}
                    title={news.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : news.image_url ? (
                <div className="relative">
                  <img 
                    src={news.image_url} 
                    alt={news.title}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />
                </div>
              ) : null}

              {/* Content - Estilo Artigo G1 */}
              <div className="px-4 sm:px-6 md:px-8 py-8">
                <div className="prose prose-lg prose-slate max-w-none">
                  <div className="text-slate-800 text-lg leading-[1.8] whitespace-pre-line">
                    {news.content?.split('\n').map((paragraph, index) => {
                      if (!paragraph.trim()) return <div key={index} className="h-4" />;
                      // Primeiro parágrafo em destaque
                      if (index === 0) {
                        return (
                          <p key={index} className="text-xl font-medium text-slate-900 mb-6 first-letter:text-5xl first-letter:font-bold first-letter:text-red-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                            {paragraph}
                          </p>
                        );
                      }
                      return (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>

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

          {/* Sidebar - Estilo G1 */}
          <div className="lg:col-span-4 space-y-6 px-4 lg:px-0 pt-6">
            {/* Related News */}
            {relatedNews.length > 0 && (
              <Card className="rounded-lg border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="bg-red-600 px-4 py-3">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">Notícias Relacionadas</h3>
                  </div>
                  <div className="divide-y">
                    {relatedNews.map((item) => (
                      <Link 
                        key={item.id} 
                        to={createPageUrl('NewsDetail') + `?id=${item.id}`}
                        className="block group p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex gap-3">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.title}
                              className="w-24 h-16 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 group-hover:text-red-600 transition-colors line-clamp-3">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.created_date)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
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
    </div>
  );
}