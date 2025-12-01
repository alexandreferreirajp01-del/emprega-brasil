import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Briefcase, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Buscar notificações do usuário
  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.Notification.filter(
          { user_email: user.email },
          '-created_date',
          50
        ) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!user?.email,
    refetchInterval: 15000, // Atualiza a cada 15 segundos
  });

  // Buscar notificações globais (enviadas para todos)
  const { data: globalNotifications = [] } = useQuery({
    queryKey: ['global-notifications'],
    queryFn: async () => {
      try {
        return await base44.entities.Notification.filter(
          { sent_to_all: true },
          '-created_date',
          50
        ) || [];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 15000,
  });

  // Combinar notificações pessoais e globais
  const allNotifications = [...notifications, ...globalNotifications]
    .filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  // Marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['global-notifications'] });
    }
  });

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    const unread = allNotifications.filter(n => !n.is_read);
    for (const n of unread) {
      try {
        await base44.entities.Notification.update(n.id, { is_read: true });
      } catch (e) {
        // Ignorar erros individuais
      }
    }
    queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['global-notifications'] });
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return past.toLocaleDateString('pt-BR');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-slate-100"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-[#0056ff] hover:text-[#0044cc]"
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {allNotifications.slice(0, 20).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.job_id ? `${createPageUrl('JobDetail')}?id=${notification.job_id}` : '#'}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsReadMutation.mutate(notification.id);
                    }
                    setOpen(false);
                  }}
                >
                  <div className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'job' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'promo' ? 'bg-purple-100 text-purple-600' :
                        notification.type === 'news' ? 'bg-green-100 text-green-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {notification.icon_url ? (
                          <img src={notification.icon_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <Briefcase className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTimeAgo(notification.created_date)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {allNotifications.length > 0 && (
          <div className="p-2 border-t">
            <Link to={createPageUrl('Jobs')} onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full text-[#0056ff] text-sm">
                Ver todas as vagas
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}