import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Loader2, Bookmark } from "lucide-react";
import { base44 } from "@/api/base44Client";

import SocialPostCard from "./SocialPostCard";

export default function SocialSaved({ user }) {
  const { data: saves = [], isLoading: loadingSaves } = useQuery({
    queryKey: ['my-saves', user?.email],
    queryFn: () => base44.entities.SocialSave.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: allPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['all-posts-for-saves'],
    queryFn: () => base44.entities.SocialPost.filter({ status: 'active' }, '-created_date', 500),
  });

  const savedPosts = allPosts.filter(post => saves.some(s => s.post_id === post.id));

  if (loadingSaves || loadingPosts) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Nenhuma publicação salva.</p>
        <p className="text-sm text-slate-400 mt-1">Salve publicações para ver depois</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-semibold text-slate-700">Publicações Salvas ({savedPosts.length})</h2>
      {savedPosts.map(post => (
        <SocialPostCard key={post.id} post={post} user={user} />
      ))}
    </div>
  );
}