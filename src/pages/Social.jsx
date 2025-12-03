import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PenSquare, Loader2, Lock, Crown,
  MessageSquare, RefreshCw, Briefcase
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SocialFeed from "@/components/social/SocialFeed";
import CreatePostModal from "@/components/social/CreatePostModal";

export default function Social() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
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
      loadData(currentUser);
    } catch (e) {
      setLoading(false);
    }
  };

  const loadData = async (currentUser) => {
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
    if (user) await loadData(user);
    setIsRefreshing(false);
  };

  // Check access - Basic, Premium, Recruiter, Admin
  const canAccess = user && user.subscription_type !== 'visitor';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-[#0056ff] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Rede Social Profissional</h1>
          <p className="text-slate-500 mb-6">
            Conecte-se com outros profissionais, compartilhe experiências e amplie sua rede.
          </p>
          <Link to={createPageUrl('Subscription')}>
            <Button className="bg-[#0056ff] hover:bg-[#0044cc] text-white rounded-xl px-8 w-full">
              <Crown className="w-5 h-5 mr-2" />
              Escolher um Plano
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">Social</h1>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-xl"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Link to={createPageUrl('DirectMessages')}>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Sidebar - Quick Links */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link to={createPageUrl('DirectMessages')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <MessageSquare className="w-5 h-5 text-[#0056ff]" />
                  <span className="text-sm font-medium text-slate-700">Mensagens</span>
                </Link>
                <Link to={createPageUrl('Jobs')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <Briefcase className="w-5 h-5 text-[#0056ff]" />
                  <span className="text-sm font-medium text-slate-700">Ver Vagas</span>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create Post Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.profile_photo} />
                    <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                      {user.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 text-left px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                  >
                    Compartilhe uma atualização...
                  </button>
                </div>
                <div className="flex items-center justify-around mt-4 pt-3 border-t">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <PenSquare className="w-5 h-5 mr-2 text-[#0056ff]" />
                    Publicar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feed */}
            <SocialFeed 
              posts={posts}
              user={user}
              allUsers={allUsers}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        user={user}
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}