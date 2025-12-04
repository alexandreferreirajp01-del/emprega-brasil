import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Send, Loader2, MessageCircle, User, 
  RefreshCw, Clock, CheckCheck, Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ResponderChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  // Fetch all messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => base44.entities.MensagemDireta.list('-created_date', 1000),
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    const convMap = {};
    
    messages.forEach(msg => {
      // Get the other user (not admin)
      const otherEmail = msg.remetente_email === user?.email 
        ? msg.destinatario_email 
        : msg.remetente_email;
      
      if (!otherEmail || otherEmail === user?.email) return;
      
      if (!convMap[otherEmail]) {
        convMap[otherEmail] = {
          email: otherEmail,
          name: msg.remetente_email === otherEmail ? msg.remetente_nome : 'Usuário',
          messages: [],
          lastMessage: null,
          unreadCount: 0,
        };
      }
      
      convMap[otherEmail].messages.push(msg);
      
      // Count unread messages from user
      if (msg.remetente_email !== user?.email && !msg.lida) {
        convMap[otherEmail].unreadCount++;
      }
      
      // Update last message
      if (!convMap[otherEmail].lastMessage || 
          new Date(msg.created_date) > new Date(convMap[otherEmail].lastMessage.created_date)) {
        convMap[otherEmail].lastMessage = msg;
      }
    });
    
    return Object.values(convMap).sort((a, b) => {
      const dateA = new Date(a.lastMessage?.created_date || 0);
      const dateB = new Date(b.lastMessage?.created_date || 0);
      return dateB - dateA;
    });
  }, [messages, user]);

  // Selected conversation messages
  const selectedMessages = React.useMemo(() => {
    if (!selectedUser) return [];
    const conv = conversations.find(c => c.email === selectedUser);
    return conv ? conv.messages.sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    ) : [];
  }, [conversations, selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  // Mark messages as read
  useEffect(() => {
    if (selectedUser && user) {
      const unreadMessages = selectedMessages.filter(
        m => m.remetente_email === selectedUser && !m.lida
      );
      
      unreadMessages.forEach(async (msg) => {
        try {
          await base44.entities.MensagemDireta.update(msg.id, { lida: true });
        } catch (e) {
          console.error('Error marking as read:', e);
        }
      });
      
      if (unreadMessages.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      }
    }
  }, [selectedUser, selectedMessages, user]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const conversaId = [user.email, selectedUser].sort().join('_');
      return base44.entities.MensagemDireta.create({
        conversa_id: conversaId,
        remetente_email: user.email,
        remetente_nome: user.full_name || 'Admin',
        destinatario_email: selectedUser,
        conteudo: content,
        lida: false,
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    setSending(true);
    try {
      await sendMutation.mutateAsync(newMessage.trim());
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  const filteredConversations = conversations.filter(conv => 
    conv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

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
                {conversations.length} conversas • {totalUnread > 0 && (
                  <span className="text-yellow-300">{totalUnread} não lidas</span>
                )}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchMessages()}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4">
        <Card className="rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="border-r bg-slate-50">
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
              <ScrollArea className="h-[calc(600px-57px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma conversa</p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <button
                      key={conv.email}
                      onClick={() => setSelectedUser(conv.email)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-slate-100 transition-colors border-b ${
                        selectedUser === conv.email ? 'bg-cyan-50 border-l-4 border-l-cyan-500' : ''
                      }`}
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-cyan-100 text-cyan-700">
                          {conv.name?.[0] || conv.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800 truncate text-sm">
                            {conv.name || conv.email.split('@')[0]}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-cyan-500 text-white text-xs ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {conv.lastMessage?.conteudo || 'Sem mensagens'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatTime(conv.lastMessage?.created_date)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col bg-white">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-cyan-100 text-cyan-700">
                        {conversations.find(c => c.email === selectedUser)?.name?.[0] || 
                         selectedUser[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-800">
                        {conversations.find(c => c.email === selectedUser)?.name || 
                         selectedUser.split('@')[0]}
                      </p>
                      <p className="text-xs text-slate-500">{selectedUser}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {selectedMessages.map((msg, index) => {
                        const isAdmin = msg.remetente_email === user?.email;
                        return (
                          <div
                            key={msg.id || index}
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isAdmin
                                  ? 'bg-cyan-600 text-white rounded-br-md'
                                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                isAdmin ? 'text-cyan-200' : 'text-slate-400'
                              }`}>
                                <span className="text-xs">{formatTime(msg.created_date)}</span>
                                {isAdmin && <CheckCheck className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t bg-slate-50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua resposta..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        className="flex-1 rounded-xl"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
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