import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PenSquare, Search, Users, MessageCircle, Bookmark, 
  Loader2, SlidersHorizontal, TrendingUp, Clock, Heart
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import PostCard from "@/components/social/PostCard";
import CreatePostModal from "@/components/social/CreatePostModal";
import UserCard from "@/components/social/UserCard";
import MessageChat from "@/components/social/MessageChat";

export default function Social() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [userSort, setUserSort] = useState('alphabetical');
  const [feedSort, setFeedSort] = useState('recent');
  const [chatWith, setChatWith] = useState(null);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Fetch posts
  const { data: posts = [], isLoading: loadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['social-posts', feedSort],
    queryFn: async () => {
      let sortField = '-created_date';
      if (feedSort === 'likes') sortField = '-likes_count';
      if (feedSort === 'comments') sortField = '-comments_count';
      
      const data = await base44.entities.SocialPost.filter(
        { status: 'active' },
        sortField,
        50
      );
      return data || [];
    },
    enabled: !!user
  });

  // Fetch users
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['social-users'],
    queryFn: async () => {
      const data = await base44.entities.User.list();
      return data || [];
    },
    enabled: !!user
  });

  // Fetch follows for user counts
  const { data: follows = [] } = useQuery({
    queryKey: ['all-follows'],
    queryFn: async () => {
      const data = await base44.entities.Follow.filter({});
      return data || [];
    },
    enabled: !!user
  });

  // Fetch saved posts
  const { data: savedPosts = [] } = useQuery({
    queryKey: ['saved-posts', user?.email],
    queryFn: async () => {
      const saves = await base44.entities.SocialSave.filter({ user_email: user.email });
      return saves || [];
    },
    enabled: !!user
  });

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.DirectMessage.filter({ sender_email: user.email }, '-created_date', 100),
        base44.entities.DirectMessage.filter({ receiver_email: user.email }, '-created_date', 100)
      ]);
      
      const allMessages = [...sent, ...received];
      const conversationMap = new Map();
      
      allMessages.forEach(msg => {
        const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
        if (!conversationMap.has(otherEmail) || new Date(msg.created_date) > new Date(conversationMap.get(otherEmail).created_date)) {
          conversationMap.set(otherEmail, msg);
        }
      });
      
      return Array.from(conversationMap.entries()).map(([email, lastMsg]) => ({
        email,
        lastMessage: lastMsg,
        unread: lastMsg.receiver_email === user.email && !lastMsg.is_read
      })).sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
    },
    enabled: !!user
  });

  const getFollowersCount = (email) => follows.filter(f => f.following_email === email).length;

  const filteredUsers = allUsers
    .filter(u => u.email !== user?.email)
    .filter(u => !searchUsers || u.full_name?.toLowerCase().includes(searchUsers.toLowerCase()))
    .sort((a, b) => {
      if (userSort === 'alphabetical') return (a.full_name || '').localeCompare(b.full_name || '');
      if (userSort === 'followers') return getFollowersCount(b.email) - getFollowersCount(a.email);
      if (userSort === 'plan') {
        const planOrder = { admin: 0, recruiter: 1, premium: 2, basic: 3 };
        const aPlan = a.role === 'admin' ? 'admin' : (a.subscription_type || 'basic');
        const bPlan = b.role === 'admin' ? 'admin' : (b.subscription_type || 'basic');
        return planOrder[aPlan] - planOrder[bPlan];
      }
      return 0;
    });

  const savedPostIds = savedPosts.map(s => s.post_id);
  const favoritePosts = posts.filter(p => savedPostIds.includes(p.id));

  const handleRefresh = () => {
    refetchPosts();
    queryClient.invalidateQueries(['social-posts']);
  };

  const handleEditPost = (post) => {
    setEditPost(post);
    setShowCreatePost(true);
  };

  const handleMessage = (userData) => {
    setChatWith(userData);
    setActiveTab('messages');
  };

  const unreadCount = conversations.filter(c => c.unread).length;

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
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">Social</h1>
            <Button
              onClick={() => { setEditPost(null); setShowCreatePost(true); }}
              className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
            >
              <PenSquare className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="feed" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white relative">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Mensagens</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg data-[state=active]:bg-[#0056ff] data-[state=active]:text-white">
              <Bookmark className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Salvos</span>
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <Select value={feedSort} onValueChange={setFeedSort}>
                <SelectTrigger className="w-40 h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Mais recentes
                    </div>
                  </SelectItem>
                  <SelectItem value="likes">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Mais curtidos
                    </div>
                  </SelectItem>
                  <SelectItem value="comments">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Mais comentados
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posts */}
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 text-center">
                  <PenSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma publicação ainda</h3>
                  <p className="text-slate-500 mb-4">Seja o primeiro a publicar algo!</p>
                  <Button onClick={() => setShowCreatePost(true)} className="bg-[#0056ff] rounded-xl">
                    Criar publicação
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                    onRefresh={handleRefresh}
                    onEdit={handleEditPost}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  placeholder="Buscar usuários..."
                  className="pl-10 rounded-xl bg-white"
                />
              </div>
              <Select value={userSort} onValueChange={setUserSort}>
                <SelectTrigger className="w-full sm:w-44 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Ordem alfabética</SelectItem>
                  <SelectItem value="followers">Mais seguidos</SelectItem>
                  <SelectItem value="plan">Por plano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredUsers.map(userData => (
                  <UserCard 
                    key={userData.id} 
                    userData={userData} 
                    currentUser={user}
                    onMessage={handleMessage}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            {chatWith ? (
              <div className="h-[60vh]">
                <MessageChat 
                  user={user} 
                  chatWith={chatWith} 
                  onBack={() => { setChatWith(null); refetchConversations(); }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <Card className="rounded-xl">
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma conversa</h3>
                      <p className="text-slate-500">Envie uma mensagem para começar a conversar!</p>
                    </CardContent>
                  </Card>
                ) : (
                  conversations.map(conv => {
                    const otherUser = allUsers.find(u => u.email === conv.email);
                    if (!otherUser) return null;
                    
                    return (
                      <Card 
                        key={conv.email} 
                        className={`rounded-xl cursor-pointer hover:shadow-md transition-shadow ${conv.unread ? 'border-[#0056ff] border-2' : ''}`}
                        onClick={() => setChatWith(otherUser)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser.profile_photo} />
                              <AvatarFallback className="bg-[#0056ff] text-white">
                                {otherUser.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800 truncate">{otherUser.full_name}</h3>
                                {conv.unread && <Badge className="bg-[#0056ff]">Nova</Badge>}
                              </div>
                              <p className="text-sm text-slate-500 truncate">{conv.lastMessage.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-4">
            {favoritePosts.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 text-center">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma publicação salva</h3>
                  <p className="text-slate-500">Salve publicações para ver depois!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {favoritePosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                    onRefresh={handleRefresh}
                    onEdit={handleEditPost}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        open={showCreatePost}
        onClose={() => { setShowCreatePost(false); setEditPost(null); }}
        user={user}
        editPost={editPost}
        onSuccess={handleRefresh}
      />
    </div>
  );
}