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
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function News() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      try {
        return await base44.entities.News.filter({ status: 'published' }, '-created_date', 100) || [];
      } catch (e) {
        console.error('Erro ao carregar notícias:', e);
        return [];
      }
    },
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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Notícias</h1>
          </div>
          
          {/* Search */}
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar notícias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10 rounded-lg border-0 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="rounded-full"
              >
                Todas
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured News */}
            {featuredNews && selectedCategory === 'all' && !searchTerm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link to={createPageUrl('NewsDetail') + `?id=${featuredNews.id}`}>
                  <Card className="overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                    {featuredNews.image_url && (
                      <div className="relative h-64 md:h-80 overflow-hidden">
                        <img 
                          src={featuredNews.image_url} 
                          alt={featuredNews.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <Badge className="bg-red-500 text-white border-0 mb-3">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Destaque
                          </Badge>
                          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                            {featuredNews.title}
                          </h2>
                          {featuredNews.subtitle && (
                            <p className="text-white/80 line-clamp-2">{featuredNews.subtitle}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTimeAgo(featuredNews.created_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {featuredNews.views_count || 0}
                            </span>
                          </div>
                        </div>
                        {featuredNews.video_url && (
                          <div className="absolute top-4 right-4">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                              <PlayCircle className="w-8 h-8 text-red-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!featuredNews.image_url && (
                      <CardContent className="p-6">
                        <Badge className="bg-red-500 text-white border-0 mb-3">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{featuredNews.title}</h2>
                        {featuredNews.subtitle && (
                          <p className="text-slate-600">{featuredNews.subtitle}</p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </Link>
              </motion.div>
            )}

            {/* News List */}
            <div className="space-y-4">
              {isLoading ? (
                <>
                  {[1,2,3,4].map(i => (
                    <Card key={i} className="animate-pulse rounded-xl">
                      <CardContent className="p-4 flex gap-4">
                        <div className="w-32 h-24 bg-slate-200 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/4" />
                          <div className="h-5 bg-slate-200 rounded w-3/4" />
                          <div className="h-4 bg-slate-200 rounded w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                filteredNews.filter(n => n.id !== featuredNews?.id).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={createPageUrl('NewsDetail') + `?id=${item.id}`}>
                      <Card className="overflow-hidden rounded-xl hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            {item.image_url && (
                              <div className="relative w-full md:w-48 h-40 md:h-32 flex-shrink-0 overflow-hidden">
                                <img 
                                  src={item.image_url} 
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {item.video_url && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="p-4 flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs rounded-full">
                                  {item.category || 'Geral'}
                                </Badge>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(item.created_date)}
                                </span>
                              </div>
                              <h3 className="font-semibold text-slate-800 group-hover:text-[#0056ff] transition-colors line-clamp-2 mb-1">
                                {item.title}
                              </h3>
                              {item.subtitle && (
                                <p className="text-sm text-slate-500 line-clamp-1">{item.subtitle}</p>
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
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              )}

              {filteredNews.length === 0 && !isLoading && (
                <Card className="rounded-xl">
                  <CardContent className="p-8 text-center">
                    <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-600 mb-2">Nenhuma notícia encontrada</h3>
                    <p className="text-slate-500">Tente ajustar os filtros de busca</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent News */}
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0056ff]" />
                  Últimas Notícias
                </h3>
                <div className="space-y-4">
                  {recentNews.slice(0, 5).map((item, index) => (
                    <Link 
                      key={item.id} 
                      to={createPageUrl('NewsDetail') + `?id=${item.id}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl font-bold text-slate-200">{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-[#0056ff] transition-colors line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(item.created_date)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categories Widget */}
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <h3 className="font-bold text-slate-800 mb-4">Categorias</h3>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const count = news.filter(n => n.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 transition-colors ${
                          selectedCategory === cat ? 'bg-[#0056ff]/10 text-[#0056ff]' : 'text-slate-600'
                        }`}
                      >
                        <span className="text-sm">{cat}</span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="rounded-xl bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Quer mais oportunidades?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Acesse todas as vagas exclusivas
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