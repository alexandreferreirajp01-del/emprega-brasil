import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Send, Loader2, Lock, Crown, MessageCircle, 
  Check, X, AlertTriangle, Trash2, Search, MoreVertical
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function safeFetch(fetchFn, fallback = []) {
  for (let i = 0; i < 3; i++) {
    try {
      return await fetchFn() || fallback;
    } catch (e) {
      if (i === 2) return fallback;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  return fallback;
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function Inbox() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [messageToReport, setMessageToReport] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const [allMessages, allUsers] = await Promise.all([
          safeFetch(() => base44.entities.InboxMessage.list('-created_date', 500)),
          safeFetch(() => base44.entities.User.list('-created_date', 500))
        ]);

        setMessages(allMessages);
        setUsers(allUsers);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const canAccess = user?.subscription_type === 'premium' || 
    user?.subscription_type === 'admin' || 
    user?.subscription_type === 'recruiter' ||
    user?.role === 'admin';

  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  // Agrupar mensagens por conversa
  const conversations = React.useMemo(() => {
    const convMap = {};
    
    messages.forEach(msg => {
      const otherEmail = msg.sender_email === user?.email ? msg.receiver_email : msg.sender_email;
      
      if (!convMap[otherEmail]) {
        convMap[otherEmail] = {
          email: otherEmail,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          status: 'accepted'
        };
      }
      
      convMap[otherEmail].messages.push(msg);
      
      // Status da conversa (para primeira mensagem recebida)
      if (msg.receiver_email === user?.email && msg.conversation_status === 'pending') {
        convMap[otherEmail].status = 'pending';
      }
      
      // Última mensagem
      if (!convMap[otherEmail].lastMessage || new Date(msg.created_date) > new Date(convMap[otherEmail].lastMessage.created_date)) {
        convMap[otherEmail].lastMessage = msg;
      }
      
      // Contagem de não lidas
      if (msg.receiver_email === user?.email && !msg.is_read) {
        convMap[otherEmail].unreadCount++;
      }
    });

    return Object.values(convMap).sort((a, b) => 
      new Date(b.lastMessage?.created_date) - new Date(a.lastMessage?.created_date)
    );
  }, [messages, user]);

  const selectedMessages = React.useMemo(() => {
    if (!selectedConversation) return [];
    return messages
      .filter(m => 
        (m.sender_email === user?.email && m.receiver_email === selectedConversation.email) ||
        (m.receiver_email === user?.email && m.sender_email === selectedConversation.email)
      )
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [messages, selectedConversation, user]);

  const selectedUser = users.find(u => u.email === selectedConversation?.email);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setIsSending(true);
    try {
      const msg = await base44.entities.InboxMessage.create({
        sender_email: user.email,
        sender_name: user.full_name,
        sender_photo: user.profile_photo,
        receiver_email: selectedConversation.email,
        content: newMessage,
        conversation_status: 'accepted'
      });
      
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (e) {
      toast.error('Erro ao enviar mensagem');
    }
    setIsSending(false);
  };

  const handleAcceptConversation = async () => {
    try {
      const pendingMsgs = selectedMessages.filter(m => m.conversation_status === 'pending');
      for (const msg of pendingMsgs) {
        await base44.entities.InboxMessage.update(msg.id, { conversation_status: 'accepted' });
      }
      
      setMessages(prev => prev.map(m => 
        m.sender_email === selectedConversation.email && m.conversation_status === 'pending'
          ? { ...m, conversation_status: 'accepted' }
          : m
      ));
      
      toast.success('Conversa aceita!');
    } catch (e) {
      toast.error('Erro ao aceitar conversa');
    }
  };

  const handleRejectConversation = async () => {
    try {
      const convMsgs = selectedMessages;
      for (const msg of convMsgs) {
        await base44.entities.InboxMessage.delete(msg.id);
      }
      
      setMessages(prev => prev.filter(m => 
        !(m.sender_email === selectedConversation.email || m.receiver_email === selectedConversation.email)
      ));
      setSelectedConversation(null);
      
      toast.success('Conversa excluída');
    } catch (e) {
      toast.error('Erro ao excluir conversa');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Digite o motivo da denúncia');
      return;
    }

    try {
      // Marcar mensagem como reportada
      if (messageToReport) {
        await base44.entities.InboxMessage.update(messageToReport.id, {
          is_reported: true,
          report_reason: reportReason
        });
      }

      // Enviar mensagem para admins
      const admins = users.filter(u => u.role === 'admin' || u.subscription_type === 'admin');
      for (const admin of admins) {
        await base44.entities.InboxMessage.create({
          sender_email: user.email,
          sender_name: user.full_name,
          sender_photo: user.profile_photo,
          receiver_email: admin.email,
          content: `⚠️ DENÚNCIA\n\nUsuário denunciado: ${selectedConversation.email}\nMotivo: ${reportReason}\n\nMensagem original: "${messageToReport?.content}"`,
          conversation_status: 'accepted'
        });
      }

      toast.success('Denúncia enviada aos administradores');
      setShowReportDialog(false);
      setReportReason('');
      setMessageToReport(null);
    } catch (e) {
      toast.error('Erro ao enviar denúncia');
    }
  };

  const handleStartNewConversation = async (targetUser) => {
    setSelectedConversation({ email: targetUser.email });
    setShowNewMessage(false);
  };

  const markAsRead = async (msg) => {
    if (msg.receiver_email === user?.email && !msg.is_read) {
      try {
        await base44.entities.InboxMessage.update(msg.id, { is_read: true });
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      selectedMessages.forEach(markAsRead);
    }
  }, [selectedConversation, selectedMessages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Mensagens
            </h1>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <Card className="rounded-2xl shadow-xl">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 text-[#0056ff] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Conteúdo Exclusivo</h2>
              <p className="text-slate-600 mb-6">
                O Inbox de Mensagens é exclusivo para assinantes Premium e Recrutadores.
              </p>
              <Link to={createPageUrl('Subscription')}>
                <Button size="lg" className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-8">
                  <Crown className="w-5 h-5 mr-2" />
                  Adquira o Premium para Desbloquear
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Mensagens
            </h1>
            <Button onClick={() => setShowNewMessage(true)} className="bg-white text-[#0056ff] hover:bg-white/90 rounded-xl">
              Nova Mensagem
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <Card className="rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Lista de Conversas */}
            <div className="border-r">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Buscar conversas..." className="pl-10 rounded-xl" />
                </div>
              </div>
              <ScrollArea className="h-[calc(600px-73px)]">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Nenhuma conversa ainda</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const convUser = users.find(u => u.email === conv.email);
                    return (
                      <button
                        key={conv.email}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b ${
                          selectedConversation?.email === conv.email ? 'bg-blue-50' : ''
                        }`}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={convUser?.profile_photo} />
                          <AvatarFallback className="bg-[#0056ff] text-white">
                            {convUser?.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800 truncate">{convUser?.full_name || conv.email}</p>
                            <span className="text-xs text-slate-400">{getTimeAgo(conv.lastMessage?.created_date)}</span>
                          </div>
                          <p className="text-sm text-slate-500 truncate">{conv.lastMessage?.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {conv.status === 'pending' && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pendente</Badge>
                            )}
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-[#0056ff] text-white text-xs">{conv.unreadCount}</Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </div>

            {/* Área de Mensagens */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header da Conversa */}
                  <div className="p-4 border-b flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedUser?.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {selectedUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-800">{selectedUser?.full_name || selectedConversation.email}</p>
                        <p className="text-xs text-slate-500">{selectedConversation.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setMessageToReport(selectedMessages[selectedMessages.length - 1]);
                            setShowReportDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Denunciar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleRejectConversation} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Pending Actions */}
                  {selectedConversation.status === 'pending' && (
                    <div className="p-4 bg-yellow-50 border-b flex items-center justify-between">
                      <p className="text-sm text-yellow-700">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        Nova solicitação de mensagem
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={handleAcceptConversation} size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg">
                          <Check className="w-4 h-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button onClick={handleRejectConversation} size="sm" variant="outline" className="text-red-600 border-red-200 rounded-lg">
                          <X className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {selectedMessages.map((msg) => {
                        const isOwn = msg.sender_email === user?.email;
                        return (
                          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn 
                                ? 'bg-[#0056ff] text-white' 
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                                {getTimeAgo(msg.created_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  {(selectedConversation.status === 'accepted' || selectedMessages.length === 0) && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 rounded-xl"
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={isSending || !newMessage.trim()}
                          className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                        >
                          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p>Selecione uma conversa ou inicie uma nova</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Buscar usuário..."
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {users
                  .filter(u => 
                    u.email !== user?.email && 
                    (u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) || 
                     u.email?.toLowerCase().includes(searchUser.toLowerCase()))
                  )
                  .slice(0, 20)
                  .map((u) => (
                    <button
                      key={u.email}
                      onClick={() => handleStartNewConversation(u)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={u.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {u.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-slate-800">{u.full_name || 'Usuário'}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </button>
                  ))
                }
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Denunciar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Sua denúncia será enviada para os administradores do aplicativo.
            </p>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Descreva o motivo da denúncia..."
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleReport} className="flex-1 bg-red-600 hover:bg-red-700">
                Enviar Denúncia
              </Button>
              <Button onClick={() => setShowReportDialog(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}