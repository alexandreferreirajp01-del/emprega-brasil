import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import SocialPostCard from "./SocialPostCard";

// Função de fetch com retry robusto
async function fetchWithRetry(fetchFn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fetchFn();
      if (result && result.length >= 0) {
        return result;
      }
    } catch (error) {
      console.warn(`Tentativa ${attempt + 1} falhou:`, error.message);
    }
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }
  return [];
}

export default function SocialFeed({ user, feedType = "all" }) {
  const [follows, setFollows] = useState([]);
  const [posts, setPosts] = useState([]);
  const [allLikes, setAllLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const followingEmails = follows.map(f => f.following_email);

  // Carregar follows
  useEffect(() => {
    if (!user || feedType !== 'following') return;
    
    const loadFollows = async () => {
      const result = await fetchWithRetry(() => 
        base44.entities.Follow.list('-created_date', 1000)
      );
      const filtered = result.filter(f => 
        f.follower_email === user.email && (f.status === 'accepted' || f.status === 'pending')
      );
      setFollows(filtered);
    };
    
    loadFollows();
  }, [user, feedType]);

  // Carregar posts
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    
    const loadPosts = async () => {
      setIsLoading(true);
      
      const listPosts = await fetchWithRetry(() => 
        base44.entities.SocialPost.list('-created_date', 200)
      );
      
      if (!isMounted) return;
      
      const activePosts = listPosts.filter(p => p.status === 'active' || !p.status);
      
      if (feedType === 'following' && followingEmails.length > 0) {
        setPosts(activePosts.filter(p => 
          followingEmails.includes(p.author_email) || p.author_email === user?.email
        ));
      } else {
        setPosts(activePosts);
      }
      
      setIsLoading(false);
    };
    
    loadPosts();
    
    return () => { isMounted = false; };
  }, [user, feedType, followingEmails.join(','), refreshKey]);

  // Carregar likes
  useEffect(() => {
    const loadLikes = async () => {
      const result = await fetchWithRetry(() => 
        base44.entities.SocialLike.list('-created_date', 1000)
      );
      setAllLikes(result);
    };
    loadLikes();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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