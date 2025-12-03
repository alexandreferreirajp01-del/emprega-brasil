import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Settings, Grid3X3, Bookmark, UserPlus, UserMinus, 
  MessageCircle, Loader2, Link as LinkIcon, MapPin, Briefcase,
  Edit, Instagram, Linkedin, Globe
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserBadge from "@/components/social/UserBadge";
import PostCard from "@/components/social/PostCard";

export default function SocialProfile() {
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get('email');

  useEffect(() => {
    checkAuth();
  }, [targetEmail]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadProfile(currentUser);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadProfile = async (currentUser) => {
    const email = targetEmail || currentUser.email;
    
    try {
      const [usersData, profileData, postsData, followersData, followingData, allUsersData] = await Promise.all([
        base44.entities.User.filter({ email }),
        base44.entities.UserProfile.filter({ user_email: email }),
        base44.entities.SocialPost.filter({ author_email: email, status: 'active' }, '-created_date', 50),
        base44.entities.Follow.filter({ following_email: email }),
        base44.entities.Follow.filter({ follower_email: email }),
        base44.entities.User.list('-created_date', 500)
      ]);
      
      setProfileUser(usersData?.[0] || { email, full_name: 'Usuário' });
      setProfile(profileData?.[0] || {});
      setPosts(postsData || []);
      setFollowers(followersData || []);
      setFollowing(followingData || []);
      setAllUsers(allUsersData || []);
      
      // Check if current user follows this profile
      const myFollow = followersData?.find(f => f.follower_email === currentUser.email);
      setIsFollowing(!!myFollow);
      setFollowId(myFollow?.id || null);
    } catch (e) {}
    setLoading(false);
  };

  const handleFollow = async () => {
    try {
      if (isFollowing && followId) {
        await base44.entities.Follow.delete(followId);
        setIsFollowing(false);
        setFollowId(null);
        setFollowers(prev => prev.filter(f => f.id !== followId));
      } else {
        const newFollow = await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail
        });
        setIsFollowing(true);
        setFollowId(newFollow.id);
        setFollowers(prev => [...prev, newFollow]);
      }
    } catch (e) {}
  };

  const isOwnProfile = !targetEmail || targetEmail === user?.email;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Social')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">{profileUser?.full_name}</h1>
          </div>
          {isOwnProfile && (
            <Link to={createPageUrl('EditProfile')}>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Profile Header */}
        <div className="p-4">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20 ring-2 ring-pink-500 ring-offset-2">
              <AvatarImage src={profileUser?.profile_photo} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                {profileUser?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="font-bold text-lg">{posts.length}</p>
                  <p className="text-xs text-slate-500">publicações</p>
                </div>
                <button onClick={() => setShowFollowers(true)}>
                  <p className="font-bold text-lg">{followers.length}</p>
                  <p className="text-xs text-slate-500">seguidores</p>
                </button>
                <button onClick={() => setShowFollowing(true)}>
                  <p className="font-bold text-lg">{following.length}</p>
                  <p className="text-xs text-slate-500">seguindo</p>
                </button>
              </div>
            </div>
          </div>

          {/* Name & Bio */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">{profileUser?.full_name}</p>
              <UserBadge user={profileUser} />
            </div>
            
            {profile?.occupation && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {profile.occupation}
              </p>
            )}
            
            {profile?.city && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.city}
              </p>
            )}
            
            {profile?.bio && (
              <p className="text-sm mt-2">{profile.bio}</p>
            )}

            {/* Social Links */}
            <div className="flex gap-2 mt-2">
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener">
                  <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                </a>
              )}
              {profile?.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener">
                  <Instagram className="w-5 h-5 text-[#E4405F]" />
                </a>
              )}
              {profile?.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noopener">
                  <Globe className="w-5 h-5 text-slate-600" />
                </a>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {isOwnProfile ? (
              <Link to={createPageUrl('EditProfile')} className="flex-1">
                <Button variant="outline" className="w-full rounded-lg">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar perfil
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  onClick={handleFollow}
                  className={`flex-1 rounded-lg ${isFollowing ? '' : 'bg-blue-500 hover:bg-blue-600'}`}
                  variant={isFollowing ? 'outline' : 'default'}
                >
                  {isFollowing ? (
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
                <Link to={`${createPageUrl('DirectMessages')}?with=${targetEmail}`}>
                  <Button variant="outline" className="rounded-lg">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Posts Grid/List */}
        <Tabs defaultValue="grid" className="mt-2">
          <TabsList className="w-full grid grid-cols-2 bg-transparent border-t">
            <TabsTrigger value="grid" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">
              <Grid3X3 className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">
              <Bookmark className="w-5 h-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-0">
            {posts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">Nenhuma publicação ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {posts.map(post => (
                  <Link 
                    key={post.id}
                    to={`${createPageUrl('PostDetail')}?id=${post.id}`}
                    className="aspect-square bg-slate-100 overflow-hidden"
                  >
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-purple-100 to-pink-100">
                        <p className="text-xs text-slate-600 line-clamp-4 text-center">
                          {post.content}
                        </p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="p-8 text-center">
              <p className="text-slate-500">Itens salvos aparecerão aqui</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seguidores</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {followers.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhum seguidor</p>
            ) : (
              <div className="space-y-3">
                {followers.map(f => {
                  const followerUser = allUsers.find(u => u.email === f.follower_email);
                  return (
                    <Link 
                      key={f.id}
                      to={`${createPageUrl('SocialProfile')}?email=${f.follower_email}`}
                      onClick={() => setShowFollowers(false)}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={followerUser?.profile_photo} />
                        <AvatarFallback className="bg-slate-200">
                          {followerUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{followerUser?.full_name}</p>
                        <UserBadge user={followerUser} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seguindo</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {following.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Não segue ninguém</p>
            ) : (
              <div className="space-y-3">
                {following.map(f => {
                  const followingUser = allUsers.find(u => u.email === f.following_email);
                  return (
                    <Link 
                      key={f.id}
                      to={`${createPageUrl('SocialProfile')}?email=${f.following_email}`}
                      onClick={() => setShowFollowing(false)}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={followingUser?.profile_photo} />
                        <AvatarFallback className="bg-slate-200">
                          {followingUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{followingUser?.full_name}</p>
                        <UserBadge user={followingUser} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}