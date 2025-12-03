import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserMinus, MessageCircle, Loader2, Crown, Shield, Briefcase, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function SocialUsers({ user }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [followingMap, setFollowingMap] = useState({});
  const [followersCount, setFollowersCount] = useState({});
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['social-users'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list('-created_date', 500);
      return allUsers.filter(u => 
        u.subscription_type && ['basic', 'premium', 'recruiter', 'admin'].includes(u.subscription_type)
      );
    }
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['all-follows'],
    queryFn: () => base44.entities.Follow.list('-created_date', 10000),
  });

  useEffect(() => {
    if (user && follows.length > 0) {
      const myFollows = {};
      const counts = {};
      follows.forEach(f => {
        if (f.follower_email === user.email) {
          myFollows[f.following_email] = f.id;
        }
        counts[f.following_email] = (counts[f.following_email] || 0) + 1;
      });
      setFollowingMap(myFollows);
      setFollowersCount(counts);
    }
  }, [user, follows]);

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (followingMap[targetEmail]) {
        await base44.entities.Follow.delete(followingMap[targetEmail]);
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetEmail
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-follows'] });
    }
  });

  const handleFollow = (targetEmail) => {
    followMutation.mutate(targetEmail);
  };

  const getPlanBadge = (u) => {
    if (u.subscription_type === 'admin' || u.role === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 border-0 text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    if (u.subscription_type === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs"><Briefcase className="w-3 h-3 mr-1" />Recrutador</Badge>;
    }
    if (u.subscription_type === 'premium') {
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 border-0 text-xs"><User className="w-3 h-3 mr-1" />Básico</Badge>;
  };

  const filteredUsers = users
    .filter(u => u.email !== user?.email)
    .filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'followers') return (followersCount[b.email] || 0) - (followersCount[a.email] || 0);
      if (sortBy === 'plan') {
        const order = { admin: 0, recruiter: 1, premium: 2, basic: 3 };
        return (order[a.subscription_type] || 3) - (order[b.subscription_type] || 3);
      }
      return (a.full_name || '').localeCompare(b.full_name || '');
    });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search & Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuários..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Alfabética</SelectItem>
            <SelectItem value="followers">Mais seguidos</SelectItem>
            <SelectItem value="plan">Por plano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Nenhum usuário encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(u => (
            <Card key={u.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`}>
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={u.profile_photo} />
                      <AvatarFallback className="bg-[#0056ff] text-white text-lg">
                        {u.full_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`${createPageUrl('SocialProfile')}?email=${u.email}`}
                      className="font-semibold text-slate-800 hover:text-[#0056ff] hover:underline block truncate"
                    >
                      {u.full_name || 'Usuário'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {getPlanBadge(u)}
                      <span className="text-xs text-slate-500">
                        {followersCount[u.email] || 0} seguidores
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={followingMap[u.email] ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollow(u.email)}
                      disabled={followMutation.isPending}
                      className={followingMap[u.email] ? "rounded-xl" : "rounded-xl bg-[#0056ff] hover:bg-[#0044cc]"}
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
                    <Link to={`${createPageUrl('SocialChat')}?email=${u.email}`}>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}