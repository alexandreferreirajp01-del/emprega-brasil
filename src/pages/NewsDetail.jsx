import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Eye, User, Share2, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import SEOHead from "@/components/common/SEOHead";

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

  const renderBlocks = () => {
    if (!news.blocks || news.blocks.length === 0) {
      if (news.content) {
        return (
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">
              {news.content}
            </p>
          </div>
        );
      }
      return null;
    }

    const sorted = [...news.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
      <div className="space-y-6">
        {sorted.map((block, index) => {
          if (block.type === 'text' && block.content) {
            return (
              <p key={index} className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">
                {block.content}
              </p>
            );
          }
          
          if (block.type === 'image' && block.content) {
            return (
              <div key={index} className="my-6">
                <img 
                  src={block.content} 
                  alt="" 
                  className="w-full rounded-lg"
                />
              </div>
            );
          }
          
          if (block.type === 'video' && block.content) {
            return (
              <div key={index} className="my-6">
                <video 
                  src={block.content} 
                  controls 
                  className="w-full rounded-lg"
                />
              </div>
            );
          }
          
          if (block.type === 'link' && block.content) {
            return (
              <a 
                key={index}
                href={block.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#0A66C2] hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                {block.content}
              </a>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-white pb-20">
      {/* Header - Estilo G1 */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] py-2 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to={createPageUrl('News')} className="text-white hover:text-white/80 text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Notícias
          </Link>
          <div className="flex items-center gap-4 text-white/80 text-xs">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {news.views_count || 0}
            </span>
            <span>{formatDate(news.created_date)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <article>
          {/* Category Badge */}
          <Badge className="bg-[#0A66C2] text-white border-0 rounded-sm px-3 py-1 text-xs uppercase font-bold mb-4">
            {news.category}
          </Badge>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
            {news.title}
          </h1>

          {news.subtitle && (
            <p className="text-lg text-slate-600 mb-6 border-l-4 border-[#0A66C2] pl-4">
              {news.subtitle}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 py-4 border-y border-slate-200 text-sm text-slate-500 mb-6">
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="ml-auto h-8"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {/* Content Blocks */}
          <div className="mb-8">
            {renderBlocks()}
          </div>

          {/* Share Footer */}
          <div className="pt-6 border-t">
            <Button 
              onClick={() => {
                window.open(`https://wa.me/?text=${encodeURIComponent(news.title + ' - ' + window.location.href)}`, '_blank');
              }}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              Compartilhar no WhatsApp
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}