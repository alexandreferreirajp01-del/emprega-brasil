import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, UserPlus, UserMinus, MessageCircle, Edit, 
  Loader2, Crown, Shield, Briefcase, User, MapPin, ExternalLink,
  Grid
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

import SocialPostCard from "@/components/social/SocialPostCard";

export default function SocialProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [processingFollow, setProcessingFollow] = useState(false);
  const [localFollowersCount, setLocalFollowersCount] = useState(0);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');

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

  const { data: profileUser } = useQuery({
    queryKey: ['profile-user', profileEmail],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: profileEmail });
      return users[0];
    },
    enabled: !!profileEmail
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', profileEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: profileEmail });
      return profiles[0];
    },
    enabled: !!profileEmail
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts', profileEmail],
    queryFn: () => base44.entities.SocialPost.filter({ author_email: profileEmail, status: 'active' }, '-created_date', 100),
    enabled: !!profileEmail
  });

  const { data: follows = [], refetch: refetchFollows } = useQuery({
    queryKey: ['profile-follows', profileEmail],
    queryFn: () => base44.entities.Follow.list('-created_date', 10000),
    enabled: !!profileEmail,
    staleTime: 5000
  });

  const followersCount = follows.filter(f => f.following_email === profileEmail).length;
  const followingCount = follows.filter(f => f.follower_email === profileEmail).length;

  // Atualizar estado local quando dados mudam
  useEffect(() => {
    setLocalFollowersCount(followersCount);
  }, [followersCount]);

  useEffect(() => {
    if (user && follows.length >= 0) {
      const myFollow = follows.find(f => f.follower_email === user.email && f.following_email === profileEmail);
      setIsFollowing(!!myFollow);
      setFollowId(myFollow?.id || null);
    }
  }, [user, follows, profileEmail]);

  // Função de seguir com atualização otimista
  const handleFollow = async () => {
    if (!user || processingFollow) return;
    
    setProcessingFollow(true);
    
    const wasFollowing = isFollowing;
    const existingFollowId = followId;

    // Atualização otimista
    setIsFollowing(!wasFollowing);
    setLocalFollowersCount(prev => wasFollowing ? Math.max(prev - 1, 0) : prev + 1);

    try {
      if (wasFollowing && existingFollowId) {
        await base44.entities.Follow.delete(existingFollowId);
        setFollowId(null);
      } else {
        const newFollow = await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: profileEmail
        });
        setFollowId(newFollow.id);
      }
      // Atualizar dados do servidor
      await refetchFollows();
      queryClient.invalidateQueries({ queryKey: ['all-follows'] });
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error);
      // Reverter em caso de erro
      setIsFollowing(wasFollowing);
      setLocalFollowersCount(followersCount);
      await refetchFollows();
    } finally {
      setProcessingFollow(false);
    }
  };

  const isOwnProfile = user?.email === profileEmail;

  const getPlanBadge = (u) => {
    if (u?.subscription_type === 'admin' || u?.role === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 border-0 text-sm px-3 py-1"><Shield className="w-3.5 h-3.5 mr-1.5" />Admin</Badge>;
    }
    if (u?.subscription_type === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-sm px-3 py-1"><Briefcase className="w-3.5 h-3.5 mr-1.5" />Recrutador</Badge>;
    }
    if (u?.subscription_type === 'premium') {
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-sm px-3 py-1"><Crown className="w-3.5 h-3.5 mr-1.5" />Premium</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 border-0 text-sm px-3 py-1"><User className="w-3.5 h-3.5 mr-1.5" />Básico</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-3 p-4">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-slate-800">{profileUser?.full_name || 'Perfil'}</h1>
        </div>
      </header>

      {/* Profile Card */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto p-6">
          {/* Avatar e Info Principal */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="w-28 h-28 ring-4 ring-[#0056ff]/10 mb-4">
              <AvatarImage src={profileUser?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white text-4xl font-semibold">
                {profileUser?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{profileUser?.full_name || 'Usuário'}</h2>
            
            <div className="mb-3">
              {getPlanBadge(profileUser)}
            </div>
            
            {userProfile?.bio && (
              <p className="text-slate-600 max-w-md mb-4 leading-relaxed">{userProfile.bio}</p>
            )}

            {/* Ocupação e Cidade */}
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-4 flex-wrap">
              {userProfile?.occupation && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {userProfile.occupation}
                </span>
              )}
              {userProfile?.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {userProfile.city}
                </span>
              )}
            </div>
          </div>

          {/* Stats - Grid organizado */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-2xl p-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{posts.length}</p>
              <p className="text-sm text-slate-500">Publicações</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <p className="text-2xl font-bold text-slate-800">{localFollowersCount}</p>
              <p className="text-sm text-slate-500">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{followingCount}</p>
              <p className="text-sm text-slate-500">Seguindo</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {isOwnProfile ? (
              <Link to={createPageUrl('EditProfile')}>
                <Button variant="outline" size="lg" className="rounded-xl px-6">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="lg"
                  onClick={handleFollow}
                  disabled={processingFollow}
                  className={`rounded-xl px-6 min-w-[140px] ${isFollowing ? "" : "bg-[#0056ff] hover:bg-[#0044cc]"}`}
                >
                  {processingFollow ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Seguir
                    </>
                  )}
                </Button>
                <Link to={`${createPageUrl('SocialChat')}?email=${profileEmail}`}>
                  <Button variant="outline" size="lg" className="rounded-xl px-6">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensagem
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Links Sociais */}
          {(userProfile?.linkedin_url || userProfile?.instagram_url || userProfile?.portfolio_url) && (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {userProfile.linkedin_url && (
                <a 
                  href={userProfile.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#0056ff] hover:underline text-sm flex items-center gap-1 bg-[#0056ff]/5 px-3 py-1.5 rounded-full"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              )}
              {userProfile.instagram_url && (
                <a 
                  href={userProfile.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#0056ff] hover:underline text-sm flex items-center gap-1 bg-[#0056ff]/5 px-3 py-1.5 rounded-full"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Instagram
                </a>
              )}
              {userProfile.portfolio_url && (
                <a 
                  href={userProfile.portfolio_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#0056ff] hover:underline text-sm flex items-center gap-1 bg-[#0056ff]/5 px-3 py-1.5 rounded-full"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Portfólio
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full h-12 bg-white rounded-none border-b grid grid-cols-1 gap-0 p-0">
            <TabsTrigger 
              value="posts" 
              className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#0056ff] data-[state=active]:text-[#0056ff]"
            >
              <Grid className="w-4 h-4 mr-2" />
              Publicações ({posts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0 p-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Grid className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p>Nenhuma publicação ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <SocialPostCard key={post.id} post={post} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}