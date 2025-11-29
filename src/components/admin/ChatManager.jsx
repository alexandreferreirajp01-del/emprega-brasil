import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User, Loader2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function ChatManager({ showToast }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async () => {
      try {
        return await base44.entities.ChatMessage.list('-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar mensagens:', e);
        return [];
      }
    },
    refetchInterval: 10000 // Atualiza a cada 10 segundos
  });

  // Agrupar mensagens por usuário
  const conversations = React.useMemo(() => {
    const grouped = {};
    messages.forEach(msg => {
      const key = msg.user_email;
      if (!grouped[key]) {
        grouped[key] = {
          user_email: msg.user_email,
          user_name: msg.user_name || msg.user_email,
          messages: [],
          unread: 0,
          lastMessage: null
        };
      }
      grouped[key].messages.push(msg);
      if (!msg.is_read && msg.sender === 'user') {
        grouped[key].unread++;
      }
      if (!grouped[key].lastMessage || new Date(msg.created_date) > new Date(grouped[key].lastMessage.created_date)) {
        grouped[key].lastMessage = msg;
      }
    });
    
    return Object.values(grouped).sort((a, b) => 
      new Date(b.lastMessage?.created_date || 0) - new Date(a.lastMessage?.created_date || 0)
    );
  }, [messages]);

  // Mensagens do usuário selecionado
  const selectedMessages = React.useMemo(() => {
    if (!selectedUser) return [];
    const conv = conversations.find(c => c.user_email === selectedUser);
    return conv ? conv.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) : [];
  }, [selectedUser, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  // Marcar como lido ao selecionar
  useEffect(() => {
    if (selectedUser) {
      const unreadMessages = selectedMessages.filter(m => !m.is_read && m.sender === 'user');
      unreadMessages.forEach(async (msg) => {
        try {
          await base44.entities.ChatMessage.update(msg.id, { is_read: true });
        } catch (e) {}
      });
    }
  }, [selectedUser, selectedMessages]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        user_email: selectedUser,
        user_name: 'Administrador',
        message: replyMessage.trim(),
        sender: 'admin',
        conversation_id: selectedUser,
        is_read: true
      });
      
      setReplyMessage('');
      refetch();
      showToast?.('Mensagem enviada!');
    } catch (e) {
      showToast?.('Erro ao enviar mensagem', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#0056ff]" />
          Chat com Usuários
          {totalUnread > 0 && (
            <Badge className="bg-red-500 text-white border-0">{totalUnread} nova(s)</Badge>
          )}
        </h3>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
        {/* Lista de conversas */}
        <Card className="rounded-xl md:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Conversas ({conversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              {conversations.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">Nenhuma conversa</p>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.user_email}
                      onClick={() => setSelectedUser(conv.user_email)}
                      className={`w-full p-3 rounded-xl text-left transition-colors ${
                        selectedUser === conv.user_email 
                          ? 'bg-[#0056ff] text-white' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={
                            selectedUser === conv.user_email ? 'bg-white/20 text-white' : 'bg-[#0056ff] text-white'
                          }>
                            {conv.user_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{conv.user_name}</p>
                            {conv.unread > 0 && (
                              <Badge className="bg-red-500 text-white border-0 text-xs h-5 w-5 p-0 flex items-center justify-center">
                                {conv.unread}
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs truncate ${
                            selectedUser === conv.user_email ? 'text-white/70' : 'text-slate-500'
                          }`}>
                            {conv.lastMessage?.message?.substring(0, 30)}...
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de mensagens */}
        <Card className="rounded-xl md:col-span-2">
          <CardContent className="p-0 h-full flex flex-col">
            {selectedUser ? (
              <>
                {/* Header do chat */}
                <div className="p-4 border-b bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-[#0056ff] text-white">
                        {conversations.find(c => c.user_email === selectedUser)?.user_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {conversations.find(c => c.user_email === selectedUser)?.user_name}
                      </p>
                      <p className="text-xs text-slate-500">{selectedUser}</p>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {selectedMessages.map((msg, i) => (
                      <div key={msg.id || i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.sender === 'admin'
                            ? 'bg-[#0056ff] text-white rounded-br-sm'
                            : msg.sender === 'bot'
                            ? 'bg-purple-100 text-purple-800 rounded-bl-sm'
                            : 'bg-white text-slate-700 shadow-sm rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'admin' ? 'text-white/60' : 'text-slate-400'
                          }`}>
                            {formatTime(msg.created_date)}
                            {msg.sender === 'bot' && ' • Bot'}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                      placeholder="Digite sua resposta..."
                      className="rounded-full"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || sending}
                      className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-10 w-10"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecione uma conversa</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}