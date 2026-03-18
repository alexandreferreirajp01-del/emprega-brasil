import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Briefcase, Check, Newspaper, Gift, Sparkles, MessageCircle, Trash2, User, Users, BellRing, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell({ user, className }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar notificações e mensagens não lidas
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['user-notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const [personal, global] = await Promise.all([
          base44.entities.Notification.filter(
            { user_email: user.email },
            '-created_date',
            50
          ).catch(() => []),
          base44.entities.Notification.filter(
            { sent_to_all: true },
            '-created_date',
            50
          ).catch(() => []),
        ]);
        // Merge and deduplicate by id
        const all = [...(personal || []), ...(global || [])];
        const seen = new Set();
        return all.filter(n => {
          if (seen.has(n.id)) return false;
          seen.set(n.id, true);
          return true;
        });
      } catch (e) {
        return [];
      }
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
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
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['user-notifications'] });
      await refetchNotifications();
    }
  });

  const markAllAsRead = async () => {
    const unread = uniqueNotifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    
    try {
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
      
      // Limpar cache e forçar recarga
      queryClient.removeQueries({ queryKey: ['user-notifications'] });
      await refetchNotifications();
    } catch (e) {
      console.error('Erro ao marcar como lido:', e);
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    try {
      // Deletar TODAS as notificações do usuário, não apenas as únicas
      await Promise.all(notifications.map(n => 
        base44.entities.Notification.delete(n.id)
      ));
      
      // Limpar cache e forçar recarga
      queryClient.removeQueries({ queryKey: ['user-notifications'] });
      await refetchNotifications();
      
      // Fechar o popover após limpar
      setTimeout(() => setOpen(false), 500);
    } catch (e) {
      console.error('Erro ao deletar notificações:', e);
    }
  };

  const deleteNotification = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await base44.entities.Notification.delete(notificationId);
      queryClient.removeQueries({ queryKey: ['user-notifications'] });
      await refetchNotifications();
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
      case 'promo': return 'bg-[#1E6FB6]/10 text-[#1E6FB6]';
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
          return createPageUrl('Home');
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

    // 6. Notificações de vagas sem job_id específico
    if (notification.type === 'job') {
      return createPageUrl('Jobs');
    }

    // 7. Notificações de notícias sem news_id específico
    if (notification.type === 'news') {
      return createPageUrl('News');
    }

    // 8. Notificações de promoção
    if (notification.type === 'promo') {
      return createPageUrl('Premium');
    }

    // Fallback final: sempre direcionar para Home
    return createPageUrl('Home');
  };

  const handleNotificationClick = (notification) => {
    const url = getRedirectUrl(notification);

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
          className={`relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 ${className || ''}`}
        >
          <motion.div 
            className="relative w-6 h-6 flex items-center justify-center"
            animate={unreadCount > 0 ? { 
              rotate: [0, -15, 15, -15, 15, 0],
            } : {}}
            transition={{
              duration: 0.6,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 3,
            }}
          >
            {unreadCount > 0 ? (
              <BellRing className="w-5 h-5 text-[#1E6FB6] dark:text-orange-500" />
            ) : (
              <Bell className="w-5 h-5 text-[#1D2226] dark:text-slate-400" />
            )}
            
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-lg z-10"
                  style={{ lineHeight: '1' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>

            {unreadCount > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full bg-[#1E6FB6] dark:bg-orange-500 -z-10"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
            )}
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0 max-h-[80vh] flex flex-col dark:bg-slate-800 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl" 
        align="end"
        sideOffset={8}
      >
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-b dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-[#1E6FB6] to-[#1D4371] sticky top-0 z-10 rounded-t-2xl"
        >
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">Notificações</h3>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full"
              >
                {unreadCount}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs text-white hover:bg-white/10 hover:text-white"
              >
                <Check className="w-3 h-3 mr-1" />
                Marcar todas
              </Button>
            )}
            {uniqueNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={deleteAllNotifications}
                className="text-xs text-white hover:bg-red-500/20 hover:text-white"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </motion.div>

        <ScrollArea className="flex-1 max-h-[400px] overflow-y-auto">
          {uniqueNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center text-slate-400 dark:text-slate-500"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              </motion.div>
              <p className="text-sm">Nenhuma notificação</p>
            </motion.div>
          ) : (
            <div className="p-2 space-y-1">
              <AnimatePresence>
                {uniqueNotifications.slice(0, 30).map((notification, index) => {
                  return (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-3 transition-all duration-200 group text-left rounded-xl border hover:shadow-md hover:border-[#1E6FB6] dark:hover:border-blue-700 cursor-pointer hover:scale-[1.02] ${
                        !notification.is_read 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                          : 'bg-white dark:bg-slate-800 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${getIconStyle(notification.type)}`}
                        >
                          {notification.icon_url ? (
                            <img src={notification.icon_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            getNotificationIcon(notification)
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 dark:text-white line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            {formatTimeAgo(notification.created_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2.5 h-2.5 bg-gradient-to-br from-[#1E6FB6] to-[#1D4371] rounded-full flex-shrink-0 shadow-sm"
                            />
                          )}
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => deleteNotification(e, notification.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {uniqueNotifications.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 border-t dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 sticky bottom-0 rounded-b-2xl"
          >
            <Button 
              variant="ghost" 
              className="w-full text-[#1E6FB6] dark:text-blue-400 text-sm font-semibold hover:bg-white dark:hover:bg-slate-700 transition-all"
              onClick={() => {
                navigate(createPageUrl('Notifications'));
                setOpen(false);
              }}
            >
              Ver todas as notificações
            </Button>
          </motion.div>
        )}
      </PopoverContent>
    </Popover>
  );
}