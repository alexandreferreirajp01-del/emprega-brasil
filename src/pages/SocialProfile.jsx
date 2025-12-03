import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Settings, UserPlus, UserMinus, 
  MessageSquare, Loader2, MapPin, Briefcase,
  Edit, Linkedin, Globe, Grid3X3
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserBadge from "@/components/social/UserBadge";
import FeedPostCard from "@/components/social/FeedPostCard";

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
  const [loadingFollow, setLoadingFollow] = useState(false);
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
    if (loadingFollow) return;
    setLoadingFollow(true);
    
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
    setLoadingFollow(false);
  };

  const handleRefresh = () => {
    if (user) loadProfile(user);
  };

  const isOwnProfile = !targetEmail || targetEmail === user?.email;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Social')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-slate-800">{profileUser?.full_name}</h1>
          </div>
          {isOwnProfile && (
            <Link to={createPageUrl('EditProfile')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Profile Header Card */}
        <Card className="rounded-none border-x-0 border-t-0">
          <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] h-24" />
          <CardContent className="pt-0 pb-6 -mt-12">
            <div className="flex items-end gap-4">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarImage src={profileUser?.profile_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white text-3xl font-semibold">
                  {profileUser?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pb-1">
                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFollow}
                      disabled={loadingFollow}
                      className={`rounded-xl ${isFollowing ? '' : 'bg-[#0056ff] hover:bg-[#0044cc]'}`}
                      variant={isFollowing ? 'outline' : 'default'}
                    >
                      {loadingFollow ? (
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
                    <Link to={`${createPageUrl('DirectMessages')}?with=${targetEmail}`}>
                      <Button variant="outline" className="rounded-xl">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensagem
                      </Button>
                    </Link>
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
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-800">{profileUser?.full_name}</h2>
                <UserBadge user={profileUser} size="lg" />
              </div>
              
              {profile?.occupation && (
                <p className="text-slate-600 flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
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
                <p className="text-slate-700 mt-3">{profile.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex gap-3 mt-3">
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener" className="text-[#0A66C2] hover:underline text-sm flex items-center gap-1">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {profile?.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener" className="text-slate-600 hover:underline text-sm flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t">
                <button onClick={() => setShowFollowers(true)} className="text-center hover:bg-slate-50 px-3 py-1 rounded-lg">
                  <p className="font-bold text-slate-800">{followers.length}</p>
                  <p className="text-sm text-slate-500">Seguidores</p>
                </button>
                <button onClick={() => setShowFollowing(true)} className="text-center hover:bg-slate-50 px-3 py-1 rounded-lg">
                  <p className="font-bold text-slate-800">{following.length}</p>
                  <p className="text-sm text-slate-500">Seguindo</p>
                </button>
                <div className="text-center px-3 py-1">
                  <p className="font-bold text-slate-800">{posts.length}</p>
                  <p className="text-sm text-slate-500">Publicações</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="px-4 py-4 space-y-4">
          <h3 className="font-semibold text-slate-800">Publicações</h3>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma publicação ainda</p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <FeedPostCard 
                key={post.id}
                post={post}
                user={user}
                allUsers={allUsers}
                onRefresh={handleRefresh}
              />
            ))
          )}
        </div>
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
                        <AvatarFallback className="bg-[#0056ff] text-white">
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
                        <AvatarFallback className="bg-[#0056ff] text-white">
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