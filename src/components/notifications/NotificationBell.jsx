import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Briefcase, Check, Newspaper, Gift, Sparkles, MessageCircle, Trash2, User, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const personal = await base44.entities.Notification.filter(
          { user_email: user.email },
          '-created_date',
          100
        ) || [];
        return personal;
      } catch (e) {
        return [];
      }
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const uniqueNotifications = useMemo(() => {
    const seen = new Map();
    
    return notifications
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .filter(n => {
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

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  const markAllAsRead = async () => {
    const unread = uniqueNotifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => 
      base44.entities.Notification.update(n.id, { is_read: true }).catch(() => {})
    ));
    queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
  };

  const deleteNotification = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await base44.entities.Notification.delete(notificationId);
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    } catch (e) {}
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
      case 'user': return <User className="w-5 h-5" />;
      case 'feed': return <MessageCircle className="w-5 h-5" />;
      case 'admin': return <Users className="w-5 h-5" />;
      case 'highlight': return <Sparkles className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  const getIconStyle = (type) => {
    switch (type) {
      case 'news': return 'bg-[#057642]/10 text-[#057642]';
      case 'promo': return 'bg-[#0A66C2]/10 text-[#0A66C2]';
      case 'user': return 'bg-purple-100 text-purple-600';
      case 'feed': return 'bg-blue-100 text-blue-600';
      case 'admin': return 'bg-orange-100 text-orange-600';
      case 'highlight': return 'bg-[#F9C846]/10 text-[#F9C846]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getRedirectUrl = (notification) => {
    // 1. redirect_url tem prioridade absoluta (URL completa)
    if (notification.redirect_url) {
      return notification.redirect_url;
    }

    // 2. redirect_page tem prioridade seguinte
    if (notification.redirect_page) {
      const params = notification.redirect_params || {};
      // Converter arrays para strings (ids em array)
      const processedParams = Object.fromEntries(
        Object.entries(params).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : value
        ])
      );
      const queryString = Object.keys(processedParams).length > 0 
        ? '?' + new URLSearchParams(processedParams).toString() 
        : '';
      return createPageUrl(notification.redirect_page) + queryString;
    }

    // 3. reference_type + reference_id - SEMPRE detalhe específico
    if (notification.reference_type && notification.reference_id) {
      switch (notification.reference_type) {
        case 'job':
          return createPageUrl('JobDetail') + '?id=' + notification.reference_id;
        case 'news':
          return createPageUrl('NewsDetail') + '?id=' + notification.reference_id;
        case 'user':
          return createPageUrl('GerenciarUsuarios');
        case 'feed_post':
        case 'feed_comment':
          return createPageUrl('Feed');
        case 'occurrence':
          return createPageUrl('Ocorrencias');
        case 'chat':
          return createPageUrl('ResponderChat');
        case 'request':
          return createPageUrl('GerenciarSolicitacoes');
        case 'payment':
          return createPageUrl('PaymentsPage');
        default:
          return null;
      }
    }

    // 4. job_id - SEMPRE detalhe da vaga
    if (notification.job_id) {
      return createPageUrl('JobDetail') + '?id=' + notification.job_id;
    }

    // 5. Notificações admin/user sem referência
    if (notification.type === 'admin' || notification.type === 'user') {
      return createPageUrl('GerenciarUsuarios');
    }

    // Sem referência = não clicável
    return null;
  };

  const handleNotificationClick = (notification) => {
    const url = getRedirectUrl(notification);
    
    // Só processa se houver URL válida
    if (!url) return;
    
    // Marcar como lida
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Fechar popover e navegar
    setOpen(false);
    setTimeout(() => {
      window.location.href = url;
    }, 50);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Bell className="w-5 h-5 text-[#1D2226] dark:text-orange-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 dark:bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0 max-h-[80vh] flex flex-col dark:bg-slate-800 dark:border-slate-700 rounded-2xl overflow-hidden" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10 rounded-t-2xl">
          <h3 className="font-semibold text-slate-800 dark:text-white">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-[#0A66C2] hover:text-[#004182]"
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 max-h-[400px] overflow-y-auto">
          {uniqueNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700 p-2 space-y-2">
              {uniqueNotifications.slice(0, 30).map((notification) => {
                const redirectUrl = getRedirectUrl(notification);
                const isClickable = !!redirectUrl;

                return (
                  <button
                    key={notification.id}
                    onClick={() => isClickable && handleNotificationClick(notification)}
                    className={`w-full p-3 transition-colors group text-left rounded-xl border border-transparent ${!notification.is_read ? 'bg-slate-200 dark:bg-slate-700/30' : ''} ${isClickable ? 'hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-600 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyle(notification.type)}`}>
                        {notification.icon_url ? (
                          <img src={notification.icon_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          getNotificationIcon(notification)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 dark:text-white line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {formatTimeAgo(notification.created_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-[#0A66C2] rounded-full flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => deleteNotification(e, notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {uniqueNotifications.length > 0 && (
          <div className="p-2 border-t dark:border-slate-700 bg-white dark:bg-slate-800 sticky bottom-0 rounded-b-2xl">
            <Button 
              variant="ghost" 
              className="w-full text-[#0A66C2] dark:text-blue-400 text-sm"
              onClick={() => {
                navigate(createPageUrl('Notifications'));
                setOpen(false);
              }}
            >
              Ver todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}