import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Search, X, Circle, Crown, Shield, Briefcase,
  MessageCircle, Eye, UserCheck, Wifi, WifiOff
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import UserProfileViewModal from "./UserProfileViewModal";
import AdminSendMessageModal from "./AdminSendMessageModal";

const PLAN_CONFIG = {
  dono:      { label: 'Dono',       color: 'bg-purple-100 text-purple-700 border-purple-200',  dot: 'bg-purple-500',  icon: Crown },
  admin:     { label: 'Admin',      color: 'bg-red-100 text-red-700 border-red-200',            dot: 'bg-red-500',     icon: Shield },
  premium:   { label: 'Premium',    color: 'bg-amber-100 text-amber-700 border-amber-200',      dot: 'bg-amber-500',   icon: Crown },
  recruiter: { label: 'Recrutador', color: 'bg-blue-100 text-blue-700 border-blue-200',         dot: 'bg-blue-500',    icon: Briefcase },
  basic:     { label: 'Básico',     color: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-400',   icon: UserCheck },
};

function getPlan(user) {
  if (user.subscription_type === 'dono' || user.email === 'alexandreferreirajp01@gmail.com') return 'dono';
  if (user.subscription_type === 'admin' || user.role === 'admin') return 'admin';
  if (user.subscription_type === 'premium') return 'premium';
  if (user.subscription_type === 'recruiter') return 'recruiter';
  return 'basic';
}

function getInitials(user) {
  const name = user.custom_full_name || user.full_name || user.email || '?';
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function UserRow({ user, isOnline, onViewProfile, onSendMessage }) {
  const plan = getPlan(user);
  const cfg = PLAN_CONFIG[plan];
  const PlanIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl cursor-pointer group transition-colors"
      onClick={() => onViewProfile(user)}
    >
      {/* Avatar com indicador online */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
          <AvatarImage src={user.profile_photo} />
          <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
            {user.custom_full_name || user.full_name || user.email}
          </p>
          {isOnline && (
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.color}`}>
            <PlanIcon className="w-2.5 h-2.5" />
            {cfg.label}
          </span>
          {isOnline ? (
            <span className="text-[10px] text-emerald-600 font-medium">● Online</span>
          ) : (
            <span className="text-[10px] text-slate-400">Offline</span>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors"
          title="Ver perfil"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSendMessage(user); }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 transition-colors"
          title="Enviar mensagem"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

const PLAN_FILTERS = [
  { value: 'all',       label: 'Todos' },
  { value: 'online',    label: 'Online' },
  { value: 'premium',   label: 'Premium' },
  { value: 'recruiter', label: 'Recrutador' },
  { value: 'admin',     label: 'Admin' },
  { value: 'basic',     label: 'Básico' },
];

export default function OnlineUsersPanel({ adminUser, open, onClose }) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const panelRef = useRef(null);

  // Buscar sessões ativas (últimos 5 min)
  const { data: sessions = [] } = useQuery({
    queryKey: ['admin-online-sessions'],
    queryFn: async () => {
      const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const data = await base44.asServiceRole?.entities?.UserSession?.filter?.({ is_active: true }) ||
                   await base44.entities.UserSession.filter({ is_active: true });
      return Array.isArray(data) ? data.filter(s => s.updated_date >= fiveMin || s.session_start >= fiveMin) : [];
    },
    refetchInterval: 15000,
    enabled: open,
  });

  // Buscar todos os usuários
  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-all-users-panel'],
    queryFn: async () => {
      const data = await base44.entities.User.list('-created_date', 10000);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    enabled: open,
  });

  // Emails online
  const onlineEmails = new Set(sessions.map(s => s.user_email).filter(Boolean));

  // Filtrar e ordenar: online primeiro, depois por nome
  const filtered = allUsers
    .filter(u => {
      if (search) {
        const q = search.toLowerCase();
        const matchSearch = (u.full_name || '').toLowerCase().includes(q) ||
               (u.custom_full_name || '').toLowerCase().includes(q) ||
               (u.email || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      if (planFilter === 'online') return onlineEmails.has(u.email);
      if (planFilter === 'premium') return u.subscription_type === 'premium';
      if (planFilter === 'recruiter') return u.subscription_type === 'recruiter';
      if (planFilter === 'admin') return u.subscription_type === 'admin' || u.role === 'admin';
      if (planFilter === 'basic') return !['premium','recruiter','admin','dono'].includes(u.subscription_type) && u.role !== 'admin';
      return true;
    })
    .sort((a, b) => {
      const aOnline = onlineEmails.has(a.email) ? 0 : 1;
      const bOnline = onlineEmails.has(b.email) ? 0 : 1;
      if (aOnline !== bOnline) return aOnline - bOnline;
      return 0;
    });

  const onlineUsers = filtered.filter(u => onlineEmails.has(u.email));
  const offlineUsers = filtered.filter(u => !onlineEmails.has(u.email));

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const handleSendMessage = (user) => {
    setSelectedUser(user);
    setShowMessage(true);
  };

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.18 }}
            className="fixed top-20 right-4 z-[99990] w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Usuários</p>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                      <Wifi className="w-3 h-3" />
                      {onlineEmails.size} online
                    </span>
                    <span className="text-slate-400 text-[11px]">• {allUsers.length} total</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-2 pb-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar usuário..."
                  className="pl-8 h-8 text-sm rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
            </div>

            {/* Filtros de plano */}
            <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex gap-1 flex-wrap">
                {PLAN_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setPlanFilter(f.value)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                      planFilter === f.value
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            <ScrollArea className="h-[420px]">
              <div className="p-2">
                {/* Online */}
                {onlineUsers.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Online — {onlineUsers.length}
                      </span>
                    </div>
                    {onlineUsers.map(user => (
                      <UserRow
                        key={user.id}
                        user={user}
                        isOnline={true}
                        onViewProfile={handleViewProfile}
                        onSendMessage={handleSendMessage}
                      />
                    ))}
                  </>
                )}

                {/* Offline */}
                {offlineUsers.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1.5 mt-2 mb-1">
                      <WifiOff className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Offline — {offlineUsers.length}
                      </span>
                    </div>
                    {offlineUsers.map(user => (
                      <UserRow
                        key={user.id}
                        user={user}
                        isOnline={false}
                        onViewProfile={handleViewProfile}
                        onSendMessage={handleSendMessage}
                      />
                    ))}
                  </>
                )}

                {filtered.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais */}
      <UserProfileViewModal
        open={showProfile}
        onOpenChange={setShowProfile}
        targetUser={selectedUser}
      />
      {adminUser && selectedUser && (
        <AdminSendMessageModal
          open={showMessage}
          onOpenChange={setShowMessage}
          targetUser={selectedUser}
          adminUser={adminUser}
        />
      )}
    </>
  );
}