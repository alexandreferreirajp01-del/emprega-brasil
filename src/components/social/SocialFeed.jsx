import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SocialPostCard from "./SocialPostCard";

export default function SocialFeed({ user, feedType = "all" }) {
  const { data: follows = [] } = useQuery({
    queryKey: ['my-follows', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Follow.filter({ follower_email: user.email }) || [];
    },
    enabled: !!user && feedType === 'following',
  });

  const followingEmails = follows.map(f => f.following_email);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['social-posts', feedType, user?.email],
    queryFn: async () => {
      const allPosts = await base44.entities.SocialPost.filter({ status: 'active' }, '-created_date', 100) || [];
      
      if (feedType === 'following' && followingEmails.length > 0) {
        return allPosts.filter(p => 
          followingEmails.includes(p.author_email) || p.author_email === user?.email
        );
      }
      return allPosts;
    },
    enabled: !!user,
  });

  const { data: allLikes = [] } = useQuery({
    queryKey: ['social-likes'],
    queryFn: async () => await base44.entities.SocialLike.list('-created_date', 1000) || [],
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