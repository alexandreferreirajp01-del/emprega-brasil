import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, Send, Loader2, Image, Search, MoreVertical, Check, CheckCheck
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function DirectMessages() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const withEmail = urlParams.get('with');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.email);
      const interval = setInterval(() => loadMessages(selectedChat.email), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadData(currentUser.email);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadData = async (email) => {
    try {
      const [messagesData, usersData] = await Promise.all([
        base44.entities.DirectMessage.list('-created_date', 500),
        base44.entities.User.list('-created_date', 500)
      ]);
      
      setAllUsers(usersData || []);
      
      // Group by conversation
      const convMap = {};
      messagesData?.forEach(msg => {
        const otherEmail = msg.sender_email === email ? msg.receiver_email : msg.sender_email;
        if (!convMap[otherEmail]) {
          convMap[otherEmail] = {
            email: otherEmail,
            lastMessage: msg,
            unread: 0
          };
        }
        if (msg.receiver_email === email && !msg.is_read) {
          convMap[otherEmail].unread++;
        }
      });
      
      const convList = Object.values(convMap).sort((a, b) => 
        new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
      );
      setConversations(convList);
      
      // Auto-select if withEmail param
      if (withEmail) {
        const targetUser = usersData?.find(u => u.email === withEmail);
        if (targetUser) {
          setSelectedChat({ email: withEmail, user: targetUser });
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const loadMessages = async (otherEmail) => {
    try {
      const allMessages = await base44.entities.DirectMessage.list('-created_date', 500);
      const chatMessages = allMessages?.filter(m => 
        (m.sender_email === user.email && m.receiver_email === otherEmail) ||
        (m.sender_email === otherEmail && m.receiver_email === user.email)
      ).reverse();
      setMessages(chatMessages || []);
      
      // Mark as read
      const unreadMessages = chatMessages?.filter(m => 
        m.receiver_email === user.email && !m.is_read
      );
      unreadMessages?.forEach(async (m) => {
        await base44.entities.DirectMessage.update(m.id, { is_read: true });
      });
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !selectedChat) return;
    
    setIsSending(true);
    try {
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_name: user.full_name,
        sender_photo: user.profile_photo,
        receiver_email: selectedChat.email,
        content: newMessage.trim()
      });
      setNewMessage('');
      loadMessages(selectedChat.email);
    } catch (e) {
      alert('Erro ao enviar mensagem');
    }
    setIsSending(false);
  };

  const selectConversation = (conv) => {
    const targetUser = allUsers.find(u => u.email === conv.email);
    setSelectedChat({ email: conv.email, user: targetUser });
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    const targetUser = allUsers.find(u => u.email === c.email);
    return targetUser?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Chat View
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b">
          <div className="flex items-center gap-3 p-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link 
              to={`${createPageUrl('SocialProfile')}?email=${selectedChat.email}`}
              className="flex items-center gap-3 flex-1"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedChat.user?.profile_photo} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {selectedChat.user?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{selectedChat.user?.full_name}</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={selectedChat.user?.profile_photo} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                  {selectedChat.user?.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold">{selectedChat.user?.full_name}</p>
              <p className="text-sm text-slate-500">Comece uma conversa!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_email === user.email;
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-white text-slate-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                      <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                        {moment(msg.created_date).format('HH:mm')}
                      </span>
                      {isMe && (
                        msg.is_read ? (
                          <CheckCheck className="w-3 h-3 text-white/70" />
                        ) : (
                          <Check className="w-3 h-3 text-white/70" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mensagem..."
            className="flex-1 rounded-full bg-slate-100 border-0"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="rounded-full bg-blue-500 hover:bg-blue-600"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Conversations List
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg flex-1">{user?.full_name}</h1>
        </div>
        
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar"
              className="pl-10 rounded-full bg-slate-100 border-0"
            />
          </div>
        </div>
      </header>

      {/* Conversations */}
      <div className="divide-y">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma conversa ainda</p>
            <Link to={createPageUrl('ExploreUsers')}>
              <Button variant="link" className="text-blue-500">
                Encontrar pessoas
              </Button>
            </Link>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const targetUser = allUsers.find(u => u.email === conv.email);
            return (
              <button
                key={conv.email}
                onClick={() => selectConversation(conv)}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 text-left"
              >
                <Avatar className="w-14 h-14">
                  <AvatarImage src={targetUser?.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {targetUser?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{targetUser?.full_name}</p>
                    <span className="text-xs text-slate-400">
                      {moment(conv.lastMessage.created_date).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {conv.lastMessage.sender_email === user.email ? 'Você: ' : ''}
                    {conv.lastMessage.content}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">{conv.unread}</span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}