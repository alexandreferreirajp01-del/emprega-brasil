import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Bookmark, Share2, Send, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TimeAgo from "@/components/common/TimeAgo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function FeedPostCard({ post, user, isSalvo }) {
  const [showComentarios, setShowComentarios] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [imagemAtual, setImagemAtual] = useState(0);
  const queryClient = useQueryClient();

  const curtido = post.curtidas?.includes(user?.email);

  const { data: comentarios = [] } = useQuery({
    queryKey: ['comentarios', post.id],
    queryFn: () => base44.entities.FeedComentario.filter({ post_id: post.id }),
    enabled: showComentarios
  });

  const curtirMutation = useMutation({
    mutationFn: async () => {
      const novasCurtidas = curtido
        ? post.curtidas.filter(e => e !== user.email)
        : [...(post.curtidas || []), user.email];
      return base44.entities.FeedPost.update(post.id, {
        curtidas: novasCurtidas,
        total_curtidas: novasCurtidas.length
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-posts'] })
  });

  const comentarMutation = useMutation({
    mutationFn: (data) => base44.entities.FeedComentario.create(data),
    onSuccess: async () => {
      await base44.entities.FeedPost.update(post.id, {
        total_comentarios: (post.total_comentarios || 0) + 1
      });
      queryClient.invalidateQueries({ queryKey: ['comentarios', post.id] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      setNovoComentario('');
    }
  });

  const salvarMutation = useMutation({
    mutationFn: async () => {
      if (isSalvo) {
        const salvos = await base44.entities.FeedSalvo.filter({ user_email: user.email, post_id: post.id });
        if (salvos?.length > 0) {
          await base44.entities.FeedSalvo.delete(salvos[0].id);
        }
      } else {
        await base44.entities.FeedSalvo.create({ user_email: user.email, post_id: post.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-salvos'] })
  });

  const handleComentar = () => {
    if (!novoComentario.trim()) return;
    comentarMutation.mutate({
      post_id: post.id,
      autor_email: user.email,
      autor_nome: user.full_name || 'Usuário',
      autor_foto: user.profile_photo || '',
      conteudo: novoComentario
    });
  };

  const handleCompartilhar = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Vagas Abertas PB',
        text: post.conteudo?.substring(0, 100),
        url: window.location.href
      });
    }
  };

  const getPlanoColor = (plano) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      recruiter: 'bg-blue-100 text-blue-700',
      premium: 'bg-green-100 text-green-700',
      basic: 'bg-slate-100 text-slate-700'
    };
    return colors[plano] || 'bg-slate-100 text-slate-700';
  };

  const getPlanoLabel = (plano) => {
    const labels = { admin: 'Admin', recruiter: 'Recrutador', premium: 'Premium', basic: 'Básico' };
    return labels[plano] || 'Básico';
  };

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.autor_foto} />
            <AvatarFallback className="bg-purple-100 text-purple-700">
              {post.autor_nome?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{post.autor_nome}</span>
              <Badge className={`text-xs ${getPlanoColor(post.autor_plano)}`}>
                {getPlanoLabel(post.autor_plano)}
              </Badge>
            </div>
            <TimeAgo date={post.created_date} className="text-xs text-slate-500" />
          </div>
        </div>

        {post.conteudo && (
          <p className="px-4 pb-3 text-slate-700 whitespace-pre-wrap">{post.conteudo}</p>
        )}

        {post.imagens?.length > 0 && (
          <div className="relative">
            <img src={post.imagens[imagemAtual]} alt="" className="w-full max-h-96 object-cover" />
            {post.imagens.length > 1 && (
              <>
                <button
                  onClick={() => setImagemAtual(Math.max(0, imagemAtual - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
                  disabled={imagemAtual === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setImagemAtual(Math.min(post.imagens.length - 1, imagemAtual + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
                  disabled={imagemAtual === post.imagens.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {post.imagens.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i === imagemAtual ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 flex items-center gap-4 border-t">
          <button onClick={() => curtirMutation.mutate()} className={`flex items-center gap-1 ${curtido ? 'text-red-500' : 'text-slate-500'}`}>
            <Heart className={`w-5 h-5 ${curtido ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.total_curtidas || 0}</span>
          </button>
          <button onClick={() => setShowComentarios(!showComentarios)} className="flex items-center gap-1 text-slate-500">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.total_comentarios || 0}</span>
          </button>
          <button onClick={() => salvarMutation.mutate()} className={`flex items-center gap-1 ${isSalvo ? 'text-purple-500' : 'text-slate-500'}`}>
            <Bookmark className={`w-5 h-5 ${isSalvo ? 'fill-current' : ''}`} />
          </button>
          <button onClick={handleCompartilhar} className="text-slate-500 ml-auto">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {showComentarios && (
          <div className="px-4 pb-4 border-t pt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Escreva um comentário..."
                className="rounded-full"
                onKeyPress={(e) => e.key === 'Enter' && handleComentar()}
              />
              <Button
                onClick={handleComentar}
                disabled={!novoComentario.trim() || comentarMutation.isPending}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 rounded-full"
              >
                {comentarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comentarios.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={c.autor_foto} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">{c.autor_nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-slate-50 rounded-xl p-2">
                    <span className="font-semibold text-sm text-slate-800">{c.autor_nome}</span>
                    <p className="text-sm text-slate-700">{c.conteudo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}