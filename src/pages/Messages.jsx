import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Send, MessageCircle, Loader2, Search, Check, CheckCheck
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlanBadge from "@/components/social/PlanBadge";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
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

  // Get URL params for direct chat
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const chatWith = urlParams.get('with');
    if (chatWith && user) {
      setSelectedChat(chatWith);
    }
  }, [user]);

  // Fetch accepted follows (can message)
  const { data: myConnections = [] } = useQuery({
    queryKey: ['my-connections', user?.email],
    queryFn: async () => {
      if (!user) return [];
      try {
        // Follows where I'm follower and status is accepted
        const following = await base44.entities.Follow.filter({ 
          follower_email: user.email,
          status: 'accepted'
        }) || [];
        
        // Follows where I'm being followed and status is accepted
        const followers = await base44.entities.Follow.filter({ 
          following_email: user.email,
          status: 'accepted'
        }) || [];
        
        // Combine unique connections that can message
        const followingEmails = following.filter(f => f.can_message !== false).map(f => f.following_email);
        const followerEmails = followers.filter(f => f.can_message !== false).map(f => f.follower_email);
        
        return [...new Set([...followingEmails, ...followerEmails])];
      } catch (e) {
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch all users data
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-messages'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list('-created_date', 500) || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Fetch all messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ['my-messages', user?.email],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await base44.entities.DirectMessage.list('-created_date', 500) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Get chat list with last message
  const chatList = myConnections.map(email => {
    const userData = allUsers.find(u => u.email === email);
    const chatMessages = allMessages.filter(m => 
      (m.sender_email === email && m.receiver_email === user?.email) ||
      (m.sender_email === user?.email && m.receiver_email === email)
    ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    const lastMessage = chatMessages[0];
    const unreadCount = chatMessages.filter(m => 
      m.receiver_email === user?.email && !m.is_read
    ).length;

    return {
      email,
      full_name: userData?.full_name || 'Usuário',
      profile_photo: userData?.profile_photo,
      subscription_type: userData?.subscription_type,
      role: userData?.role,
      lastMessage,
      unreadCount
    };
  }).filter(chat => 
    !searchTerm || 
    chat.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date);
  });

  // Current chat messages
  const currentChatMessages = allMessages.filter(m => 
    (m.sender_email === selectedChat && m.receiver_email === user?.email) ||
    (m.sender_email === user?.email && m.receiver_email === selectedChat)
  ).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const selectedUser = allUsers.find(u => u.email === selectedChat);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        receiver_email: selectedChat,
        content: newMessage
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['my-messages'] });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds) => {
      for (const id of messageIds) {
        await base44.entities.DirectMessage.update(id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-messages'] });
    },
  });

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (selectedChat && currentChatMessages.length > 0) {
      const unreadIds = currentChatMessages
        .filter(m => m.receiver_email === user?.email && !m.is_read)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        markAsReadMutation.mutate(unreadIds);
      }
    }
  }, [selectedChat, currentChatMessages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages.length]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {selectedChat ? (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedChat(null)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Link to={createPageUrl('Social')}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {selectedChat ? selectedUser?.full_name || 'Chat' : 'Mensagens'}
              </h1>
              {!selectedChat && (
                <p className="text-white/70 text-sm">Converse com suas conexões</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {!selectedChat ? (
          // Chat List
          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar conversa..."
                  className="pl-10 rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {chatList.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhuma conversa ainda</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Siga outros usuários e aguarde eles aceitarem para conversar
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {chatList.map((chat) => (
                    <button
                      key={chat.email}
                      onClick={() => setSelectedChat(chat.email)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={chat.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {chat.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 truncate">{chat.full_name}</p>
                          <PlanBadge user={chat} />
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {chat.lastMessage?.content || 'Nenhuma mensagem ainda'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {chat.lastMessage && (
                          <span className="text-xs text-slate-400">
                            {formatTime(chat.lastMessage.created_date)}
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-[#0056ff] text-white h-5 min-w-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Chat View
          <Card className="rounded-2xl shadow-lg h-[calc(100vh-200px)] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {currentChatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400">Inicie uma conversa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentChatMessages.map((msg) => {
                    const isMine = msg.sender_email === user?.email;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                            isMine 
                              ? 'bg-[#0056ff] text-white rounded-br-sm' 
                              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-xs ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                              {formatTime(msg.created_date)}
                            </span>
                            {isMine && (
                              msg.is_read 
                                ? <CheckCheck className="w-3 h-3 text-white/70" />
                                : <Check className="w-3 h-3 text-white/70" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white rounded-b-2xl">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newMessage.trim()) {
                    sendMessageMutation.mutate();
                  }
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-full"
                />
                <Button 
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-10 w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}