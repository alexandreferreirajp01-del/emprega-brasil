import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, MessageCircle, Send, Image, Loader2, Lock, X, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Community() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: async () => {
      try {
        const allPosts = await base44.entities.Post.filter({ status: 'approved' }, '-created_date', 100);
        return allPosts || [];
      } catch (e) {
        console.error('Erro ao carregar posts:', e);
        return [];
      }
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments'],
    queryFn: async () => {
      try {
        return await base44.entities.Comment.filter({ status: 'approved' }, '-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar comentários:', e);
        return [];
      }
    },
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['likes'],
    queryFn: async () => {
      try {
        return await base44.entities.Like.list() || [];
      } catch (e) {
        console.error('Erro ao carregar likes:', e);
        return [];
      }
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPost('');
      showToast('Post enviado! Aguardando aprovação do administrador.');
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setNewComment({ ...newComment, [variables.post_id]: '' });
      showToast('Comentário enviado! Aguardando aprovação.');
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, userEmail }) => {
      const existingLike = likes.find(l => l.post_id === postId && l.user_email === userEmail);
      if (existingLike) {
        await base44.entities.Like.delete(existingLike.id);
      } else {
        await base44.entities.Like.create({ post_id: postId, user_email: userEmail });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] });
    },
  });

  const canParticipate = user && (user.subscription_type === 'basic' || user.subscription_type === 'premium' || user.subscription_type === 'admin' || user.role === 'admin') && user.access_status === 'approved';

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    createPostMutation.mutate({
      content: newPost,
      author_name: user?.full_name || 'Usuário',
      author_email: user?.email,
      author_photo: user?.profile_photo,
      status: 'pending',
      likes_count: 0,
      comments_count: 0
    });
  };

  const handleSubmitComment = (postId) => {
    if (!newComment[postId]?.trim()) return;

    createCommentMutation.mutate({
      post_id: postId,
      content: newComment[postId],
      author_name: user?.full_name || 'Usuário',
      author_email: user?.email,
      author_photo: user?.profile_photo,
      status: 'pending'
    });
  };

  const handleLike = (postId) => {
    if (!user) return;
    toggleLikeMutation.mutate({ postId, userEmail: user.email });
  };

  const getPostComments = (postId) => {
    return comments.filter(c => c.post_id === postId);
  };

  const getPostLikes = (postId) => {
    return likes.filter(l => l.post_id === postId).length;
  };

  const hasLiked = (postId) => {
    return likes.some(l => l.post_id === postId && l.user_email === user?.email);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl bg-gradient-to-r from-[#0056ff] to-[#0044cc] text-white"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Comunidade</h1>
          <p className="text-white/70">Vagas Abertas Paraíba - Conecte-se com outros profissionais</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Login Required for Visitors */}
        {isVisitor && (
          <Card className="mb-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6 text-center">
              <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-amber-800 mb-2">
                Faça login para participar
              </h3>
              <p className="text-amber-700 mb-4">
                Visitantes podem visualizar a comunidade, mas precisam criar uma conta para postar e comentar.
              </p>
              <Link to={createPageUrl('Splash')}>
                <Button className="bg-[#0056ff] hover:bg-[#0044cc]">
                  Fazer Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pending Access */}
        {user && user.access_status === 'pending' && (
          <Card className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="font-semibold text-lg text-blue-800 mb-2">
                Acesso Pendente
              </h3>
              <p className="text-blue-700">
                Seu cadastro está aguardando aprovação do administrador. Em breve você poderá participar!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Basic Members - need upgrade for premium */}
        {user && user.subscription_type === 'visitor' && user.access_status === 'approved' && (
          <Card className="mb-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <Lock className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-purple-800 mb-2">
                Torne-se um Membro
              </h3>
              <p className="text-purple-700 mb-4">
                Assine um plano para participar da comunidade e ter acesso a recursos exclusivos.
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button className="bg-[#0056ff] hover:bg-[#0044cc]">
                  Ver Planos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* New Post Form */}
        {canParticipate && (
          <Card className="mb-6 rounded-2xl shadow-lg">
            <CardContent className="p-4">
              <form onSubmit={handleSubmitPost}>
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.profile_photo} />
                    <AvatarFallback className="bg-[#0056ff] text-white">
                      {user?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Compartilhe algo com a comunidade..."
                      className="min-h-[80px] rounded-xl border-slate-200 resize-none"
                    />
                    <div className="flex justify-end mt-3">
                      <Button 
                        type="submit"
                        disabled={!newPost.trim() || createPostMutation.isPending}
                        className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                      >
                        {createPostMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Publicar
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i} className="rounded-2xl animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-600 mb-2">Nenhuma publicação ainda</h3>
              <p className="text-slate-500">Seja o primeiro a compartilhar algo!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {post.author_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{post.author_name}</p>
                        <p className="text-sm text-slate-500">{formatDate(post.created_date)}</p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-slate-700 whitespace-pre-line mb-4">{post.content}</p>

                    {post.image_url && (
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="rounded-xl mb-4 w-full object-cover max-h-96"
                      />
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-3 border-t">
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={!user || isVisitor}
                        className={`flex items-center gap-2 ${
                          hasLiked(post.id) ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
                        } transition-colors`}
                      >
                        <Heart className={`w-5 h-5 ${hasLiked(post.id) ? 'fill-current' : ''}`} />
                        <span className="text-sm">{getPostLikes(post.id)}</span>
                      </button>
                      <button
                        onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#0056ff] transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{getPostComments(post.id).length}</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {showComments[post.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t space-y-3"
                        >
                          {/* Comment Input */}
                          {canParticipate && (
                            <div className="flex gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user?.profile_photo} />
                                <AvatarFallback className="bg-[#0056ff] text-white text-xs">
                                  {user?.full_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={newComment[post.id] || ''}
                                  onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                                  placeholder="Escreva um comentário..."
                                  className="flex-1 px-4 py-2 rounded-full bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056ff]"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={!newComment[post.id]?.trim()}
                                  className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-9 w-9 p-0"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Comments List */}
                          {getPostComments(post.id).map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.author_photo} />
                                <AvatarFallback className="bg-slate-300 text-slate-600 text-xs">
                                  {comment.author_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2">
                                <p className="font-medium text-sm text-slate-800">{comment.author_name}</p>
                                <p className="text-sm text-slate-600">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}