import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Clock, Eye, Tag, Share2, Calendar, Heart, MessageCircle, Send, Trash2, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const PLAN_LABELS = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
  dono: { label: 'Dono', color: 'bg-purple-100 text-purple-700' },
  premium: { label: 'Premium', color: 'bg-amber-100 text-amber-700' },
  recruiter: { label: 'Recrutador', color: 'bg-blue-100 text-blue-700' },
  basic: { label: 'Básico', color: 'bg-slate-100 text-slate-600' },
};

function PlanBadge({ plan }) {
  const info = PLAN_LABELS[plan] || PLAN_LABELS.basic;
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>;
}

export default function BlogDetail() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Carregar usuário (sem redirecionar se não logado)
    base44.auth.me().then(u => setUser(u)).catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { window.location.href = createPageUrl('Blog'); return; }

    base44.entities.BlogPost.filter({ id }).then(results => {
      const found = results[0];
      if (!found) { window.location.href = createPageUrl('Blog'); return; }
      setPost(found);
      setLikesCount(found.likes_count || 0);

      // Verificar se já curtiu (via localStorage)
      const likedPosts = JSON.parse(localStorage.getItem('blog_liked') || '[]');
      setLiked(likedPosts.includes(found.id));

      // Incrementar views
      base44.entities.BlogPost.update(found.id, { views_count: (found.views_count || 0) + 1 }).catch(() => {});

      // Carregar comentários
      setCommentsLoading(true);
      base44.entities.BlogComment.filter({ post_id: found.id }, '-created_date', 200)
        .then(setComments).finally(() => setCommentsLoading(false));
    }).finally(() => setLoading(false));
  }, []);

  const handleLike = () => {
    if (!post) return;
    const likedPosts = JSON.parse(localStorage.getItem('blog_liked') || '[]');
    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    if (newLiked) {
      localStorage.setItem('blog_liked', JSON.stringify([...likedPosts, post.id]));
    } else {
      localStorage.setItem('blog_liked', JSON.stringify(likedPosts.filter(id => id !== post.id)));
    }

    setLiked(newLiked);
    setLikesCount(newCount);
    base44.entities.BlogPost.update(post.id, { likes_count: newCount }).catch(() => {});
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComment = async () => {
    if (!user) { toast.error('Faça login para comentar'); return; }
    if (!newComment.trim()) return;
    setSubmitting(true);
    const plan = user.subscription_type || (user.role === 'admin' ? 'admin' : 'basic');
    const comment = await base44.entities.BlogComment.create({
      post_id: post.id,
      author_email: user.email,
      author_name: user.full_name || user.email.split('@')[0],
      author_plan: plan,
      content: newComment.trim(),
    });
    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setSubmitting(false);
    toast.success('Comentário publicado!');
  };

  const deleteComment = async (commentId) => {
    await base44.entities.BlogComment.delete(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    toast.success('Comentário excluído');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
    </div>
  );

  if (!post) return null;

  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-4 -mt-12 relative z-10">
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
              {post.author_name && <span className="font-medium text-slate-700 dark:text-slate-300">{post.author_name}</span>}
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(post.published_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.reading_time || 5} min</span>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-4">
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{ wordBreak: 'break-word' }}
          />
        </div>

        {/* Barra de interação */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Curtidas */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-medium text-sm ${liked ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
              {likesCount}
            </button>

            {/* Views */}
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <Eye className="w-5 h-5" />
              {post.views_count || 0}
            </div>

            {/* Comentários */}
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <MessageCircle className="w-5 h-5" />
              {comments.length}
            </div>
          </div>

          {/* Compartilhar */}
          <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Compartilhar'}
          </Button>
        </div>

        {/* Seção de Comentários */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-6">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Comentários ({comments.length})
          </h2>

          {/* Caixa de novo comentário */}
          {user ? (
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1E6FB6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">{user.full_name || user.email.split('@')[0]}</span>
                    <PlanBadge plan={user.subscription_type || (user.role === 'admin' ? 'admin' : 'basic')} />
                  </div>
                  <Textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="min-h-[80px] resize-none text-sm rounded-xl"
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" disabled={!newComment.trim() || submitting} onClick={handleComment} className="bg-[#1E6FB6] hover:bg-[#0B2F5B] gap-1">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publicar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Faça login para comentar</p>
              <Link to={createPageUrl('Splash')}>
                <Button size="sm" className="bg-[#1E6FB6]">Entrar / Cadastrar</Button>
              </Link>
            </div>
          )}

          {/* Lista de comentários */}
          {commentsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : comments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Seja o primeiro a comentar!</p>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-sm flex-shrink-0">
                    {(comment.author_name || comment.author_email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 dark:text-white">{comment.author_name || comment.author_email.split('@')[0]}</span>
                        <PlanBadge plan={comment.author_plan || 'basic'} />
                        <span className="text-xs text-slate-400">
                          {format(new Date(comment.created_date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {(isAdmin || comment.author_email === user?.email) && (
                        <button onClick={() => deleteComment(comment.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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