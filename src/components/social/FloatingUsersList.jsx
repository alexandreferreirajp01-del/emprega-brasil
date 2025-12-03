import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, X, Search, Loader2, Crown, Shield, Briefcase, Star, UserPlus, UserMinus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FloatingUsersList({ user, isOpen, onClose }) {
  const [allUsers, setAllUsers] = useState([]);
  const [follows, setFollows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [followingIds, setFollowingIds] = useState({});

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Buscar todos os dados
      const usersData = await base44.entities.User.list('-created_date', 500);
      const followsData = await base44.entities.Follow.list('-created_date', 1000);
      
      console.log('Usuários carregados:', usersData?.length);
      console.log('Follows carregados:', followsData?.length);
      
      setAllUsers(usersData || []);
      setFollows(followsData || []);
      
      // Marcar quem o usuário segue
      const myFollows = (followsData || []).filter(f => f.follower_email === user?.email);
      const followingMap = {};
      myFollows.forEach(f => { followingMap[f.following_email] = f.id; });
      setFollowingIds(followingMap);
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
      setAllUsers([]);
      setFollows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetEmail) => {
    try {
      if (followingIds[targetEmail]) {
        // Deixar de seguir
        await base44.entities.Follow.delete(followingIds[targetEmail]);
        setFollowingIds(prev => {
          const newMap = { ...prev };
          delete newMap[targetEmail];
          return newMap;
        });
      } else {
        // Seguir
        const newFollow = await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail,
          status: 'accepted'
        });
        setFollowingIds(prev => ({ ...prev, [targetEmail]: newFollow.id }));
        
        // Notificar
        await base44.entities.SocialNotification.create({
          user_email: targetEmail,
          from_email: user.email,
          from_name: user.full_name,
          from_photo: user.profile_photo,
          type: 'follow',
          message: `${user.full_name || 'Alguém'} começou a seguir você`
        });
      }
    } catch (e) {
      console.error('Erro:', e);
    }
  };

  const getUserType = (u) => {
    if (u.role === 'admin' || u.subscription_type === 'admin') return 'admin';
    if (u.subscription_type === 'recruiter') return 'recruiter';
    if (u.subscription_type === 'premium') return 'premium';
    return 'basic';
  };

  const getUserBadge = (u) => {
    const type = getUserType(u);
    switch (type) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 text-xs px-2"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'recruiter':
        return <Badge className="bg-blue-100 text-blue-700 text-xs px-2"><Briefcase className="w-3 h-3 mr-1" />Recrutador</Badge>;
      case 'premium':
        return <Badge className="bg-amber-100 text-amber-700 text-xs px-2"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 text-xs px-2"><Star className="w-3 h-3 mr-1" />Básico</Badge>;
    }
  };

  // Filtrar usuários - sem limite
  const filteredUsers = allUsers
    .filter(u => u.email !== user?.email)
    .filter(u => {
      if (activeFilter === 'all') return true;
      return getUserType(u) === activeFilter;
    })
    .filter(u => 
      !searchTerm || 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filterButtons = [
    { key: 'all', label: 'Todos', icon: Users },
    { key: 'basic', label: 'Básico', icon: Star },
    { key: 'premium', label: 'Premium', icon: Crown },
    { key: 'admin', label: 'Admin', icon: Shield },
    { key: 'recruiter', label: 'Recrutador', icon: Briefcase },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuários
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0056ff]"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-2 border-b overflow-x-auto">
              <div className="flex gap-2">
                {filterButtons.map(f => (
                  <Button
                    key={f.key}
                    variant={activeFilter === f.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(f.key)}
                    className={`rounded-full whitespace-nowrap text-xs ${activeFilter === f.key ? 'bg-[#0056ff]' : ''}`}
                  >
                    <f.icon className="w-3 h-3 mr-1" />
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`} onClick={onClose}>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={u.profile_photo} />
                          <AvatarFallback className="bg-[#0056ff] text-white">
                            {u.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`} onClick={onClose}>
                          <p className="font-semibold text-sm text-slate-800 truncate hover:text-[#0056ff]">
                            {u.full_name || 'Usuário'}
                          </p>
                        </Link>
                        {getUserBadge(u)}
                      </div>
                      <Button
                        size="sm"
                        variant={followingIds[u.email] ? 'outline' : 'default'}
                        onClick={() => handleFollow(u.email)}
                        className={`rounded-full h-8 ${followingIds[u.email] ? '' : 'bg-[#0056ff] hover:bg-[#0044cc]'}`}
                      >
                        {followingIds[u.email] ? (
                          <><UserMinus className="w-3 h-3 mr-1" />Seguindo</>
                        ) : (
                          <><UserPlus className="w-3 h-3 mr-1" />Seguir</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-slate-50">
              <p className="text-xs text-slate-500 text-center">
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}