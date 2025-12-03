import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Search, Plus, Bell, Loader2, Lock, Crown,
  MessageCircle, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PostCard from "@/components/social/PostCard";
import CreatePostSheet from "@/components/social/CreatePostSheet";
import CommentsSheet from "@/components/social/CommentsSheet";
import LikesSheet from "@/components/social/LikesSheet";

export default function Social() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
    if (visitorMode === 'true') {
      setLoading(false);
      return;
    }
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadData();
    } catch (e) {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [postsData, usersData] = await Promise.all([
        base44.entities.SocialPost.filter({ status: 'active' }, '-created_date', 50),
        base44.entities.User.list('-created_date', 500)
      ]);
      setPosts(postsData || []);
      setAllUsers(usersData || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Check access
  const canAccess = user && user.subscription_type !== 'visitor';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-[#0056ff] rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Social Vagas Abertas</h1>
        <p className="text-slate-500 text-center mb-6">
          Escolha um plano para acessar a rede social
        </p>
        <Link to={createPageUrl('Subscription')}>
          <Button className="bg-[#0056ff] hover:bg-[#0044cc] text-white rounded-xl px-8">
            <Crown className="w-5 h-5 mr-2" />
            Ver Planos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Social</h1>
              <p className="text-white/70 text-sm">Conecte-se com profissionais</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-white hover:bg-white/10 rounded-xl"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Link to={createPageUrl('DirectMessages')}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowCreatePost(true)}
              className="bg-white text-[#0056ff] hover:bg-white/90 rounded-xl flex-1"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Publicação
            </Button>
            <Link to={createPageUrl('ExploreUsers')} className="flex-1">
              <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl">
                <Users className="w-5 h-5 mr-2" />
                Explorar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">Nenhuma publicação</h3>
            <p className="text-slate-500 text-sm mb-4">Seja o primeiro a compartilhar algo!</p>
            <Button 
              onClick={() => setShowCreatePost(true)}
              className="bg-[#0056ff] hover:bg-[#0044cc] text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar publicação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard 
                key={post.id}
                post={post}
                user={user}
                allUsers={allUsers}
                onRefresh={handleRefresh}
                onCommentClick={(p) => {
                  setSelectedPost(p);
                  setShowComments(true);
                }}
                onLikesClick={(p) => {
                  setSelectedPost(p);
                  setShowLikes(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sheets */}
      <CreatePostSheet 
        user={user}
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={handleRefresh}
      />

      <CommentsSheet
        post={selectedPost}
        user={user}
        isOpen={showComments}
        onClose={() => {
          setShowComments(false);
          setSelectedPost(null);
        }}
      />

      <LikesSheet
        post={selectedPost}
        user={user}
        allUsers={allUsers}
        isOpen={showLikes}
        onClose={() => {
          setShowLikes(false);
          setSelectedPost(null);
        }}
      />
    </div>
  );
}