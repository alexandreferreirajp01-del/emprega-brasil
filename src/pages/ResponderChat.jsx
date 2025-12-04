import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Send, Loader2, MessageCircle, 
  RefreshCw, Search, User, Crown, Briefcase, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function ResponderChat() {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setAdminUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  // Load all support messages
  const loadMessages = async () => {
    setRefreshing(true);
    try {
      const messages = await base44.entities.SupportChat.list('-created_date', 1000);
      setAllMessages(messages || []);
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadMessages();
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [adminUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat, allMessages]);

  // Group messages by sender
  const conversations = React.useMemo(() => {
    const convMap = {};
    
    allMessages.forEach(msg => {
      // Skip admin responses (they are keyed differently)
      if (msg.sender_id?.startsWith('admin_to_')) return;
      
      const senderId = msg.sender_id;
      if (!senderId) return;
      
      if (!convMap[senderId]) {
        convMap[senderId] = {
          senderId,
          senderName: msg.sender_name || 'Usuário',
          senderType: msg.sender_type || 'visitor',
          messages: [],
          lastMessage: null,
          unreadCount: 0,
        };
      }
      
      convMap[senderId].messages.push(msg);
      
      // Count unread
      if (!msg.is_from_admin && !msg.is_read) {
        convMap[senderId].unreadCount++;
      }
      
      // Track last message
      if (!convMap[senderId].lastMessage || 
          new Date(msg.created_date) > new Date(convMap[senderId].lastMessage.created_date)) {
        convMap[senderId].lastMessage = msg;
      }
    });

    // Add admin responses to conversations
    allMessages.forEach(msg => {
      if (msg.sender_id?.startsWith('admin_to_')) {
        const targetId = msg.sender_id.replace('admin_to_', '');
        if (convMap[targetId]) {
          convMap[targetId].messages.push(msg);
        }
      }
    });

    // Sort messages within each conversation
    Object.values(convMap).forEach(conv => {
      conv.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    });
    
    // Sort conversations by last activity
    return Object.values(convMap).sort((a, b) => {
      const dateA = new Date(a.lastMessage?.created_date || 0);
      const dateB = new Date(b.lastMessage?.created_date || 0);
      return dateB - dateA;
    });
  }, [allMessages]);

  // Get current conversation
  const currentConversation = conversations.find(c => c.senderId === selectedChat);

  // Send reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedChat || sending) return;
    
    setSending(true);
    try {
      await base44.entities.SupportChat.create({
        sender_id: `admin_to_${selectedChat}`,
        sender_name: adminUser?.full_name || 'Suporte',
        sender_type: 'admin',
        message: replyText.trim(),
        is_from_admin: true,
        is_read: false,
      });
      
      setReplyText('');
      await loadMessages();
    } catch (e) {
      console.error('Error sending reply:', e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'premium': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'recruiter': return <Briefcase className="w-3 h-3 text-purple-500" />;
      case 'admin': return <Crown className="w-3 h-3 text-red-500" />;
      default: return <User className="w-3 h-3 text-slate-400" />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      visitor: 'bg-slate-100 text-slate-600',
      basic: 'bg-blue-100 text-blue-600',
      premium: 'bg-yellow-100 text-yellow-700',
      recruiter: 'bg-purple-100 text-purple-700',
      admin: 'bg-red-100 text-red-700',
    };
    return colors[type] || colors.visitor;
  };

  const filteredConversations = conversations.filter(conv => 
    conv.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.senderId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

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
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 pt-6 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <MessageCircle className="w-7 h-7" />
                Responder Chat
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {conversations.length} conversas
                {totalUnread > 0 && (
                  <span className="text-yellow-300 ml-2">• {totalUnread} não lidas</span>
                )}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadMessages}
              disabled={refreshing}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4">
        <Card className="rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="border-r bg-slate-50 flex flex-col">
              <div className="p-3 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar conversa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 rounded-lg"
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhuma conversa</p>
                    <p className="text-sm">Aguardando mensagens</p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <button
                      key={conv.senderId}
                      onClick={() => setSelectedChat(conv.senderId)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-slate-100 transition-colors border-b text-left ${
                        selectedChat === conv.senderId ? 'bg-cyan-50 border-l-4 border-l-cyan-500' : ''
                      }`}
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-cyan-100 text-cyan-700 text-sm">
                          {conv.senderName?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {getTypeIcon(conv.senderType)}
                            <span className="font-medium text-slate-800 text-sm truncate">
                              {conv.senderName}
                            </span>
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-cyan-500 text-white text-xs px-1.5">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {conv.lastMessage?.message || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge className={`text-[10px] px-1.5 py-0 ${getTypeBadge(conv.senderType)}`}>
                            {conv.senderType}
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            {formatTime(conv.lastMessage?.created_date)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col bg-white">
              {selectedChat && currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-cyan-100 text-cyan-700">
                        {currentConversation.senderName?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">
                          {currentConversation.senderName}
                        </p>
                        <Badge className={`text-xs ${getTypeBadge(currentConversation.senderType)}`}>
                          {currentConversation.senderType}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{currentConversation.senderId}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {currentConversation.messages.map((msg, idx) => {
                        const isAdmin = msg.is_from_admin;
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isAdmin
                                  ? 'bg-cyan-600 text-white rounded-br-md'
                                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              <p className={`text-[10px] mt-1 text-right ${
                                isAdmin ? 'text-cyan-200' : 'text-slate-400'
                              }`}>
                                {formatTime(msg.created_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Reply Input */}
                  <div className="p-4 border-t bg-slate-50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua resposta..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                        className="flex-1 rounded-xl"
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={sending || !replyText.trim()}
                        className="bg-cyan-600 hover:bg-cyan-700 rounded-xl px-4"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Selecione uma conversa</p>
                    <p className="text-sm">Escolha uma conversa para responder</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}