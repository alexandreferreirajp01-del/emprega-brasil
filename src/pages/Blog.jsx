import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Eye, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'Agora';
  if (diff < 60) return `Há ${diff} minuto${diff > 1 ? 's' : ''}`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `Há ${h} hora${h > 1 ? 's' : ''}`;
  const d = Math.floor(h / 24);
  return `Há ${d} dia${d > 1 ? 's' : ''}`;
}

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_at', 100),
    staleTime: 60000,
  });

  const CATEGORIES = ['Todos', 'Geral', 'Dicas', 'Mercado de Trabalho', 'Tecnologia', 'Carreira', 'Educação', 'Empreendedorismo', 'Lifestyle'];

  const filtered = posts.filter(p => {
    const matchSearch = !searchTerm || p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = activeCategory === 'Todos' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const featuredPost = filtered.find(p => p.is_featured) || filtered[0];
  const secondaryPosts = filtered.filter(p => p.id !== featuredPost?.id).slice(0, 3);
  const feedPosts = filtered.filter(p => p.id !== featuredPost?.id && !secondaryPosts.find(s => s.id === p.id));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-24">

      {/* Top bar azul - estilo G1 */}
      <div className="bg-[#1D4371] px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wide">Blog</span>
          </div>
          {/* Barra de busca */}
          <div className="relative max-w-xs w-full hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar artigos..."
              className="pl-9 h-8 text-sm rounded-full bg-white border-0"
            />
          </div>
        </div>
      </div>

      {/* Barra de categorias - estilo menu do G1 */}
      <div className="bg-[#0F2744] text-white overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-0 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                activeCategory === cat
                  ? 'border-[#2B5A8F] text-[#5A9FE0]'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Busca mobile */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar artigos..." className="pl-9 h-9 text-sm rounded-full" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-36 h-24 bg-slate-200 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-600 dark:text-slate-300">Nenhum artigo encontrado</h3>
            <p className="text-slate-500 text-sm">Tente ajustar sua busca ou categoria</p>
          </div>
        ) : (
          <>
            {/* Bloco principal - estilo G1: destaque grande + lista à direita */}
            {featuredPost && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-slate-200 dark:border-slate-700 mb-0">
                {/* Post destaque grande */}
                <Link to={createPageUrl('BlogDetail') + `?id=${featuredPost.id}`} className="lg:col-span-2 block group border-r border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    {featuredPost.cover_image ? (
                      <img src={featuredPost.cover_image} alt={featuredPost.title} className="w-full h-64 lg:h-80 object-cover group-hover:opacity-95 transition-opacity" />
                    ) : (
                      <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-[#1D4371] to-[#0F2744] flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800">
                    <span className="text-xs font-bold text-[#1D4371] dark:text-blue-400 uppercase tracking-wider">{featuredPost.category}</span>
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-2 group-hover:text-[#1D4371] dark:group-hover:text-blue-400 transition-colors leading-snug">{featuredPost.title}</h2>
                    {featuredPost.subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-3">{featuredPost.subtitle}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{timeAgo(featuredPost.published_at)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featuredPost.reading_time || 5} min</span>
                      {featuredPost.author_name && <span>{featuredPost.author_name}</span>}
                    </div>
                  </div>
                </Link>

                {/* Lista lateral - 3 posts secundários */}
                <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {secondaryPosts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-sm">Sem mais posts</div>
                  ) : secondaryPosts.map(post => (
                    <Link key={post.id} to={createPageUrl('BlogDetail') + `?id=${post.id}`} className="flex gap-3 p-3 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} className="w-24 h-16 object-cover flex-shrink-0 rounded" />
                      ) : (
                        <div className="w-24 h-16 flex-shrink-0 rounded bg-gradient-to-br from-[#1D4371]/20 to-[#0F2744]/20 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-[#1D4371]/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#1D4371] dark:text-blue-400 uppercase tracking-wider">{post.category}</span>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-3 group-hover:text-[#1D4371] dark:group-hover:text-blue-400 transition-colors leading-snug mt-0.5">{post.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{timeAgo(post.published_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Divisor de seção */}
            {feedPosts.length > 0 && (
              <div className="mt-8 mb-4 border-b-2 border-[#1D4371] pb-1">
                <span className="text-sm font-bold text-[#1D4371] uppercase tracking-wider">Mais artigos</span>
              </div>
            )}

            {/* Feed de posts - estilo lista G1 com linha separadora */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {feedPosts.map(post => (
                <Link key={post.id} to={createPageUrl('BlogDetail') + `?id=${post.id}`} className="flex gap-4 py-4 group hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded transition-colors">
                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#1D4371] dark:text-blue-400 uppercase tracking-wider">{post.category}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1D4371] dark:group-hover:text-blue-400 transition-colors leading-snug mt-0.5 line-clamp-2">{post.title}</h3>
                    {post.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{post.subtitle}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span>{timeAgo(post.published_at)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.reading_time || 5} min</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views_count || 0}</span>
                    </div>
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Thumbnail */}
                  {post.cover_image ? (
                    <img src={post.cover_image} alt={post.title} className="w-32 h-20 sm:w-40 sm:h-24 object-cover flex-shrink-0 rounded" />
                  ) : (
                    <div className="w-32 h-20 sm:w-40 sm:h-24 flex-shrink-0 rounded bg-gradient-to-br from-[#1D4371]/10 to-[#0F2744]/10 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-[#1D4371]/30" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}