import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

import SocialPostCard from "@/components/social/SocialPostCard";

export default function SocialPost() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ['single-post', postId],
    queryFn: async () => {
      const posts = await base44.entities.SocialPost.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId
  });

  if (loading || loadingPost) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="flex items-center gap-3 p-4">
            <Link to={createPageUrl('Social')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-slate-800">Publicação</h1>
          </div>
        </header>
        <div className="text-center py-12 text-slate-500">
          <p>Publicação não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-3 p-4">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-slate-800">Publicação</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <SocialPostCard post={post} user={user} />
      </div>
    </div>
  );
}