import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Eye, User, Share2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
  });

  const updateViewsMutation = useMutation({
    mutationFn: (id) => base44.entities.News.update(id, { views_count: (news?.views_count || 0) + 1 }),
  });

  useEffect(() => {
    if (news && newsId) {
      updateViewsMutation.mutate(newsId);
    }
  }, [newsId, news?.id]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-600 mb-4">Notícia não encontrada</h2>
          <Link to={createPageUrl('News')}>
            <Button className="bg-[#0A66C2] hover:bg-[#004182]">Voltar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('News')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <Card className="shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {news.image_url && (
              <img 
                src={news.image_url} 
                alt={news.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            )}

            <div className="p-6 md:p-8">
              <Badge className="bg-[#0A66C2] text-white mb-4">
                {news.category}
              </Badge>

              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4">
                {news.title}
              </h1>

              {news.subtitle && (
                <p className="text-lg text-slate-600 mb-6 border-l-4 border-[#0A66C2] pl-4">
                  {news.subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 py-4 border-y border-slate-200 text-sm text-slate-500">
                {news.author_name && (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {news.author_name}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(news.created_date)}
                </span>
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {news.views_count || 0} visualizações
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleShare}
                  className="ml-auto"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              <div className="mt-8 prose prose-lg max-w-none">
                <div 
                  className="text-slate-700 text-lg leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: news.content || '' }}
                />
              </div>

              <div className="mt-8 pt-6 border-t">
                <Button 
                  onClick={() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(news.title + ' - ' + window.location.href)}`, '_blank');
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                >
                  Compartilhar no WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}