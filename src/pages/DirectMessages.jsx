import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Send, Loader2, MessageSquare, Search,
  Image, Check, CheckCheck
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserBadge from "@/components/social/UserBadge";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function DirectMessages() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const withEmail = urlParams.get('with');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadData(currentUser);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadData = async (currentUser) => {
    try {
      const [messagesData, usersData] = await Promise.all([
        base44.entities.DirectMessage.filter({
          $or: [
            { sender_email: currentUser.email },
            { receiver_email: currentUser.email }
          ]
        }, '-created_date', 500),
        base44.entities.User.list('-created_date', 500)
      ]);

      setAllUsers(usersData || []);

      // Group messages by conversation
      const convMap = {};
      (messagesData || []).forEach(msg => {
        const otherEmail = msg.sender_email === currentUser.email 
          ? msg.receiver_email 
          : msg.sender_email;
        
        if (!convMap[otherEmail]) {
          convMap[otherEmail] = {
            email: otherEmail,
            user: usersData?.find(u => u.email === otherEmail),
            messages: [],
            lastMessage: null,
            unread: 0
          };
        }
        convMap[otherEmail].messages.push(msg);
        if (!convMap[otherEmail].lastMessage || new Date(msg.created_date) > new Date(convMap[otherEmail].lastMessage.created_date)) {
          convMap[otherEmail].lastMessage = msg;
        }
        if (msg.receiver_email === currentUser.email && !msg.is_read) {
          convMap[otherEmail].unread++;
        }
      });

      const sortedConvs = Object.values(convMap).sort((a, b) => 
        new Date(b.lastMessage?.created_date) - new Date(a.lastMessage?.created_date)
      );
      setConversations(sortedConvs);

      // Open chat if specified in URL
      if (withEmail) {
        const existingConv = sortedConvs.find(c => c.email === withEmail);
        if (existingConv) {
          openChat(existingConv);
        } else {
          const targetUser = usersData?.find(u => u.email === withEmail);
          if (targetUser) {
            setSelectedChat({
              email: withEmail,
              user: targetUser,
              messages: [],
              isNew: true
            });
          }
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const openChat = async (conv) => {
    setSelectedChat(conv);
    setMessages(conv.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    
    // Mark as read
    const unreadMessages = conv.messages.filter(m => 
      m.receiver_email === user.email && !m.is_read
    );
    for (const msg of unreadMessages) {
      try {
        await base44.entities.DirectMessage.update(msg.id, { is_read: true });
      } catch (e) {}
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    try {
      const msg = await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_name: user.full_name,
        sender_photo: user.profile_photo,
        receiver_email: selectedChat.email,
        content: newMessage.trim(),
        is_read: false,
        conversation_status: 'accepted'
      });
      
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (e) {
      alert('Erro ao enviar mensagem');
    }
    setIsSending(false);
  };

  const filteredConversations = conversations.filter(c =>
    c.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  // Chat View
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedChat(null)}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link 
              to={`${createPageUrl('SocialProfile')}?email=${selectedChat.email}`}
              className="flex items-center gap-3 flex-1"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedChat.user?.profile_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white">
                  {selectedChat.user?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-800">{selectedChat.user?.full_name}</p>
                <UserBadge user={selectedChat.user} />
              </div>
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={selectedChat.user?.profile_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white text-2xl">
                  {selectedChat.user?.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold text-slate-800">{selectedChat.user?.full_name}</p>
              <p className="text-sm text-slate-500 mt-1">Inicie uma conversa</p>
            </div>
          )}
          
          {messages.map((msg, idx) => {
            const isMe = msg.sender_email === user.email;
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-[#0056ff] text-white' 
                      : 'bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                    <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                      {moment(msg.created_date).format('HH:mm')}
                    </span>
                    {isMe && (
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

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escreva uma mensagem..."
              className="flex-1 rounded-full bg-slate-100 border-0"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className="rounded-full bg-[#0056ff] hover:bg-[#0044cc]"
            >
              {isSending ? (
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

  // Conversations List
  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Social')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-slate-800">Mensagens</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar conversas..."
            className="pl-10 rounded-xl bg-white border-0 shadow-sm"
          />
        </div>

        {/* Conversations */}
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma conversa ainda</p>
              <p className="text-sm text-slate-400 mt-1">
                Inicie uma conversa pelo perfil de um usuário
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map(conv => (
              <Card 
                key={conv.email}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => openChat(conv)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={conv.user?.profile_photo} />
                      <AvatarFallback className="bg-[#0056ff] text-white">
                        {conv.user?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800 truncate">
                          {conv.user?.full_name}
                        </p>
                        <span className="text-xs text-slate-500">
                          {moment(conv.lastMessage?.created_date).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {conv.lastMessage?.sender_email === user.email ? 'Você: ' : ''}
                        {conv.lastMessage?.content}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="w-5 h-5 bg-[#0056ff] rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">{conv.unread}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}