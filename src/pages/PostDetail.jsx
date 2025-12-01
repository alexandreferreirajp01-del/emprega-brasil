import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Heart, MessageCircle, Share2, Loader2,
  Briefcase, ExternalLink, Trophy
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommentsSection from "@/components/social/CommentsSection";
import SharePostDialog from "@/components/social/SharePostDialog";
import PlanBadge from "@/components/social/PlanBadge";

export default function PostDetail() {
  const [user, setUser] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    checkAuth();
  }, []);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post-detail', postId],
    queryFn: async () => {
      const posts = await base44.entities.SocialPost.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId,
  });

  const { data: authorUser } = useQuery({
    queryKey: ['user-data', post?.author_email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: post.author_email });
      return users[0];
    },
    enabled: !!post?.author_email,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['post-likes', postId],
    queryFn: async () => await base44.entities.SocialLike.filter({ post_id: postId }) || [],
    enabled: !!postId,
    refetchInterval: 5000,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => await base44.entities.SocialComment.filter({ post_id: postId, status: 'active' }) || [],
    enabled: !!postId,
    refetchInterval: 5000,
  });

  const userLiked = likes.some(l => l.user_email === user?.email);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (userLiked) {
        const like = likes.find(l => l.user_email === user.email);
        if (like) await base44.entities.SocialLike.delete(like.id);
      } else {
        await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes', postId] });
    },
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600">Publicação não encontrada</h2>
          <Link to={createPageUrl('Social')}>
            <Button className="mt-4">Voltar para Social</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Publicação</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="p-4">
            {/* Author Header */}
            <Link to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`} className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white">
                  {post.author_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{post.author_name || 'Usuário'}</p>
                  <PlanBadge user={authorUser} />
                </div>
                <p className="text-sm text-slate-500">{post.author_occupation || 'Profissional'}</p>
              </div>
            </Link>

            {/* Content */}
            <div className="mb-4">
              {post.post_type === 'achievement' && (
                <Badge className="bg-yellow-100 text-yellow-700 mb-2">
                  <Trophy className="w-3 h-3 mr-1" />
                  Conquista
                </Badge>
              )}
              
              <p className="text-slate-700 whitespace-pre-line text-lg">{post.content}</p>
              
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="" 
                  className="mt-4 rounded-xl w-full object-cover"
                />
              )}
              
              {post.video_url && (
                <div className="mt-4 rounded-xl overflow-hidden">
                  <iframe 
                    src={post.video_url.replace('watch?v=', 'embed/')} 
                    className="w-full h-80"
                    allowFullScreen
                  />
                </div>
              )}
              
              {post.link_url && (
                <a 
                  href={post.link_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100"
                >
                  <ExternalLink className="w-4 h-4 text-[#0056ff]" />
                  <span className="text-sm text-[#0056ff] truncate">{post.link_url}</span>
                </a>
              )}
              
              {post.post_type === 'job_share' && post.shared_job_id && (
                <Link to={`${createPageUrl('JobDetail')}?id=${post.shared_job_id}`}>
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100">
                    <div className="flex items-center gap-2 text-[#0056ff]">
                      <Briefcase className="w-4 h-4" />
                      <span className="font-medium">Ver vaga compartilhada</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Date */}
            <p className="text-sm text-slate-400 mb-4">{formatDate(post.created_date)}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 py-3 border-t border-b text-sm text-slate-600">
              <span><strong>{likes.length}</strong> curtida{likes.length !== 1 ? 's' : ''}</span>
              <span><strong>{comments.length}</strong> comentário{comments.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 py-3">
              <Button
                variant="ghost"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className={`flex-1 rounded-xl ${userLiked ? 'text-red-500' : 'text-slate-600'}`}
              >
                <Heart className={`w-5 h-5 mr-2 ${userLiked ? 'fill-current' : ''}`} />
                Curtir
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowShare(true)}
                className="flex-1 rounded-xl text-slate-600"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* Comments Section - Always visible */}
            <CommentsSection post={post} user={user} />
          </CardContent>
        </Card>
      </div>

      <SharePostDialog open={showShare} onOpenChange={setShowShare} post={post} />
    </div>
  );
}