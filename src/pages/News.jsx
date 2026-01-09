import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, Clock, Newspaper, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import TimeAgo from "@/components/common/TimeAgo";

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
  });

  const categories = ['Mercado de Trabalho', 'Dicas de Emprego', 'Economia', 'Cursos', 'Eventos', 'Geral'];

  const featuredNews = news.filter(n => n.is_featured).slice(0, 1)[0];
  
  const filteredNews = news.filter(n => {
    const matchesSearch = !searchTerm || 
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    return matchesSearch && matchesCategory && n.id !== featuredNews?.id;
  });

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Notícias</h1>
          </div>
          <p className="text-white/80">Fique atualizado com as últimas novidades</p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg mb-6 rounded-2xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar notícias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-10 rounded-xl border-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full ${selectedCategory === 'all' ? 'bg-[#0A66C2]' : ''}`}
          >
            Todas
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full whitespace-nowrap ${selectedCategory === cat ? 'bg-[#0A66C2]' : ''}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {featuredNews && selectedCategory === 'all' && !searchTerm && (
          <Link to={createPageUrl('NewsDetail') + `?id=${featuredNews.id}`}>
            <Card className="mb-6 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="relative">
                {featuredNews.image_url ? (
                  <div className="relative h-64 md:h-96">
                    <img 
                      src={featuredNews.image_url} 
                      alt={featuredNews.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 p-6 text-white">
                      <Badge className="bg-yellow-500 text-white mb-3">Destaque</Badge>
                      <h2 className="text-2xl md:text-4xl font-bold mb-2">{featuredNews.title}</h2>
                      {featuredNews.subtitle && (
                        <p className="text-white/90 text-lg mb-3">{featuredNews.subtitle}</p>
                      )}
                      <div className="flex items-center gap-4 text-white/70 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <TimeAgo date={featuredNews.created_date} />
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {featuredNews.views_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white">
                    <Badge className="bg-white/20 mb-3">Destaque</Badge>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{featuredNews.title}</h2>
                    {featuredNews.subtitle && <p className="text-white/80">{featuredNews.subtitle}</p>}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <Card key={i} className="animate-pulse rounded-2xl">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-32 h-24 bg-slate-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((item) => (
              <Link key={item.id} to={createPageUrl('NewsDetail') + `?id=${item.id}`}>
                <Card className="hover:shadow-lg transition-shadow rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-4 p-4">
                      {item.image_url && (
                        <div className="w-full sm:w-40 h-32 flex-shrink-0">
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="bg-[#0A66C2] text-white text-xs">
                            {item.category}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            <TimeAgo date={item.created_date} />
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{item.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-400">
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
            ))}

            {filteredNews.length === 0 && (
              <div className="py-16 text-center">
                <Newspaper className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-600 mb-2">Nenhuma notícia encontrada</h3>
                <p className="text-slate-500">Tente ajustar sua busca</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}