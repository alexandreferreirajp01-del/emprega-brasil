import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, UserPlus, UserMinus, MessageCircle, Edit, 
  Loader2, Crown, Shield, Briefcase, User, MapPin, Link as LinkIcon,
  Grid, Users
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

  const { data: follows = [] } = useQuery({
    queryKey: ['profile-follows', profileEmail],
    queryFn: () => base44.entities.Follow.list('-created_date', 10000),
    enabled: !!profileEmail
  });

  const followersCount = follows.filter(f => f.following_email === profileEmail).length;
  const followingCount = follows.filter(f => f.follower_email === profileEmail).length;

  useEffect(() => {
    if (user && follows.length > 0) {
      const myFollow = follows.find(f => f.follower_email === user.email && f.following_email === profileEmail);
      setIsFollowing(!!myFollow);
      setFollowId(myFollow?.id || null);
    }
  }, [user, follows, profileEmail]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing && followId) {
        await base44.entities.Follow.delete(followId);
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: profileEmail
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-follows'] });
    }
  });

  const isOwnProfile = user?.email === profileEmail;

  const getPlanBadge = (u) => {
    if (u?.subscription_type === 'admin' || u?.role === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 border-0"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    if (u?.subscription_type === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700 border-0"><Briefcase className="w-3 h-3 mr-1" />Recrutador</Badge>;
    }
    if (u?.subscription_type === 'premium') {
      return <Badge className="bg-amber-100 text-amber-700 border-0"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 border-0"><User className="w-3 h-3 mr-1" />Básico</Badge>;
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

      {/* Profile Info */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileUser?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white text-3xl">
                {profileUser?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-800">{profileUser?.full_name}</h2>
                {getPlanBadge(profileUser)}
              </div>
              
              {userProfile?.bio && (
                <p className="text-slate-600 mb-3">{userProfile.bio}</p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-slate-500 mb-4">
                {userProfile?.occupation && (
                  <span>{userProfile.occupation}</span>
                )}
                {userProfile?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {userProfile.city}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center">
                  <p className="font-bold text-slate-800">{posts.length}</p>
                  <p className="text-xs text-slate-500">Publicações</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">{followersCount}</p>
                  <p className="text-xs text-slate-500">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">{followingCount}</p>
                  <p className="text-xs text-slate-500">Seguindo</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {isOwnProfile ? (
                  <Link to={createPageUrl('EditProfile')}>
                    <Button variant="outline" className="rounded-xl">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      className={isFollowing ? "rounded-xl" : "rounded-xl bg-[#0056ff] hover:bg-[#0044cc]"}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Deixar de seguir
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Seguir
                        </>
                      )}
                    </Button>
                    <Link to={`${createPageUrl('SocialChat')}?email=${profileEmail}`}>
                      <Button variant="outline" className="rounded-xl">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mensagem
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Links */}
              {(userProfile?.linkedin_url || userProfile?.instagram_url || userProfile?.portfolio_url) && (
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                  {userProfile.linkedin_url && (
                    <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] hover:underline text-sm flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                  {userProfile.instagram_url && (
                    <a href={userProfile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] hover:underline text-sm flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      Instagram
                    </a>
                  )}
                  {userProfile.portfolio_url && (
                    <a href={userProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] hover:underline text-sm flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      Portfólio
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
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
              Publicações
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