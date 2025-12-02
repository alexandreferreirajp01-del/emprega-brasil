import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, TrendingUp, Bell, Plus, Loader2, Lock, Crown, MessageCircle,
  Heart, Share2, MoreVertical, Trash2, Flag, RefreshCw, UserPlus
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreatePostModal from "@/components/social/CreatePostModal";
import PlanBadge from "@/components/social/PlanBadge";

// Função de fetch robusta com retry
async function safeFetch(fetchFn, fallback = []) {
  for (let i = 0; i < 3; i++) {
    try {
      const result = await fetchFn();
      return result || fallback;
    } catch (e) {
      if (i === 2) return fallback;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  return fallback;
}

export default function Social() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  
  // Data states
  const [posts, setPosts] = useState([]);
  const [follows, setFollows] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not authenticated
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Load all data
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const loadAllData = async () => {
      setDataLoading(true);
      
      const [postsData, followsData, likesData, commentsData, usersData, profilesData, notificationsData] = await Promise.all([
        safeFetch(() => base44.entities.SocialPost.list('-created_date', 100)),
        safeFetch(() => base44.entities.Follow.list('-created_date', 500)),
        safeFetch(() => base44.entities.SocialLike.list('-created_date', 1000)),
        safeFetch(() => base44.entities.SocialComment.list('-created_date', 500)),
        safeFetch(() => base44.entities.User.list('-created_date', 500)),
        safeFetch(() => base44.entities.UserProfile.list('-created_date', 200)),
        safeFetch(() => base44.entities.SocialNotification.list('-created_date', 100))
      ]);

      if (mounted) {
        setPosts(postsData.filter(p => p.status === 'active' || !p.status));
        setFollows(followsData);
        setLikes(likesData);
        setComments(commentsData.filter(c => c.status === 'active' || !c.status));
        setAllUsers(usersData);
        setProfiles(profilesData);
        setNotifications(notificationsData.filter(n => n.user_email === user.email));
        setDataLoading(false);
      }
    };

    loadAllData();
    return () => { mounted = false; };
  }, [user, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  // Check access
  const canAccessSocial = user && (
    user.subscription_type === 'premium' || 
    user.subscription_type === 'admin' || 
    user.subscription_type === 'basic' ||
    user.role === 'admin'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!user || !canAccessSocial) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-white">Social Vagas Abertas</h1>
            <p className="text-white/70">Conecte-se com profissionais</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-8">
          <Card className="rounded-2xl shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Escolha um Plano</h2>
              <p className="text-slate-600 mb-6">
                Para acessar a rede social, você precisa escolher um plano.
                O plano básico é gratuito!
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button className="w-full bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-12">
                  <Crown className="w-5 h-5 mr-2" />
                  Escolher um Plano
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get following emails
  const myFollows = follows.filter(f => f.follower_email === user.email);
  const followingEmails = myFollows.filter(f => f.status === 'accepted' || f.status === 'pending').map(f => f.following_email);
  const unreadNotifications = notifications.filter(n => !n.is_read);

  // Filter posts for feed
  const feedPosts = activeTab === 'feed' 
    ? posts.filter(p => followingEmails.includes(p.author_email) || p.author_email === user.email)
    : posts;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Social Vagas Abertas</h1>
              <p className="text-white/70">Conecte-se com profissionais</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="text-white hover:bg-white/10 rounded-xl"
              >
                <RefreshCw className={`w-5 h-5 ${dataLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Link to={createPageUrl('Messages')}>
                <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                onClick={() => setShowCreatePost(true)}
                className="bg-white text-[#0056ff] hover:bg-white/90 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-14 rounded-xl bg-white shadow mb-4">
            <TabsTrigger value="feed" className="rounded-lg h-12 data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="discover" className="rounded-lg h-12 data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Descobrir
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg h-12 data-[state=active]:bg-[#0056ff] data-[state=active]:text-white relative">
              <Bell className="w-4 h-4 mr-2" />
              Alertas
              {unreadNotifications.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            {dataLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
              </div>
            ) : feedPosts.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Seu feed está vazio</h3>
                  <p className="text-slate-500 mb-4">Siga outros profissionais para ver suas publicações</p>
                  <Button variant="outline" onClick={() => setActiveTab('discover')}>
                    <Users className="w-4 h-4 mr-2" />
                    Descobrir pessoas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {feedPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                    allUsers={allUsers}
                    likes={likes}
                    comments={comments}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            <div className="space-y-6">
              <FollowRequestsSection 
                user={user} 
                follows={follows} 
                allUsers={allUsers}
                onRefresh={handleRefresh}
              />
              <UsersSection 
                user={user} 
                allUsers={allUsers} 
                profiles={profiles}
                myFollows={myFollows}
                onRefresh={handleRefresh}
              />
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                    allUsers={allUsers}
                    likes={likes}
                    comments={comments}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsSection 
              notifications={notifications}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreatePostModal 
        open={showCreatePost} 
        onOpenChange={setShowCreatePost} 
        user={user} 
      />
    </div>
  );
}

// Post Card Component
function PostCard({ post, user, allUsers, likes, comments, onRefresh }) {
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes.filter(l => l.post_id === post.id));

  const authorUser = allUsers.find(u => u.email === post.author_email);
  const postComments = comments.filter(c => c.post_id === post.id);
  const userLiked = localLikes.some(l => l.user_email === user?.email);
  const isOwner = post.author_email === user?.email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  const handleLike = async () => {
    if (isLiking || !user) return;
    setIsLiking(true);
    
    try {
      if (userLiked) {
        const myLike = localLikes.find(l => l.user_email === user.email);
        if (myLike) {
          await base44.entities.SocialLike.delete(myLike.id);
          setLocalLikes(prev => prev.filter(l => l.id !== myLike.id));
        }
      } else {
        const newLike = await base44.entities.SocialLike.create({
          post_id: post.id,
          user_email: user.email
        });
        setLocalLikes(prev => [...prev, newLike]);
      }
    } catch (e) {
      console.warn('Erro ao curtir:', e);
    }
    setIsLiking(false);
  };

  const handleDelete = async () => {
    try {
      await base44.entities.SocialPost.delete(post.id);
      onRefresh();
    } catch (e) {
      console.warn('Erro ao deletar:', e);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Link to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`} className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.author_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {post.author_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800 hover:text-[#0056ff]">
                  {post.author_name || 'Usuário'}
                </p>
                <PlanBadge user={authorUser} />
              </div>
              <p className="text-sm text-slate-500">
                {post.author_occupation || 'Profissional'} • {formatDate(post.created_date)}
              </p>
            </div>
          </Link>
          
          {(isOwner || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="text-slate-700 whitespace-pre-line mb-4">{post.content}</p>
        
        {post.image_url && (
          <img src={post.image_url} alt="" className="rounded-xl max-h-96 w-full object-cover mb-4" />
        )}

        <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
          <span>{localLikes.length} curtida{localLikes.length !== 1 ? 's' : ''}</span>
          <span>{postComments.length} comentário{postComments.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex-1 rounded-xl ${userLiked ? 'text-red-500' : 'text-slate-600'}`}
          >
            <Heart className={`w-5 h-5 mr-2 ${userLiked ? 'fill-current' : ''}`} />
            Curtir
          </Button>
          <Link to={`${createPageUrl('PostDetail')}?id=${post.id}`} className="flex-1">
            <Button variant="ghost" className="w-full rounded-xl text-slate-600">
              <MessageCircle className="w-5 h-5 mr-2" />
              Comentar
            </Button>
          </Link>
          <Button variant="ghost" className="flex-1 rounded-xl text-slate-600">
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Follow Requests Section
function FollowRequestsSection({ user, follows, allUsers, onRefresh }) {
  const [processing, setProcessing] = useState([]);
  
  const pendingRequests = follows.filter(f => 
    f.following_email === user.email && f.status === 'pending'
  );

  if (pendingRequests.length === 0) return null;

  const handleRespond = async (requestId, accept, followerEmail) => {
    setProcessing(prev => [...prev, requestId]);
    try {
      await base44.entities.Follow.update(requestId, { 
        status: accept ? 'accepted' : 'rejected' 
      });
      onRefresh();
    } catch (e) {
      console.warn('Erro:', e);
    }
    setProcessing(prev => prev.filter(id => id !== requestId));
  };

  return (
    <Card className="rounded-xl border-amber-200 bg-amber-50">
      <CardContent className="p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <UserPlus className="w-5 h-5 text-amber-600" />
          Solicitações ({pendingRequests.length})
        </h3>
        <div className="space-y-3">
          {pendingRequests.map(req => {
            const requester = allUsers.find(u => u.email === req.follower_email);
            return (
              <div key={req.id} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={requester?.profile_photo} />
                  <AvatarFallback className="bg-[#0056ff] text-white">
                    {requester?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{requester?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-slate-500">quer seguir você</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(req.id, false, req.follower_email)}
                    disabled={processing.includes(req.id)}
                    className="h-8 text-red-600"
                  >
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(req.id, true, req.follower_email)}
                    disabled={processing.includes(req.id)}
                    className="h-8 bg-green-600 hover:bg-green-700"
                  >
                    Aceitar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Users Section
function UsersSection({ user, allUsers, profiles, myFollows, onRefresh }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const followingEmails = myFollows.map(f => f.following_email);

  const otherUsers = allUsers.filter(u => u.email !== user.email).slice(0, 10);

  const handleFollow = async (targetEmail) => {
    if (isFollowing) return;
    setIsFollowing(true);
    
    try {
      const existing = myFollows.find(f => f.following_email === targetEmail);
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail,
          status: 'pending'
        });
      }
      onRefresh();
    } catch (e) {
      console.warn('Erro:', e);
    }
    setIsFollowing(false);
  };

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-[#0056ff]" />
          Pessoas para seguir
        </h3>
        <div className="space-y-3">
          {otherUsers.map(u => {
            const profile = profiles.find(p => p.user_email === u.email);
            const follow = myFollows.find(f => f.following_email === u.email);
            
            return (
              <div key={u.id} className="flex items-center gap-3">
                <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={u.profile_photo} />
                    <AvatarFallback className="bg-[#0056ff] text-white">
                      {u.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{profile?.occupation || 'Profissional'}</p>
                </div>
                <Button
                  size="sm"
                  variant={follow ? 'outline' : 'default'}
                  onClick={() => handleFollow(u.email)}
                  disabled={isFollowing}
                  className="rounded-full h-8"
                >
                  {follow?.status === 'pending' ? 'Pendente' : 
                   follow?.status === 'accepted' ? 'Seguindo' : 'Seguir'}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Notifications Section
function NotificationsSection({ notifications, onRefresh }) {
  const handleMarkAsRead = async (id) => {
    try {
      await base44.entities.SocialNotification.update(id, { is_read: true });
      onRefresh();
    } catch (e) {
      console.warn('Erro:', e);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (notifications.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-8 text-center">
          <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma notificação</h3>
          <p className="text-slate-500">Suas notificações aparecerão aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="p-0 divide-y">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
            className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50' : ''}`}
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={n.from_photo} />
              <AvatarFallback className="bg-slate-200">
                {n.from_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-slate-800">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{formatDate(n.created_date)}</p>
            </div>
            {!n.is_read && <div className="w-2 h-2 bg-[#0056ff] rounded-full" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}