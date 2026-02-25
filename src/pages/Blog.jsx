import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Eye, BookOpen, Star, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES = ["Geral","Dicas","Mercado de Trabalho","Tecnologia","Carreira","Educação","Empreendedorismo","Lifestyle"];

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_at', 100),
    staleTime: 60000,
  });

  const featuredPost = posts.find(p => p.is_featured);
  const filteredPosts = posts.filter(p => {
    const matchSearch = !searchTerm || p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && p.id !== featuredPost?.id;
  });

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Blog</h1>
          </div>
          <p className="text-white/80">Artigos, dicas e conteúdos para sua carreira</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-4 space-y-5">
        {/* Busca + filtros */}
        <Card className="rounded-2xl shadow">
          <CardContent className="p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar artigos..." className="pl-10 h-12 rounded-xl" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')} className={`rounded-full flex-shrink-0 ${selectedCategory === 'all' ? 'bg-[#1E6FB6]' : ''}`}>Todos</Button>
              {CATEGORIES.map(cat => (
                <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)} className={`rounded-full whitespace-nowrap flex-shrink-0 ${selectedCategory === cat ? 'bg-[#1E6FB6]' : ''}`}>{cat}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Post em destaque */}
        {featuredPost && selectedCategory === 'all' && !searchTerm && (
          <Link to={createPageUrl('BlogDetail') + `?id=${featuredPost.id}`}>
            <Card className="rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
              {featuredPost.cover_image ? (
                <div className="relative h-64 sm:h-80">
                  <img src={featuredPost.cover_image} alt={featuredPost.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 p-6 text-white">
                    <Badge className="bg-amber-500 text-white mb-3"><Star className="w-3 h-3 mr-1" />Destaque</Badge>
                    <h2 className="text-2xl font-bold mb-1 line-clamp-2">{featuredPost.title}</h2>
                    {featuredPost.subtitle && <p className="text-white/80 text-sm line-clamp-2 mb-2">{featuredPost.subtitle}</p>}
                    <div className="flex items-center gap-3 text-white/70 text-xs">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featuredPost.reading_time || 5} min</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{featuredPost.views_count || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] text-white">
                  <Badge className="bg-amber-500 text-white mb-3"><Star className="w-3 h-3 mr-1" />Destaque</Badge>
                  <h2 className="text-2xl font-bold mb-2">{featuredPost.title}</h2>
                  {featuredPost.subtitle && <p className="text-white/80">{featuredPost.subtitle}</p>}
                </div>
              )}
            </Card>
          </Link>
        )}

        {/* Grid de posts */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="rounded-2xl animate-pulse">
                <div className="h-40 bg-slate-200 rounded-t-2xl" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-600">Nenhum artigo encontrado</h3>
            <p className="text-slate-500 text-sm">Tente ajustar sua busca ou filtro</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filteredPosts.map(post => (
              <Link key={post.id} to={createPageUrl('BlogDetail') + `?id=${post.id}`}>
                <Card className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer">
                  {post.cover_image && (
                    <div className="h-40 overflow-hidden flex-shrink-0">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className="bg-[#1E6FB6] text-white text-xs">{post.category}</Badge>
                      {post.is_featured && <Badge className="bg-amber-100 text-amber-700 text-xs"><Star className="w-2.5 h-2.5 mr-0.5" />Destaque</Badge>}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 flex-1">{post.title}</h3>
                    {post.subtitle && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{post.subtitle}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.reading_time || 5} min</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views_count || 0}</span>
                      {post.published_at && <span>{format(new Date(post.published_at), "dd 'de' MMM", { locale: ptBR })}</span>}
                    </div>
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}