import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function SocialMessages({ user }) {
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados
  const loadData = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const [fetchedMessages, fetchedUsers] = await Promise.all([
        base44.entities.DirectMessage.list('-created_date', 1000),
        base44.entities.User.list('-created_date', 1000)
      ]);
      
      setMessages(fetchedMessages || []);
      setUsers(fetchedUsers || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Atualizar a cada 5 segundos
    const interval = setInterval(() => loadData(), 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Agrupar conversas
  const conversations = useMemo(() => {
    if (!user || !messages.length) return [];
    
    const convMap = {};
    
    messages.forEach(msg => {
      // Determinar o outro usuário da conversa
      const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
      
      if (!otherEmail) return;
      
      if (!convMap[otherEmail]) {
        convMap[otherEmail] = {
          email: otherEmail,
          lastMessage: msg,
          unreadCount: 0,
          messages: []
        };
      }
      
      convMap[otherEmail].messages.push(msg);
      
      // Atualizar última mensagem se for mais recente
      if (new Date(msg.created_date) > new Date(convMap[otherEmail].lastMessage.created_date)) {
        convMap[otherEmail].lastMessage = msg;
      }
      
      // Contar não lidas
      if (msg.receiver_email === user.email && !msg.is_read) {
        convMap[otherEmail].unreadCount++;
      }
    });

    // Associar dados do usuário e ordenar
    return Object.values(convMap)
      .map(conv => {
        const otherUser = users.find(u => u.email === conv.email);
        return { 
          ...conv, 
          user: otherUser,
          displayName: otherUser?.full_name || conv.email?.split('@')[0] || 'Usuário'
        };
      })
      .filter(conv => {
        if (!search) return true;
        return conv.displayName.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [messages, users, user, search]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header com busca e refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Lista de conversas */}
      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Nenhuma conversa</p>
          <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
            Vá até a aba Usuários e envie uma mensagem para começar uma conversa
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Link 
              key={conv.email} 
              to={`${createPageUrl('SocialChat')}?email=${conv.email}`}
            >
              <Card className={`shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${
                conv.unreadCount > 0 ? 'border-l-[#0056ff] bg-blue-50/30' : 'border-l-transparent'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-14 h-14 ring-2 ring-slate-100">
                        <AvatarImage src={conv.user?.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white font-semibold text-lg">
                          {conv.displayName[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-[#0056ff] text-white text-xs rounded-full flex items-center justify-center font-semibold px-1">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                          {conv.displayName}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {moment(conv.lastMessage.created_date).fromNow()}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-1 ${conv.unreadCount > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {conv.lastMessage.sender_email === user.email ? (
                          <span className="text-slate-400">Você: </span>
                        ) : null}
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