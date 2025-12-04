import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function InboxList({ user }) {
  const navigate = useNavigate();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['my-conversations', user?.email],
    queryFn: async () => {
      const conv1 = await base44.entities.ChatConversation.filter({ participant1_email: user.email });
      const conv2 = await base44.entities.ChatConversation.filter({ participant2_email: user.email });
      
      // Combinar e ordenar por data
      const all = [...conv1, ...conv2];
      return all.sort((a, b) => new Date(b.last_message_date || b.created_date) - new Date(a.last_message_date || a.created_date));
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  const handleOpenChat = (conv) => {
    const isParticipant1 = conv.participant1_email === user.email;
    const otherEmail = isParticipant1 ? conv.participant2_email : conv.participant1_email;
    const otherName = isParticipant1 ? conv.participant2_name : conv.participant1_name;
    const otherPhoto = isParticipant1 ? conv.participant2_photo : conv.participant1_photo;
    
    navigate(createPageUrl('Chat') + `?conv=${conv.id}&to=${encodeURIComponent(otherEmail)}&name=${encodeURIComponent(otherName || 'Usuário')}&photo=${encodeURIComponent(otherPhoto || '')}`);
  };

  const getUnreadCount = (conv) => {
    const isParticipant1 = conv.participant1_email === user.email;
    return isParticipant1 ? (conv.unread_count_1 || 0) : (conv.unread_count_2 || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-[#0056ff]" />
        <h2 className="font-semibold text-slate-800">Suas Conversas</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
        </div>
      ) : conversations.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma conversa ainda.</p>
            <p className="text-sm text-slate-400">Vá até a aba "Usuários" para iniciar uma conversa.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const isParticipant1 = conv.participant1_email === user.email;
            const otherName = isParticipant1 ? conv.participant2_name : conv.participant1_name;
            const otherPhoto = isParticipant1 ? conv.participant2_photo : conv.participant1_photo;
            const unread = getUnreadCount(conv);

            return (
              <Card 
                key={conv.id} 
                className="rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenChat(conv)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={otherPhoto} />
                        <AvatarFallback className="bg-[#0056ff] text-white">
                          {otherName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {unread > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {unread}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800 truncate">{otherName || 'Usuário'}</p>
                        {conv.last_message_date && (
                          <span className="text-xs text-slate-400">
                            {moment(conv.last_message_date).fromNow()}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-sm text-slate-500 truncate">{conv.last_message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}