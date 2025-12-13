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
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const isMember = !user?.subscription_type || user?.subscription_type === 'member';
  const isBasic = user?.subscription_type === 'basic';
  const hasPremium = !isMember && !isBasic;

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['feed-posts'],
    queryFn: () => base44.entities.FeedPost.list('-created_date', 50),
    enabled: !!user
  });

  const { data: salvos = [] } = useQuery({
    queryKey: ['feed-salvos', user?.email],
    queryFn: () => base44.entities.FeedSalvo.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const criarPostMutation = useMutation({
    mutationFn: async (data) => {
      const newPost = await base44.entities.FeedPost.create(data);
      
      // Notificar admin/owner sobre novo post
      try {
        const allUsers = await base44.entities.User.list();
        const admins = allUsers.filter(u => u.role === 'admin' || u.subscription_type === 'admin');
        
        for (const admin of admins) {
          await base44.entities.Notification.create({
            user_email: admin.email,
            title: '📝 Novo post no Feed',
            message: `${data.autor_nome} publicou: "${data.conteudo?.substring(0, 50)}..."`,
            type: 'system',
            is_read: false
          });
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // Se é BÁSICO, redirecionar para checkout
  if (isBasic && !loading) {
    window.location.href = createPageUrl('Subscription');
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // Se é MEMBRO, mostrar bloqueio
  if (isMember && !loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] pb-20">
        <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-6 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
                <ArrowLeft className="w-5 h-5 mr-2" />Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Feed Social</h1>
            <p className="text-white/70 text-sm">Conecte-se com outros profissionais</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-[#0A66C2] to-[#004182] text-white overflow-hidden">
            <CardContent className="p-8 text-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
              <h2 className="font-bold text-3xl mb-3">Seja Premium</h2>
              <p className="text-white/80 text-lg mb-6">
                Acesso completo ao Feed Social para interagir com outros profissionais
              </p>
              <div className="text-4xl font-bold mb-6">
                R$ 29,90
                <span className="text-base font-normal text-white/70 block mt-1">pagamento único vitalício</span>
              </div>
              <Button 
                onClick={() => setShowPremiumModal(true)}
                className="bg-white text-[#0A66C2] hover:bg-white/90 rounded-xl h-14 px-8 text-lg font-bold"
              >
                Assinar Agora
              </Button>
              <div className="flex items-center justify-center gap-2 mt-6 text-white/70">
                <Shield className="w-5 h-5" />
                <span>Garantia de 7 dias</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          user={user}
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Feed</h1>
          <p className="text-white/70 text-sm">Compartilhe e conecte-se</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Criar Post */}
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profile_photo} />
                <AvatarFallback className="bg-[#0A66C2]/10 text-[#0A66C2]">
                  {user?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={novoPost}
                  onChange={(e) => setNovoPost(e.target.value)}
                  placeholder="O que você está pensando?"
                  className="rounded-lg resize-none min-h-[80px]"
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
                    <Button type="button" variant="ghost" size="sm" className="text-slate-500" asChild>
                      <span>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Image className="w-4 h-4 mr-2" />}
                        Foto
                      </span>
                    </Button>
                  </label>
                  <Button
                    onClick={handlePublicar}
                    disabled={criarPostMutation.isPending || (!novoPost.trim() && !imagens.length)}
                    className="bg-[#0A66C2] hover:bg-[#004182] rounded-lg"
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
            <Loader2 className="w-6 h-6 animate-spin text-[#0A66C2]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
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