import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, ArrowLeft, Loader2, UserPlus, UserMinus, MessageCircle,
  Crown, Shield, Briefcase, Star, Filter
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserBadge from "@/components/social/UserBadge";

export default function ExploreUsers() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [follows, setFollows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadData(currentUser.email);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadData = async (email) => {
    try {
      const [usersData, followsData] = await Promise.all([
        base44.entities.User.list('-created_date', 500),
        base44.entities.Follow.filter({ follower_email: email })
      ]);
      
      setUsers(usersData?.filter(u => u.email !== email) || []);
      setFollows(followsData || []);
      
      const map = {};
      followsData?.forEach(f => { map[f.following_email] = f.id; });
      setFollowingMap(map);
    } catch (e) {}
    setLoading(false);
  };

  const handleFollow = async (targetEmail) => {
    try {
      if (followingMap[targetEmail]) {
        await base44.entities.Follow.delete(followingMap[targetEmail]);
        setFollowingMap(prev => {
          const newMap = { ...prev };
          delete newMap[targetEmail];
          return newMap;
        });
      } else {
        const newFollow = await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail
        });
        setFollowingMap(prev => ({ ...prev, [targetEmail]: newFollow.id }));
      }
    } catch (e) {}
  };

  const getUserType = (u) => {
    if (u.role === 'admin' || u.subscription_type === 'admin') return 'admin';
    if (u.subscription_type === 'recruiter') return 'recruiter';
    if (u.subscription_type === 'premium') return 'premium';
    return 'basic';
  };

  const filteredUsers = users
    .filter(u => {
      if (filter !== 'all' && getUserType(u) !== filter) return false;
      if (searchTerm && !u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link to={createPageUrl('Social')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Explorar Pessoas</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuários..."
              className="pl-10 rounded-full bg-slate-100 border-0"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-lg mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'basic', label: 'Básico', icon: Star },
              { key: 'premium', label: 'Premium', icon: Crown },
              { key: 'recruiter', label: 'Recrutador', icon: Briefcase },
              { key: 'admin', label: 'Admin', icon: Shield },
            ].map(f => (
              <Button
                key={f.key}
                variant={filter === f.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.key)}
                className={`rounded-full whitespace-nowrap ${filter === f.key ? 'bg-black text-white' : ''}`}
              >
                {f.icon && <f.icon className="w-3 h-3 mr-1" />}
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Users List */}
      <div className="max-w-lg mx-auto">
        <p className="px-4 py-2 text-sm text-slate-500">
          {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
        </p>
        
        <div className="divide-y">
          {filteredUsers.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-4">
              <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`}>
                <Avatar className="w-14 h-14 border-2 border-slate-200">
                  <AvatarImage src={u.profile_photo} />
                  <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                    {u.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`}>
                  <p className="font-semibold text-sm truncate">{u.full_name || 'Usuário'}</p>
                </Link>
                <UserBadge user={u} />
              </div>

              <div className="flex items-center gap-2">
                <Link to={`${createPageUrl('DirectMessages')}?with=${u.email}`}>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  variant={followingMap[u.email] ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleFollow(u.email)}
                  className={`rounded-xl ${!followingMap[u.email] ? 'bg-[#0056ff] hover:bg-[#0044cc]' : ''}`}
                >
                  {followingMap[u.email] ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-1" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Seguir
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}