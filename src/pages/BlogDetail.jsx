import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Clock, Eye, Tag, Share2, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BlogDetail() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { window.location.href = createPageUrl('Blog'); return; }

    base44.entities.BlogPost.filter({ id }).then(results => {
      const found = results[0];
      if (!found) { window.location.href = createPageUrl('Blog'); return; }
      setPost(found);
      // Incrementar views
      base44.entities.BlogPost.update(found.id, { views_count: (found.views_count || 0) + 1 }).catch(() => {});
    }).finally(() => setLoading(false));
  }, []);

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
    </div>
  );

  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-24">
      {/* Capa */}
      {post.cover_image && (
        <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-4 left-4">
            <Link to={createPageUrl('Blog')}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1">
                <ArrowLeft className="w-4 h-4" /> Blog
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!post.cover_image && (
          <Link to={createPageUrl('Blog')}>
            <Button variant="ghost" size="sm" className="mb-4 gap-1 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Blog
            </Button>
          </Link>
        )}

        {/* Header do post */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 -mt-12 relative z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className="bg-[#1E6FB6] text-white">{post.category}</Badge>
            {post.tags?.map(tag => (
              <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">{post.title}</h1>
          {post.subtitle && <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">{post.subtitle}</p>}

          <div className="flex items-center justify-between gap-4 flex-wrap pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
              {post.author_name && (
                <span className="font-medium text-slate-700 dark:text-slate-300">{post.author_name}</span>
              )}
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(post.published_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.reading_time || 5} min de leitura</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.views_count || 0} leituras</span>
            </div>
            <Button variant="outline" size="sm" onClick={share} className="gap-1">
              <Share2 className="w-4 h-4" /> Compartilhar
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-6">
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{ wordBreak: 'break-word' }}
          />
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link to={createPageUrl('Blog')}>
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Ver todos os artigos
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        .prose h1 { font-size: 2em; font-weight: 800; margin: 1em 0 0.5em; }
        .prose h2 { font-size: 1.5em; font-weight: 700; margin: 1em 0 0.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.25em; }
        .prose h3 { font-size: 1.2em; font-weight: 600; margin: 0.75em 0 0.4em; }
        .prose a { color: #0A66C2; text-decoration: underline; }
        .prose a:hover { color: #004182; }
        .prose blockquote { border-left: 4px solid #0A66C2; padding-left: 1rem; color: #475569; font-style: italic; margin: 1.5em 0; background: #f0f7ff; border-radius: 0 8px 8px 0; padding: 1rem 1rem 1rem 1.5rem; }
        .prose pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        .prose code { background: #f1f5f9; color: #0f172a; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
        .prose ul { list-style: disc; padding-left: 1.5em; margin: 1em 0; }
        .prose ol { list-style: decimal; padding-left: 1.5em; margin: 1em 0; }
        .prose li { margin: 0.3em 0; }
        .prose img { max-width: 100%; border-radius: 8px; margin: 1em auto; display: block; }
        .prose table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        .prose td, .prose th { border: 1px solid #cbd5e1; padding: 8px 12px; }
        .prose th { background: #f8fafc; font-weight: 600; }
        .prose figure { margin: 1em 0; text-align: center; }
        .prose figcaption { font-size: 0.85em; color: #64748b; margin-top: 4px; }
        .dark .prose blockquote { background: #1e3a5f; color: #94a3b8; }
        .dark .prose code { background: #334155; color: #e2e8f0; }
        .dark .prose th { background: #334155; }
      `}</style>
    </div>
  );
}