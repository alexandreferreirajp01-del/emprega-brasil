import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, Lock, CheckCircle, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import CreatePostForm from "@/components/community/CreatePostForm";
import PostCard from "@/components/community/PostCard";
import TrendingSection from "@/components/community/TrendingSection";
import LikesList from "@/components/community/LikesList";

export default function Community() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [toast, setToast] = useState(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedPostLikes, setSelectedPostLikes] = useState([]);
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

  const { data: jobs = [] } = useQuery({
    queryKey: ['community-jobs'],
    queryFn: async () => {
      try {
        return await base44.entities.Job.list('-created_date', 50) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: news = [] } = useQuery({
    queryKey: ['community-news'],
    queryFn: async () => {
      try {
        return await base44.entities.News.filter({ status: 'published' }, '-created_date', 10) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list('full_name', 500) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      showToast('Post enviado! Aguardando aprovação do administrador.');
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
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

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      showToast('Post excluído!');
    },
  });

  const canParticipate = user && (user.subscription_type === 'basic' || user.subscription_type === 'premium' || user.subscription_type === 'admin' || user.role === 'admin') && user.access_status === 'approved';

  const isAdmin = user?.email === 'alexandreferreirajp01@gmail.com' || user?.role === 'admin' || user?.subscription_type === 'admin';

  const handleSubmitPost = (postData) => {
    createPostMutation.mutate(postData);
  };

  const handleComment = (postId, content) => {
    createCommentMutation.mutate({
      post_id: postId,
      content,
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

  const handleDeletePost = (postId) => {
    if (confirm('Tem certeza que deseja excluir este post?')) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleShowLikes = (postId) => {
    const postLikes = likes.filter(l => l.post_id === postId);
    setSelectedPostLikes(postLikes);
    setShowLikesModal(true);
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-7 h-7 text-white" />
            <h1 className="text-2xl font-bold text-white">Comunidade</h1>
          </div>
          <p className="text-white/70">Conecte-se com outros profissionais, compartilhe experiências e oportunidades</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Login Required for Visitors */}
            {isVisitor && (
              <Card className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6 text-center">
                  <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-amber-800 mb-2">
                    Faça login para participar
                  </h3>
                  <p className="text-amber-700 mb-4">
                    Visitantes podem visualizar, mas precisam criar uma conta para postar, comentar e usar @menções.
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
              <Card className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h3 className="font-semibold text-lg text-blue-800 mb-2">
                    Acesso Pendente
                  </h3>
                  <p className="text-blue-700">
                    Seu cadastro está aguardando aprovação. Em breve você poderá participar!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Visitor type user */}
            {user && user.subscription_type === 'visitor' && user.access_status === 'approved' && (
              <Card className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
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
              <CreatePostForm 
                user={user}
                onSubmit={handleSubmitPost}
                isSubmitting={createPostMutation.isPending}
              />
            )}

            {/* Posts Feed */}
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <Card key={i} className="rounded-2xl animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/4" />
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-32 bg-slate-200 rounded mt-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-xl text-slate-600 mb-2">Nenhuma publicação ainda</h3>
                  <p className="text-slate-500">Seja o primeiro a compartilhar algo com a comunidade!</p>
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
                    <PostCard
                      post={post}
                      comments={comments}
                      likes={likes}
                      users={users}
                      currentUser={user}
                      onLike={handleLike}
                      onComment={handleComment}
                      onDelete={handleDeletePost}
                      onShowLikes={handleShowLikes}
                      isAdmin={isAdmin}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Trending */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <TrendingSection 
                posts={posts}
                jobs={jobs}
                news={news}
                likes={likes}
                comments={comments}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Likes Modal */}
      <LikesList 
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        likes={selectedPostLikes}
        users={users}
      />
    </div>
  );
}