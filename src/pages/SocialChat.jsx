import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function SocialChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get('email');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const { data: targetUser } = useQuery({
    queryKey: ['target-user', targetEmail],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: targetEmail });
      return users[0];
    },
    enabled: !!targetEmail
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-messages', user?.email, targetEmail],
    queryFn: () => base44.entities.DirectMessage.list('-created_date', 500),
    enabled: !!user && !!targetEmail,
    refetchInterval: 3000
  });

  // Filter messages for this conversation
  const chatMessages = messages
    .filter(m => 
      (m.sender_email === user?.email && m.receiver_email === targetEmail) ||
      (m.sender_email === targetEmail && m.receiver_email === user?.email)
    )
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  // Mark messages as read
  useEffect(() => {
    if (user && chatMessages.length > 0) {
      chatMessages.forEach(async (msg) => {
        if (msg.receiver_email === user.email && !msg.is_read) {
          await base44.entities.DirectMessage.update(msg.id, { is_read: true });
        }
      });
    }
  }, [chatMessages, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMutation = useMutation({
    mutationFn: (content) => base44.entities.DirectMessage.create({
      sender_email: user.email,
      sender_name: user.full_name,
      sender_photo: user.profile_photo,
      receiver_email: targetEmail,
      content
    }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    }
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage.trim());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-3 p-4">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to={`${createPageUrl('SocialProfile')}?email=${targetEmail}`} className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={targetUser?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {targetUser?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{targetUser?.full_name || 'Usuário'}</p>
              <p className="text-xs text-slate-500">Toque para ver perfil</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm mt-1">Envie a primeira mensagem!</p>
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.sender_email === user?.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-[#0056ff] text-white rounded-br-md' 
                      : 'bg-white shadow-sm rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {moment(msg.created_date).format('HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-safe">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-full bg-slate-100 border-0"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] w-10 h-10 p-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}