import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Image, Send, X, Crown, Shield, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FeedPostCard from "@/components/feed/FeedPostCard";
import PremiumModal from "@/components/subscription/PremiumModal";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [novoPost, setNovoPost] = useState('');
  const [imagens, setImagens] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          // Não autenticado - redirecionar para planos
          window.location.href = createPageUrl('Subscription');
          return;
        }
        
        const u = await base44.auth.me();
        setUser(u);
        
        // Verificar acesso Premium
        const isPremium = u?.subscription_type === 'premium' || 
                         u?.subscription_type === 'admin' || 
                         u?.subscription_type === 'recruiter' ||
                         u?.role === 'admin';
        
        if (!isPremium) {
          // Básico - redirecionar para planos
          window.location.href = createPageUrl('Subscription');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        // Erro - redirecionar para planos
        window.location.href = createPageUrl('Subscription');
      }
    };
    init();
  }, []);

  // Verificar acesso Premium
  const hasPremium = user?.subscription_type === 'premium' || 
                     user?.subscription_type === 'admin' || 
                     user?.subscription_type === 'recruiter' ||
                     user?.role === 'admin';

  const { data: posts = [], isLoading: loadingPosts, refetch } = useQuery({
    queryKey: ['feed-posts'],
    queryFn: () => base44.entities.FeedPost.list('-created_date', 50),
    enabled: !!user && hasPremium
  });

  useEffect(() => {
    // Pull to refresh
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      touchEndY = e.touches[0].clientY;
      if (window.scrollY === 0 && touchEndY - touchStartY > 100) {
        setIsPulling(true);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && window.scrollY === 0) {
        refetch();
      }
      setIsPulling(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, refetch]);

  const { data: salvos = [] } = useQuery({
    queryKey: ['feed-salvos', user?.email],
    queryFn: () => base44.entities.FeedSalvo.filter({ user_email: user.email }),
    enabled: !!user?.email && hasPremium
  });

  const criarPostMutation = useMutation({
    mutationFn: async (data) => {
      const newPost = await base44.entities.FeedPost.create(data);
      
      // Notificar admins sobre novo post
      try {
        await base44.functions.invoke('notifyAdmins', {
          event_type: 'feed_post',
          data: {
            post_id: newPost.id,
            author_name: data.autor_nome,
            author_photo: data.autor_foto,
            content: data.conteudo || ''
          }
        });
      } catch (e) {
        console.warn('Erro ao notificar admins:', e);
      }
      
      return newPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      setNovoPost('');
      setImagens([]);
    }
  });

  const handleUploadImagem = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setImagens([...imagens, ...urls]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handlePublicar = () => {
    if (!novoPost.trim() && !imagens.length) return;
    criarPostMutation.mutate({
      autor_email: user.email,
      autor_nome: user.full_name || 'Usuário',
      autor_foto: user.profile_photo || '',
      autor_plano: user.subscription_type || 'basic',
      conteudo: novoPost,
      imagens: imagens,
      curtidas: [],
      total_curtidas: 0,
      total_comentarios: 0
    });
  };

  const removerImagem = (idx) => {
    setImagens(imagens.filter((_, i) => i !== idx));
  };

  const getPlanoLabel = (plano) => {
    const labels = {
      admin: 'Admin',
      recruiter: 'Recrutador',
      premium: 'Premium',
      basic: 'Básico'
    };
    return labels[plano] || 'Básico';
  };

  // Mostrar loading ou redirecionar
  if (loading || (user && !hasPremium)) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-6 pb-4 px-4 transition-colors">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Feed</h1>
          <p className="text-white/70 dark:text-slate-300 text-sm">Compartilhe e conecte-se</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Criar Post */}
        <Card className="rounded-xl dark:bg-slate-800 dark:border-slate-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profile_photo} />
                <AvatarFallback className="bg-[#1E6FB6]/10 dark:bg-blue-900/30 text-[#1E6FB6] dark:text-blue-400">
                  {user?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={novoPost}
                  onChange={(e) => setNovoPost(e.target.value)}
                  placeholder="O que você está pensando?"
                  className="rounded-lg resize-none min-h-[80px] dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400"
                />
                
                {imagens.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {imagens.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                        <button
                          onClick={() => removerImagem(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUploadImagem}
                    />
                    <Button type="button" variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" asChild>
                      <span>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Image className="w-4 h-4 mr-2" />}
                        Foto
                      </span>
                    </Button>
                  </label>
                  <Button
                    onClick={handlePublicar}
                    disabled={criarPostMutation.isPending || (!novoPost.trim() && !imagens.length)}
                    className="bg-[#1E6FB6] hover:bg-[#0B2F5B] rounded-lg"
                  >
                    {criarPostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Posts */}
        {loadingPosts ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E6FB6]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>Nenhuma publicação ainda.</p>
            <p className="text-sm">Seja o primeiro a publicar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                user={user}
                isSalvo={salvos.some(s => s.post_id === post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}