import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, Calendar, Eye, ChevronRight, Clock, 
  Newspaper, TrendingUp, User, PlayCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function News() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const result = await base44.entities.News.filter({ status: 'published' }, '-created_date', 100);
      return result || [];
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
  });

  const categories = ['Mercado de Trabalho', 'Dicas de Emprego', 'Economia', 'Cursos', 'Eventos', 'Geral'];

  const featuredNews = news.filter(n => n.is_featured).slice(0, 1)[0];
  const recentNews = news.filter(n => !n.is_featured).slice(0, 5);
  
  const filteredNews = news.filter(n => {
    const matchesSearch = !searchTerm || 
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return formatDate(dateStr);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">Notícias</h1>
          </div>
          <div className="text-white/80 text-xs hidden sm:block">
            Vagas Abertas Paraíba
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="bg-slate-100 py-4 px-4 border-b">
        <div className="max-w-6xl mx-auto">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar notícias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10 rounded-lg border-slate-200 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto py-3 gap-1 hide-scrollbar">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-none border-b-2 ${selectedCategory === 'all' ? 'border-[#0056ff] text-[#0056ff] bg-transparent hover:bg-transparent' : 'border-transparent'}`}
            >
              Todas
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-none border-b-2 whitespace-nowrap ${selectedCategory === cat ? 'border-[#0056ff] text-[#0056ff] bg-transparent hover:bg-transparent' : 'border-transparent'}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Featured News - Estilo G1 */}
            {featuredNews && selectedCategory === 'all' && !searchTerm && (
              <div>
                <Link to={createPageUrl('NewsDetail') + `?id=${featuredNews.id}`}>
                  <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                    {featuredNews.image_url && (
                      <div className="relative h-72 md:h-96 overflow-hidden">
                        <img 
                          src={featuredNews.image_url} 
                          alt={featuredNews.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-[#0056ff] text-white border-0 rounded-sm px-3 py-1 text-xs uppercase font-bold">
                            {featuredNews.category || 'Destaque'}
                          </Badge>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight">
                            {featuredNews.title}
                          </h2>
                          {featuredNews.subtitle && (
                            <p className="text-white/90 text-lg line-clamp-2 mb-4">{featuredNews.subtitle}</p>
                          )}
                          <div className="flex items-center gap-4 text-white/70 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTimeAgo(featuredNews.created_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {featuredNews.views_count || 0} visualizações
                            </span>
                          </div>
                        </div>
                        {featuredNews.video_url && (
                          <div className="absolute top-4 right-4">
                            <div className="w-14 h-14 bg-[#0056ff] rounded-full flex items-center justify-center shadow-lg">
                              <PlayCircle className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!featuredNews.image_url && (
                      <div className="p-6 bg-gradient-to-r from-[#0056ff] to-[#0044cc] text-white">
                        <Badge className="bg-white/20 text-white border-0 rounded-sm mb-3">
                          Destaque
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{featuredNews.title}</h2>
                        {featuredNews.subtitle && (
                          <p className="text-white/80">{featuredNews.subtitle}</p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* News List - Estilo G1 */}
            <div className="space-y-1 divide-y divide-slate-100">
              {isLoading ? (
                <>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="animate-pulse py-4 flex gap-4">
                      <div className="w-32 h-24 bg-slate-200 rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/4" />
                        <div className="h-5 bg-slate-200 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                filteredNews.filter(n => n.id !== featuredNews?.id).map((item) => (
                  <div key={item.id}>
                    <Link to={createPageUrl('NewsDetail') + `?id=${item.id}`}>
                      <article className="py-4 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col sm:flex-row gap-4">
                        {item.image_url && (
                          <div className="relative w-full sm:w-40 h-32 sm:h-24 flex-shrink-0 overflow-hidden rounded">
                            <img 
                              src={item.image_url} 
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {item.video_url && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-[#0056ff]/10 text-[#0056ff] border-0 text-xs rounded-sm px-2 py-0.5">
                              {item.category || 'Geral'}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {formatTimeAgo(item.created_date)}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 group-hover:text-[#0056ff] transition-colors line-clamp-2 text-lg leading-snug mb-1">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-slate-600 line-clamp-2">{item.subtitle}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            {item.author_name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.author_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {item.views_count || 0}
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </div>
                ))
              )}

              {filteredNews.length === 0 && !isLoading && (
                <div className="py-16 text-center">
                  <Newspaper className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-600 mb-2">Nenhuma notícia encontrada</h3>
                  <p className="text-slate-500">Tente ajustar os filtros de busca</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Estilo G1 */}
          <div className="lg:col-span-4 space-y-6">
            {/* Recent News */}
            <Card className="rounded-lg border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] px-4 py-3">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Mais Lidas
                </h3>
              </div>
              <CardContent className="p-0 divide-y">
                {recentNews.slice(0, 5).map((item, index) => (
                  <Link 
                    key={item.id} 
                    to={createPageUrl('NewsDetail') + `?id=${item.id}`}
                    className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-3xl font-bold text-[#0056ff] leading-none">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 group-hover:text-[#0056ff] transition-colors line-clamp-3">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(item.created_date)}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Categories Widget */}
            <Card className="rounded-lg border-0 shadow-sm overflow-hidden">
              <div className="bg-slate-800 px-4 py-3">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">Categorias</h3>
              </div>
              <CardContent className="p-0 divide-y">
                {categories.map(cat => {
                  const count = news.filter(n => n.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors ${
                        selectedCategory === cat ? 'bg-[#0056ff]/10 text-[#0056ff]' : 'text-slate-700'
                      }`}
                    >
                      <span className="text-sm font-medium">{cat}</span>
                      <Badge className={`text-xs ${selectedCategory === cat ? 'bg-[#0056ff] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="rounded-lg bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white border-0">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Quer mais oportunidades?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Acesse todas as vagas exclusivas
                </p>
                <Link to={createPageUrl('Jobs')}>
                  <Button className="bg-white text-[#0056ff] hover:bg-white/90 rounded-lg w-full">
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