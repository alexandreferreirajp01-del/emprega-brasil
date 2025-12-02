import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SocialPostCard from "./SocialPostCard";

export default function SocialFeed({ user, feedType = "all" }) {
  const { data: follows = [] } = useQuery({
    queryKey: ['my-follows-feed', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Buscar todos os follows e filtrar manualmente
      const listFollows = await base44.entities.Follow.list('-created_date', 1000);
      if (!listFollows || listFollows.length === 0) return [];
      
      // Filtrar quem o usuário segue (aceito ou pendente)
      const result = listFollows.filter(f => 
        f.follower_email === user.email && (f.status === 'accepted' || f.status === 'pending')
      );
      return result || [];
    },
    enabled: !!user && feedType === 'following',
    staleTime: 30000,
    gcTime: 120000,
    retry: 3,
    retryDelay: 500,
  });

  const followingEmails = follows.map(f => f.following_email);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['social-posts', feedType, user?.email],
    queryFn: async () => {
      const listPosts = await base44.entities.SocialPost.list('-created_date', 200);
      console.log('Posts carregados:', listPosts?.length || 0);
      if (!listPosts || listPosts.length === 0) return [];
      
      const allPosts = listPosts.filter(p => p.status === 'active' || !p.status);
      
      if (feedType === 'following' && followingEmails.length > 0) {
        return allPosts.filter(p => 
          followingEmails.includes(p.author_email) || p.author_email === user?.email
        );
      }
      return allPosts;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 60000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000),
  });

  const { data: allLikes = [] } = useQuery({
    queryKey: ['social-likes'],
    queryFn: async () => {
      const result = await base44.entities.SocialLike.list('-created_date', 1000);
      return result || [];
    },
    staleTime: 60000,
    gcTime: 300000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            {feedType === 'following' ? 'Seu feed está vazio' : 'Nenhuma publicação ainda'}
          </h3>
          <p className="text-slate-500">
            {feedType === 'following' 
              ? 'Siga outros profissionais para ver suas publicações aqui'
              : 'Seja o primeiro a publicar algo!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const postLikes = allLikes.filter(l => l.post_id === post.id);
        const userLiked = postLikes.some(l => l.user_email === user?.email);
        
        return (
          <SocialPostCard 
            key={post.id} 
            post={post} 
            user={user}
            likesCount={postLikes.length}
            userLiked={userLiked}
            onRefresh={refetch}
          />
        );
      })}
    </div>
  );
}