import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Bell, Briefcase, Newspaper, Gift, Sparkles, 
  MessageCircle, Users, Trash2, Check, Loader2, User
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const personal = await base44.entities.Notification.filter(
          { user_email: user.email },
          '-created_date',
          200
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
        if (seen.has(key)) return false;
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
    // Prioridade: redirect_page > reference_type > job_id
    if (notification.redirect_page) {
      const params = notification.redirect_params || {};
      const queryString = Object.keys(params).length > 0 
        ? '?' + new URLSearchParams(params).toString() 
        : '';
      return createPageUrl(notification.redirect_page) + queryString;
    }

    if (notification.reference_type && notification.reference_id) {
      switch (notification.reference_type) {
        case 'job':
          return `${createPageUrl('JobDetail')}?id=${notification.reference_id}`;
        case 'news':
          return `${createPageUrl('NewsDetail')}?id=${notification.reference_id}`;
        case 'user':
          return createPageUrl('GerenciarUsuarios');
        case 'feed_post':
          return createPageUrl('Feed');
        case 'occurrence':
          return createPageUrl('Ocorrencias');
        case 'chat':
          return createPageUrl('ResponderChat');
        case 'request':
          return createPageUrl('GerenciarSolicitacoes');
        default:
          return null;
      }
    }

    // Fallback para job_id (compatibilidade)
    if (notification.job_id) {
      return `${createPageUrl('JobDetail')}?id=${notification.job_id}`;
    }

    return null;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    const url = getRedirectUrl(notification);
    if (url) {
      navigate(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20 mb-2 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Notificações
              </h1>
              <p className="text-white/70 text-sm">
                {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                onClick={markAllAsRead}
                className="text-white hover:bg-white/20 text-sm"
              >
                <Check className="w-4 h-4 mr-2" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {uniqueNotifications.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg font-medium">Nenhuma notificação</p>
              <p className="text-slate-400 text-sm mt-2">Você está em dia!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {uniqueNotifications.map((notification) => {
              const redirectUrl = getRedirectUrl(notification);
              const isClickable = !!redirectUrl;

              return (
                <Card 
                  key={notification.id}
                  className={`rounded-2xl overflow-hidden transition-all ${isClickable ? 'cursor-pointer hover:shadow-md' : ''} ${!notification.is_read ? 'border-l-4 border-l-[#0A66C2]' : ''}`}
                  onClick={() => isClickable && handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle(notification.type)}`}>
                        {notification.icon_url ? (
                          <img src={notification.icon_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          getNotificationIcon(notification)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 line-clamp-2">
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-600 line-clamp-3 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-xs text-slate-400">
                                {formatTimeAgo(notification.created_date)}
                              </p>
                              {!notification.is_read && (
                                <Badge className="bg-[#0A66C2] text-white text-xs">Nova</Badge>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => deleteNotification(e, notification.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}