import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, UserPlus, UserMinus, MessageCircle, Edit, 
  Loader2, MapPin, Briefcase, Link as LinkIcon, Users
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import PostCard from "@/components/social/PostCard";

export default function SocialProfile() {
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load profile user
        const users = await base44.entities.User.filter({ email: profileEmail });
        if (users[0]) {
          setProfileUser(users[0]);
        }
        
        // Load profile data
        const profiles = await base44.entities.UserProfile.filter({ user_email: profileEmail });
        if (profiles[0]) {
          setProfile(profiles[0]);
        }
        
        // Check if following
        if (currentUser && profileEmail !== currentUser.email) {
          const follows = await base44.entities.Follow.filter({
            follower_email: currentUser.email,
            following_email: profileEmail
          });
          setIsFollowing(follows.length > 0);
        }
      } catch (e) {}
      setLoading(false);
    };
    
    if (profileEmail) loadData();
  }, [profileEmail]);

  // Fetch user's posts
  const { data: userPosts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['user-posts', profileEmail],
    queryFn: async () => {
      const posts = await base44.entities.SocialPost.filter(
        { author_email: profileEmail, status: 'active' },
        '-created_date',
        50
      );
      return posts || [];
    },
    enabled: !!profileEmail
  });

  // Fetch followers/following counts
  const { data: followers = [] } = useQuery({
    queryKey: ['followers', profileEmail],
    queryFn: async () => {
      const data = await base44.entities.Follow.filter({ following_email: profileEmail });
      return data || [];
    },
    enabled: !!profileEmail
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', profileEmail],
    queryFn: async () => {
      const data = await base44.entities.Follow.filter({ follower_email: profileEmail });
      return data || [];
    },
    enabled: !!profileEmail
  });

  // Fetch all users for follower/following lists
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const data = await base44.entities.User.list();
      return data || [];
    }
  });

  const handleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: user.email,
          following_email: profileEmail
        });
        if (follows[0]) {
          await base44.entities.Follow.delete(follows[0].id);
          setIsFollowing(false);
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: profileEmail
        });
        setIsFollowing(true);
      }
    } catch (e) {}
    setFollowLoading(false);
  };

  const handleMessage = () => {
    window.location.href = `${createPageUrl('Social')}?tab=messages&chat=${profileEmail}`;
  };

  const isOwnProfile = user?.email === profileEmail;

  const getPlanBadge = () => {
    if (profileUser?.role === 'admin' || profileUser?.subscription_type === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700">Administrador</Badge>;
    }
    if (profileUser?.subscription_type === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700">Recrutador</Badge>;
    }
    if (profileUser?.subscription_type === 'premium') {
      return <Badge className="bg-green-100 text-green-700">Premium</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600">Básico</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-600">Usuário não encontrado</h3>
            <Link to={createPageUrl('Social')}>
              <Button className="mt-4 bg-[#0056ff] rounded-xl">Voltar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Social')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Perfil</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <Card className="rounded-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] h-24" />
          <CardContent className="relative pt-0 pb-6 px-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={profileUser.profile_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white text-3xl">
                  {profileUser.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 sm:mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-800">{profileUser.full_name}</h2>
                  {getPlanBadge()}
                </div>
                {profile?.occupation && (
                  <p className="text-slate-600 flex items-center gap-1 mt-1">
                    <Briefcase className="w-4 h-4" />
                    {profile.occupation}
                  </p>
                )}
                {profile?.city && (
                  <p className="text-slate-500 flex items-center gap-1 text-sm">
                    <MapPin className="w-3 h-3" />
                    {profile.city}
                  </p>
                )}
              </div>

              {!isOwnProfile && user && (
                <div className="flex gap-2 sm:mb-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`rounded-xl ${isFollowing ? '' : 'bg-[#0056ff] hover:bg-[#0044cc]'}`}
                  >
                    {followLoading ? (
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
                  <Button variant="outline" onClick={handleMessage} className="rounded-xl">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensagem
                  </Button>
                </div>
              )}

              {isOwnProfile && (
                <Link to={createPageUrl('EditProfile')}>
                  <Button variant="outline" className="rounded-xl">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar perfil
                  </Button>
                </Link>
              )}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-slate-700 mt-4">{profile.bio}</p>
            )}

            {/* Links */}
            {(profile?.linkedin_url || profile?.instagram_url || profile?.portfolio_url) && (
              <div className="flex flex-wrap gap-3 mt-4">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] text-sm flex items-center gap-1 hover:underline">
                    <LinkIcon className="w-3 h-3" /> LinkedIn
                  </a>
                )}
                {profile.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] text-sm flex items-center gap-1 hover:underline">
                    <LinkIcon className="w-3 h-3" /> Instagram
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[#0056ff] text-sm flex items-center gap-1 hover:underline">
                    <LinkIcon className="w-3 h-3" /> Portfólio
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-6 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{userPosts.length}</p>
                <p className="text-sm text-slate-500">Publicações</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{followers.length}</p>
                <p className="text-sm text-slate-500">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{following.length}</p>
                <p className="text-sm text-slate-500">Seguindo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="grid grid-cols-3 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              Publicações
            </TabsTrigger>
            <TabsTrigger value="followers" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              Seguidores
            </TabsTrigger>
            <TabsTrigger value="following" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              Seguindo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {userPosts.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-500">Nenhuma publicação ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                    onRefresh={refetchPosts}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4">
            {followers.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum seguidor ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {followers.map(f => {
                  const followerUser = allUsers.find(u => u.email === f.follower_email);
                  if (!followerUser) return null;
                  
                  return (
                    <Link key={f.id} to={`${createPageUrl('SocialProfile')}?email=${followerUser.email}`}>
                      <Card className="rounded-xl hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={followerUser.profile_photo} />
                            <AvatarFallback className="bg-[#0056ff] text-white">
                              {followerUser.full_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-800">{followerUser.full_name}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            {following.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Não segue ninguém ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {following.map(f => {
                  const followingUser = allUsers.find(u => u.email === f.following_email);
                  if (!followingUser) return null;
                  
                  return (
                    <Link key={f.id} to={`${createPageUrl('SocialProfile')}?email=${followingUser.email}`}>
                      <Card className="rounded-xl hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={followingUser.profile_photo} />
                            <AvatarFallback className="bg-[#0056ff] text-white">
                              {followingUser.full_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-800">{followingUser.full_name}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}