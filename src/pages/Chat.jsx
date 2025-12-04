import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function Chat() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Parse URL params
  const urlParams = new URLSearchParams(window.location.search);
  const toEmail = urlParams.get('to');
  const toName = decodeURIComponent(urlParams.get('name') || 'Usuário');
  const toPhoto = decodeURIComponent(urlParams.get('photo') || '');
  const convIdParam = urlParams.get('conv');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Find or create conversation
  useEffect(() => {
    const findOrCreateConversation = async () => {
      if (!user?.email || !toEmail) return;

      if (convIdParam) {
        setConversationId(convIdParam);
        return;
      }

      // Search for existing conversation
      try {
        const conv1 = await base44.entities.ChatConversation.filter({
          participant1_email: user.email,
          participant2_email: toEmail
        });
        
        if (conv1.length > 0) {
          setConversationId(conv1[0].id);
          return;
        }

        const conv2 = await base44.entities.ChatConversation.filter({
          participant1_email: toEmail,
          participant2_email: user.email
        });

        if (conv2.length > 0) {
          setConversationId(conv2[0].id);
          return;
        }

        // Create new conversation
        const newConv = await base44.entities.ChatConversation.create({
          participant1_email: user.email,
          participant1_name: user.full_name || 'Usuário',
          participant1_photo: user.profile_photo || '',
          participant2_email: toEmail,
          participant2_name: toName,
          participant2_photo: toPhoto,
          last_message: '',
          last_message_date: new Date().toISOString(),
          unread_count_1: 0,
          unread_count_2: 0
        });

        setConversationId(newConv.id);
      } catch (err) {
        console.error('Erro ao criar conversa:', err);
      }
    };

    findOrCreateConversation();
  }, [user, toEmail, convIdParam]);

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => base44.entities.ChatMsg.filter({ conversation_id: conversationId }, 'created_date'),
    enabled: !!conversationId,
    refetchInterval: 2000,
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!conversationId || !user?.email) return;
      
      const unreadMessages = messages.filter(m => 
        m.receiver_email === user.email && !m.is_read
      );

      for (const msg of unreadMessages) {
        await base44.entities.ChatMsg.update(msg.id, { is_read: true });
      }
    };

    markAsRead();
  }, [messages, user, conversationId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const msg = await base44.entities.ChatMsg.create({
        conversation_id: conversationId,
        sender_email: user.email,
        sender_name: user.full_name || 'Usuário',
        sender_photo: user.profile_photo || '',
        receiver_email: toEmail,
        content,
        is_read: false
      });

      // Update conversation
      await base44.entities.ChatConversation.update(conversationId, {
        last_message: content.substring(0, 100),
        last_message_date: new Date().toISOString()
      });

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      setNewMessage('');
    },
  });

  const handleSend = () => {
    if (!newMessage.trim() || !conversationId) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Comunidade')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={toPhoto} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {toName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{toName}</p>
              <p className="text-xs text-slate-500">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhuma mensagem ainda. Diga olá!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_email === user?.email;
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                    <div 
                      className={`px-4 py-2 rounded-2xl ${
                        isMe 
                          ? 'bg-[#0056ff] text-white rounded-br-md' 
                          : 'bg-white text-slate-800 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className={`text-xs text-slate-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                      {moment(msg.created_date).format('HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}