import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, ArrowLeft, UserPlus, UserMinus, MessageSquare, 
  Loader2, Users, Filter, Briefcase, Crown, Shield, Star
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserBadge from "@/components/social/UserBadge";

export default function ExploreUsers() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loadingFollow, setLoadingFollow] = useState({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadData(currentUser);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadData = async (currentUser) => {
    try {
      const [usersData, followingData] = await Promise.all([
        base44.entities.User.list('-created_date', 500),
        base44.entities.Follow.filter({ follower_email: currentUser.email })
      ]);
      
      // Filter out current user and visitors
      const filteredUsers = (usersData || []).filter(u => 
        u.email !== currentUser.email && u.subscription_type !== 'visitor'
      );
      setUsers(filteredUsers);
      setFollowing(followingData || []);
      
      // Create map for quick lookup
      const map = {};
      followingData?.forEach(f => { map[f.following_email] = f.id; });
      setFollowingMap(map);
    } catch (e) {}
    setLoading(false);
  };

  const handleFollow = async (targetEmail) => {
    if (loadingFollow[targetEmail]) return;
    setLoadingFollow(prev => ({ ...prev, [targetEmail]: true }));

    try {
      if (followingMap[targetEmail]) {
        // Unfollow
        await base44.entities.Follow.delete(followingMap[targetEmail]);
        setFollowingMap(prev => {
          const updated = { ...prev };
          delete updated[targetEmail];
          return updated;
        });
      } else {
        // Follow
        const newFollow = await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail
        });
        setFollowingMap(prev => ({ ...prev, [targetEmail]: newFollow.id }));
      }
    } catch (e) {}
    
    setLoadingFollow(prev => ({ ...prev, [targetEmail]: false }));
  };

  const getUserType = (u) => {
    if (u.role === 'admin' || u.subscription_type === 'admin') return 'admin';
    if (u.subscription_type === 'recruiter') return 'recruiter';
    if (u.subscription_type === 'premium') return 'premium';
    return 'basic';
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const userType = getUserType(u);
    const matchesFilter = filter === 'all' || userType === filter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { id: 'all', label: 'Todos', icon: Users },
    { id: 'basic', label: 'Básico', icon: Star },
    { id: 'premium', label: 'Premium', icon: Crown },
    { id: 'recruiter', label: 'Recrutador', icon: Briefcase },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Social')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-slate-800">Explorar Usuários</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-10 rounded-xl bg-white border-0 shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {filters.map(f => (
            <Button
              key={f.id}
              variant={filter === f.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.id)}
              className={`rounded-full whitespace-nowrap ${
                filter === f.id 
                  ? 'bg-[#0056ff] hover:bg-[#0044cc]' 
                  : 'bg-white'
              }`}
            >
              <f.icon className="w-4 h-4 mr-1.5" />
              {f.label}
            </Button>
          ))}
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum usuário encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map(u => (
              <Card key={u.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`}>
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={u.profile_photo} />
                        <AvatarFallback className="bg-[#0056ff] text-white font-semibold text-lg">
                          {u.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`${createPageUrl('SocialProfile')}?email=${u.email}`}
                        className="font-semibold text-slate-800 hover:text-[#0056ff] block truncate"
                      >
                        {u.full_name}
                      </Link>
                      <UserBadge user={u} />
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`${createPageUrl('DirectMessages')}?with=${u.email}`}>
                        <Button variant="outline" size="icon" className="rounded-xl">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant={followingMap[u.email] ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleFollow(u.email)}
                        disabled={loadingFollow[u.email]}
                        className={`rounded-xl min-w-[100px] ${
                          !followingMap[u.email] ? 'bg-[#0056ff] hover:bg-[#0044cc]' : ''
                        }`}
                      >
                        {loadingFollow[u.email] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : followingMap[u.email] ? (
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}