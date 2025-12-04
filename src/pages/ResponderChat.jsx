import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, Send, Loader2, MessageCircle, 
  RefreshCw, Search, User, Crown, Briefcase, Trash2, X, Maximize2, Minimize2
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

export default function ResponderChat() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, messageId: null });
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      
      if (!msg.is_from_admin && !msg.is_read) {
        convMap[senderId].unreadCount++;
      }
      
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
    
    return Object.values(convMap).sort((a, b) => {
      const dateA = new Date(a.lastMessage?.created_date || 0);
      const dateB = new Date(b.lastMessage?.created_date || 0);
      return dateB - dateA;
    });
  }, [allMessages]);

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
      showToast('Mensagem enviada!');
    } catch (e) {
      console.error('Error sending reply:', e);
      showToast('Erro ao enviar', 'error');
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async () => {
    if (!deleteDialog.messageId) return;
    
    try {
      await base44.entities.SupportChat.delete(deleteDialog.messageId);
      await loadMessages();
      showToast('Mensagem excluída!');
    } catch (e) {
      console.error('Error deleting message:', e);
      showToast('Erro ao excluir', 'error');
    } finally {
      setDeleteDialog({ open: false, messageId: null });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleGoBack = () => {
    if (selectedChat) {
      setSelectedChat(null);
    } else {
      navigate(-1);
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

  // Mobile: Show either list or chat
  const showChatOnMobile = selectedChat && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white text-sm`}>
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A mensagem será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className="bg-red-600 hover:bg-red-700 rounded-lg">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 pt-4 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="text-white hover:bg-white/20 mb-2 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {selectedChat ? 'Voltar' : 'Voltar'}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                Responder Chat
              </h1>
              <p className="text-white/70 text-sm">
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
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-9"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 md:px-4 -mt-3">
        <Card className={`rounded-2xl shadow-lg overflow-hidden ${isExpanded ? 'fixed inset-4 z-40' : ''}`}>
          <div className={`grid grid-cols-1 md:grid-cols-3 ${isExpanded ? 'h-full' : 'h-[500px] md:h-[600px]'}`}>
            {/* Conversations List - Hide on mobile when chat is open */}
            <div className={`border-r bg-slate-50 flex flex-col ${showChatOnMobile ? 'hidden' : ''} md:flex`}>
              <div className="p-3 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar conversa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">Nenhuma conversa</p>
                    <p className="text-xs">Aguardando mensagens</p>
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
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xs">
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
                            <Badge className="bg-cyan-500 text-white text-[10px] px-1.5 h-5">
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
            <div className={`md:col-span-2 flex flex-col bg-white ${!selectedChat && !showChatOnMobile ? 'hidden md:flex' : ''}`}>
              {selectedChat && currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b bg-slate-50 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden h-8 w-8 p-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-cyan-100 text-cyan-700 text-sm">
                        {currentConversation.senderName?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {currentConversation.senderName}
                        </p>
                        <Badge className={`text-[10px] ${getTypeBadge(currentConversation.senderType)}`}>
                          {currentConversation.senderType}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{currentConversation.senderId}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 p-0 hidden md:flex"
                      >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedChat(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-2">
                      {currentConversation.messages.map((msg, idx) => {
                        const isAdmin = msg.is_from_admin;
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} group`}
                          >
                            <div className="relative max-w-[80%]">
                              <div
                                className={`rounded-2xl px-3 py-2 ${
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
                              {/* Delete button */}
                              <button
                                onClick={() => setDeleteDialog({ open: true, messageId: msg.id })}
                                className={`absolute -top-1 ${isAdmin ? '-left-6' : '-right-6'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Reply Input */}
                  <div className="p-3 border-t bg-slate-50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua resposta..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                        className="flex-1 rounded-xl h-10 text-sm"
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={sending}
                        className="bg-cyan-600 hover:bg-cyan-700 rounded-xl h-10 w-10 p-0"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 p-8">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-sm">Selecione uma conversa</p>
                    <p className="text-xs">Escolha uma conversa para responder</p>
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