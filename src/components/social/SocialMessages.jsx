import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function SocialMessages({ user }) {
  const [search, setSearch] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['my-messages', user?.email],
    queryFn: () => base44.entities.DirectMessage.list('-created_date', 500),
    enabled: !!user
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-messages'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  // Group messages by conversation
  const conversations = useMemo(() => {
    if (!user || !messages.length) return [];
    
    const convMap = {};
    messages.forEach(msg => {
      const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
      if (!convMap[otherEmail]) {
        convMap[otherEmail] = {
          email: otherEmail,
          lastMessage: msg,
          unread: msg.receiver_email === user.email && !msg.is_read ? 1 : 0
        };
      } else {
        if (new Date(msg.created_date) > new Date(convMap[otherEmail].lastMessage.created_date)) {
          convMap[otherEmail].lastMessage = msg;
        }
        if (msg.receiver_email === user.email && !msg.is_read) {
          convMap[otherEmail].unread++;
        }
      }
    });

    return Object.values(convMap)
      .map(conv => {
        const otherUser = users.find(u => u.email === conv.email);
        return { ...conv, user: otherUser };
      })
      .filter(conv => !search || conv.user?.full_name?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [messages, users, user, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conversas..."
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Conversations */}
      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma conversa ainda.</p>
          <p className="text-sm text-slate-400 mt-1">Inicie uma conversa na aba Usuários</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Link key={conv.email} to={`${createPageUrl('SocialChat')}?email=${conv.email}`}>
              <Card className={`shadow-sm hover:shadow-md transition-shadow cursor-pointer ${conv.unread > 0 ? 'bg-blue-50/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.user?.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {conv.user?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0056ff] text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold truncate ${conv.unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                          {conv.user?.full_name || conv.email}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {moment(conv.lastMessage.created_date).fromNow()}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${conv.unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        {conv.lastMessage.sender_email === user.email ? 'Você: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}