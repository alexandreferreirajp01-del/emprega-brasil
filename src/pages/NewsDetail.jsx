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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('News')} className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para notícias
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-xl rounded-2xl overflow-hidden">
                {/* Image/Video */}
                {embedUrl ? (
                  <div className="relative aspect-video">
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
                  <img 
                    src={news.image_url} 
                    alt={news.title}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                ) : null}

                <CardContent className="p-6 md:p-8">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className="bg-[#0056ff]/10 text-[#0056ff] border-0">
                      {news.category || 'Geral'}
                    </Badge>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(news.created_date)}
                    </span>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {news.views_count || 0} visualizações
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                    {news.title}
                  </h1>

                  {news.subtitle && (
                    <p className="text-lg text-slate-600 mb-6">{news.subtitle}</p>
                  )}

                  {/* Author */}
                  {news.author_name && (
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                      <div className="w-10 h-10 bg-[#0056ff] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{news.author_name}</p>
                        <p className="text-sm text-slate-500">Autor</p>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-slate max-w-none">
                    <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {news.content}
                    </div>
                  </div>

                  {/* Share */}
                  <div className="flex items-center gap-4 mt-8 pt-6 border-t">
                    <Button 
                      variant="outline" 
                      onClick={handleShare}
                      className="rounded-xl"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related News */}
            {relatedNews.length > 0 && (
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <h3 className="font-bold text-slate-800 mb-4">Notícias Relacionadas</h3>
                  <div className="space-y-4">
                    {relatedNews.map((item) => (
                      <Link 
                        key={item.id} 
                        to={createPageUrl('NewsDetail') + `?id=${item.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.title}
                              className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700 group-hover:text-[#0056ff] transition-colors line-clamp-2">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
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
            <Card className="rounded-xl bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Procurando emprego?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Veja todas as vagas disponíveis
                </p>
                <Link to={createPageUrl('Jobs')}>
                  <Button className="bg-white text-[#0056ff] hover:bg-white/90 rounded-xl">
                    Ver Vagas
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}