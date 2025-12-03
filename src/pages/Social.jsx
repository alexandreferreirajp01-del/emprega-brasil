import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, Search, PlusSquare, Heart, User, Loader2, Lock, Crown,
  Send, RefreshCw
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
  const [activeTab, setActiveTab] = useState('feed');
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Social Vagas Abertas</h1>
        <p className="text-slate-500 text-center mb-6">
          Escolha um plano para acessar a rede social
        </p>
        <Link to={createPageUrl('Subscription')}>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-8">
            <Crown className="w-5 h-5 mr-2" />
            Ver Planos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Social
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to={createPageUrl('DirectMessages')}>
              <Button variant="ghost" size="icon">
                <Send className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stories-like bar */}
      <div className="border-b bg-white">
        <div className="max-w-lg mx-auto px-4 py-3 overflow-x-auto">
          <div className="flex gap-4">
            <button 
              onClick={() => setShowCreatePost(true)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <PlusSquare className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-xs text-slate-500">Publicar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto">
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-600 mb-2">Nenhuma publicação</h3>
            <p className="text-slate-500 text-sm mb-4">Seja o primeiro a compartilhar algo!</p>
            <Button 
              onClick={() => setShowCreatePost(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full"
            >
              <PlusSquare className="w-4 h-4 mr-2" />
              Criar publicação
            </Button>
          </div>
        ) : (
          <div className="divide-y">
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around h-14">
          <button 
            onClick={() => setActiveTab('feed')}
            className={activeTab === 'feed' ? 'text-black' : 'text-slate-400'}
          >
            <Home className="w-6 h-6" />
          </button>
          <Link to={createPageUrl('ExploreUsers')}>
            <Search className="w-6 h-6 text-slate-400" />
          </Link>
          <button onClick={() => setShowCreatePost(true)}>
            <PlusSquare className="w-6 h-6 text-slate-400" />
          </button>
          <Link to={createPageUrl('Notifications')}>
            <Heart className="w-6 h-6 text-slate-400" />
          </Link>
          <Link to={`${createPageUrl('SocialProfile')}?email=${user.email}`}>
            <Avatar className="w-7 h-7 ring-1 ring-slate-200">
              <AvatarImage src={user.profile_photo} />
              <AvatarFallback className="bg-slate-200 text-xs">
                {user.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </nav>

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