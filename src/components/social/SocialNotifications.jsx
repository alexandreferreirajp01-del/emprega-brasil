import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Heart, MessageCircle, UserPlus, FileText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SocialNotifications({ user }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['social-notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.SocialNotification.filter(
        { user_email: user.email },
        '-created_date',
        50
      ) || [];
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.SocialNotification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['social-notifications-unread'] });
    },
  });

  const getIcon = (type) => {
    switch (type) {
      case 'follow': return <UserPlus className="w-4 h-4 text-[#0056ff]" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'new_post': return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-8 text-center">
          <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma notificação</h3>
          <p className="text-slate-500">Suas notificações aparecerão aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="p-0 divide-y">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            to={notification.post_id 
              ? `${createPageUrl('Social')}?post=${notification.post_id}` 
              : `${createPageUrl('SocialProfile')}?email=${notification.from_email}`
            }
            onClick={() => {
              if (!notification.is_read) {
                markAsReadMutation.mutate(notification.id);
              }
            }}
            className={`flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors ${
              !notification.is_read ? 'bg-blue-50' : ''
            }`}
          >
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={notification.from_photo} />
                <AvatarFallback className="bg-slate-200 text-slate-600">
                  {notification.from_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                {getIcon(notification.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">
                {notification.message}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {formatDate(notification.created_date)}
              </p>
            </div>
            {!notification.is_read && (
              <div className="w-2 h-2 bg-[#0056ff] rounded-full" />
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}