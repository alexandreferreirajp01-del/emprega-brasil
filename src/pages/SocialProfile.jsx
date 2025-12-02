import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, MapPin, Briefcase, Link as LinkIcon, Edit, Save, X,
  Users, UserPlus, Loader2, Instagram, Linkedin, Globe, Plus, Trash2, MessageCircle, Heart
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlanBadge from "@/components/social/PlanBadge";
import SocialPostCard from "@/components/social/SocialPostCard";

export default function SocialProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    checkAuth();
  }, []);

  const targetEmail = profileEmail || currentUser?.email;
  const isOwnProfile = targetEmail === currentUser?.email;

  const { data: userData } = useQuery({
    queryKey: ['user-data', targetEmail],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: targetEmail });
      return users[0];
    },
    enabled: !!targetEmail,
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', targetEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: targetEmail });
      return profiles[0];
    },
    enabled: !!targetEmail,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['profile-followers', targetEmail],
    queryFn: async () => {
      try {
        return await base44.entities.Follow.filter({ following_email: targetEmail }) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!targetEmail,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['profile-following', targetEmail],
    queryFn: async () => {
      try {
        return await base44.entities.Follow.filter({ follower_email: targetEmail }) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!targetEmail,
  });

  // Get all users data for followers/following lists
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-follow'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list('-created_date', 200) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: myFollows = [] } = useQuery({
    queryKey: ['my-follows', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.Follow.filter({ follower_email: currentUser.email }) || [];
    },
    enabled: !!currentUser,
  });

  const isFollowing = myFollows.some(f => f.following_email === targetEmail && f.status === 'accepted');

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, editForm);
      } else {
        await base44.entities.UserProfile.create({
          user_email: currentUser.email,
          ...editForm
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
    },
  });

  const myFollow = myFollows.find(f => f.following_email === targetEmail);
  const followStatus = myFollow?.status;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (myFollow) {
        await base44.entities.Follow.delete(myFollow.id);
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: targetEmail,
          status: 'pending'
        });
        
        await base44.entities.SocialNotification.create({
          user_email: targetEmail,
          from_email: currentUser.email,
          from_name: currentUser.full_name,
          from_photo: currentUser.profile_photo,
          type: 'follow',
          message: `${currentUser.full_name || 'Alguém'} solicitou seguir você`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-follows'] });
      queryClient.invalidateQueries({ queryKey: ['profile-followers'] });
    },
  });

  const startEditing = () => {
    setEditForm({
      occupation: profile?.occupation || '',
      city: profile?.city || '',
      bio: profile?.bio || '',
      skills: profile?.skills || [],
      portfolio_url: profile?.portfolio_url || '',
      linkedin_url: profile?.linkedin_url || '',
      instagram_url: profile?.instagram_url || ''
    });
    setIsEditing(true);
  };

  if (!currentUser || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Social')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16">
        {/* Profile Card */}
        <Card className="rounded-2xl shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={userData?.profile_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white text-3xl">
                  {userData?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold text-slate-800">
                        {userData?.full_name || 'Usuário'}
                      </h1>
                      <PlanBadge user={userData} size="lg" />
                    </div>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                      <Briefcase className="w-4 h-4" />
                      {profile?.occupation || 'Profissional'}
                    </p>
                    {profile?.city && (
                      <p className="text-slate-500 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {profile.city}
                      </p>
                    )}
                  </div>

                  {isOwnProfile ? (
                      <Button variant="outline" onClick={startEditing} className="rounded-xl">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {followStatus === 'accepted' && (
                          <Link to={`${createPageUrl('Messages')}?with=${targetEmail}`}>
                            <Button variant="outline" size="icon" className="rounded-xl">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          onClick={() => followMutation.mutate()}
                          disabled={followMutation.isPending}
                          variant={myFollow ? 'outline' : 'default'}
                          className="rounded-xl"
                        >
                          {followStatus === 'pending' ? (
                            'Solicitado'
                          ) : followStatus === 'accepted' ? (
                            'Seguindo'
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Seguir
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                </div>

                {/* Stats - Clickable like Instagram */}
                <div className="flex gap-6 mt-4">
                  <button 
                    onClick={() => setShowFollowers(true)}
                    className="text-center hover:opacity-70 transition-opacity"
                  >
                    <p className="text-xl font-bold text-slate-800">{followers.length}</p>
                    <p className="text-sm text-slate-500">Seguidores</p>
                  </button>
                  <button 
                    onClick={() => setShowFollowing(true)}
                    className="text-center hover:opacity-70 transition-opacity"
                  >
                    <p className="text-xl font-bold text-slate-800">{following.length}</p>
                    <p className="text-sm text-slate-500">Seguindo</p>
                  </button>
                </div>

                {/* Bio */}
                {profile?.bio && (
                  <p className="text-slate-600 mt-4">{profile.bio}</p>
                )}

                {/* Skills */}
                {profile?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="rounded-full">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Social Links */}
                <div className="flex gap-3 mt-4">
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                      </Button>
                    </a>
                  )}
                  {profile?.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Instagram className="w-5 h-5 text-[#E4405F]" />
                      </Button>
                    </a>
                  )}
                  {profile?.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Globe className="w-5 h-5 text-slate-600" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {isEditing && (
          <Card className="rounded-2xl mb-6">
            <CardHeader>
              <CardTitle>Editar Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ocupação</Label>
                  <Input
                    value={editForm.occupation}
                    onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                    placeholder="Ex: Desenvolvedor"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    placeholder="Ex: João Pessoa"
                  />
                </div>
              </div>

              <div>
                <Label>Biografia</Label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              <div>
                <Label>Habilidades (separadas por vírgula)</Label>
                <Input
                  value={editForm.skills?.join(', ') || ''}
                  onChange={(e) => setEditForm({...editForm, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  placeholder="Ex: JavaScript, React, Python"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={editForm.linkedin_url}
                    onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})}
                    placeholder="URL do LinkedIn"
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={editForm.instagram_url}
                    onChange={(e) => setEditForm({...editForm, instagram_url: e.target.value})}
                    placeholder="URL do Instagram"
                  />
                </div>
                <div>
                  <Label>Portfólio</Label>
                  <Input
                    value={editForm.portfolio_url}
                    onChange={(e) => setEditForm({...editForm, portfolio_url: e.target.value})}
                    placeholder="URL do portfólio"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                  className="bg-[#0056ff] hover:bg-[#0044cc]"
                >
                  {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Publicações</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilePosts userEmail={targetEmail} currentUser={currentUser} />
          </CardContent>
        </Card>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seguidores ({followers.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {followers.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Nenhum seguidor ainda</p>
              ) : (
                followers.map((follow) => {
                  const followerUser = allUsers.find(u => u.email === follow.follower_email);
                  return (
                    <Link 
                      key={follow.id}
                      to={`${createPageUrl('SocialProfile')}?email=${follow.follower_email}`}
                      onClick={() => setShowFollowers(false)}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={followerUser?.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {followerUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{followerUser?.full_name || 'Usuário'}</p>
                          <PlanBadge user={followerUser} />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seguindo ({following.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {following.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Não está seguindo ninguém</p>
              ) : (
                following.map((follow) => {
                  const followingUser = allUsers.find(u => u.email === follow.following_email);
                  return (
                    <Link 
                      key={follow.id}
                      to={`${createPageUrl('SocialProfile')}?email=${follow.following_email}`}
                      onClick={() => setShowFollowing(false)}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={followingUser?.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {followingUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{followingUser?.full_name || 'Usuário'}</p>
                          <PlanBadge user={followingUser} />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfilePosts({ userEmail, currentUser }) {
  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['user-posts', userEmail],
    queryFn: async () => {
      try {
        return await base44.entities.SocialPost.filter(
          { author_email: userEmail, status: 'active' },
          '-created_date',
          50
        ) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!userEmail,
  });

  const { data: allLikes = [] } = useQuery({
    queryKey: ['social-likes'],
    queryFn: async () => {
      try {
        return await base44.entities.SocialLike.list('-created_date', 1000) || [];
      } catch (e) {
        return [];
      }
    },
  });

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin mx-auto" />;
  }

  if (posts.length === 0) {
    return <p className="text-center text-slate-500 py-8">Nenhuma publicação ainda</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const postLikes = allLikes.filter(l => l.post_id === post.id);
        const userLiked = postLikes.some(l => l.user_email === currentUser?.email);
        
        return (
          <SocialPostCard
            key={post.id}
            post={post}
            user={currentUser}
            likesCount={postLikes.length}
            userLiked={userLiked}
            onRefresh={refetch}
          />
        );
      })}
    </div>
  );
}