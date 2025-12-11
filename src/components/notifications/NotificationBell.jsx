import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Briefcase, Check, Newspaper, Gift, Sparkles, MessageCircle, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Buscar APENAS notificações do usuário ou globais (sent_to_all)
  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const personal = await base44.entities.Notification.filter(
          { user_email: user.email },
          '-created_date',
          100
        );
        return personal || [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.email,
    retry: false,
  });

  // Remover duplicatas baseado em título + mensagem + data (arredondada ao minuto)
  const uniqueNotifications = useMemo(() => {
    const seen = new Map();
    
    return notifications
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .filter(n => {
        // Criar chave única baseada no conteúdo
        const dateKey = n.created_date ? new Date(n.created_date).toISOString().slice(0, 16) : '';
        const key = `${n.title}_${n.message?.slice(0, 50)}_${dateKey}`;
        
        if (seen.has(key)) {
          return false;
        }
        seen.set(key, true);
        return true;
      });
  }, [notifications]);

  const unreadCount = uniqueNotifications.filter(n => !n.is_read).length;

  // Marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  const markAllAsRead = async () => {
    try {
      const unread = uniqueNotifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true }).catch(() => {})
      ));
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    } catch {}
  };

  // Deletar notificação
  const deleteNotification = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await base44.entities.Notification.delete(notificationId);
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    } catch (e) {
      // Ignorar
    }
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

  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'news': return <Newspaper className="w-5 h-5" />;
      case 'promo': return <Gift className="w-5 h-5" />;
      case 'chat': return <MessageCircle className="w-5 h-5" />;
      case 'highlight': return <Sparkles className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  const getIconStyle = (type) => {
    switch (type) {
      case 'news': return 'bg-green-100 text-green-600';
      case 'promo': return 'bg-purple-100 text-purple-600';
      case 'chat': return 'bg-blue-100 text-blue-600';
      case 'highlight': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-slate-100 text-slate-600';
    }
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
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0 max-h-[80vh] flex flex-col" 
        align="end"
        sideOffset={8}
      >
        {/* Header fixo */}
        <div className="p-3 border-b flex items-center justify-between bg-white sticky top-0 z-10">
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

        {/* Lista com scroll */}
        <ScrollArea className="flex-1 max-h-[400px] overflow-y-auto">
          {uniqueNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {uniqueNotifications.slice(0, 30).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.job_id ? `${createPageUrl('JobDetail')}?id=${notification.job_id}` : '#'}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsReadMutation.mutate(notification.id);
                    }
                    if (notification.job_id) {
                      setOpen(false);
                    }
                  }}
                >
                  <div className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer group ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyle(notification.type)}`}>
                        {notification.icon_url ? (
                          <img src={notification.icon_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          getNotificationIcon(notification)
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
                      <div className="flex items-center gap-1">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => deleteNotification(e, notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer fixo */}
        {uniqueNotifications.length > 0 && (
          <div className="p-2 border-t bg-white sticky bottom-0">
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